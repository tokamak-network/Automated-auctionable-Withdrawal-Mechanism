// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Types, IOptimismPortal, IL2Oracle, IL1CrossDomainMessenger, IL1StandardBridge} from "./interfaces/Interfaces.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FastWithdraw {
    using SafeERC20 for IERC20;
    /* type declarations */

    /* constants */
    /// @notice Special address to be used as the tx origin for gas estimation calls in the
    ///         OptimismPortal and CrossDomainMessenger calls. You only need to use this address if
    ///         the minimum gas limit specified by the user is not actually enough to execute the
    ///         given message and you're attempting to estimate the actual necessary gas limit. We
    ///         use address(1) because it's the ecrecover precompile and therefore guaranteed to
    ///         never have any code on any EVM chain.
    address internal constant ESTIMATION_ADDRESS = address(1);
    /// @notice Gas reserved for finalizing the execution of `relayMessage` after the safe call.
    uint64 public constant RELAY_RESERVED_GAS = 40_000;
    /// @notice Gas reserved for the execution between the `hasMinGas` check and the external
    ///         call in `relayMessage`.
    uint64 public constant RELAY_GAS_CHECK_BUFFER = 5_000;
    bytes4 private constant RELAY_MESSAGE_SELECTOR = 0xd764ad0b;
    bytes4 private constant FINALIZE_BRIDGE_ERC20_SELECTOR = 0x0166a07a;

    /* state variables */
    /// @notice Address of the sender of the currently executing message on the other chain. If the
    ///         value of this variable is the default value (0x00000000...dead) then no message is
    ///         currently being executed. Use the xDomainMessageSender getter which will throw an
    ///         error if this is the case.
    address internal xDomainMsgSender;
    IOptimismPortal private s_optimismPortal;
    IL2Oracle private s_l2Oracle;
    IL1CrossDomainMessenger private s_l1CrossDomainMessenger;
    address private s_l2CrossDomainMessenger;
    IL1StandardBridge private s_l1StandardBridge;
    address private s_l2StandardBridge;

    /* constructor */
    constructor(
        IOptimismPortal _optimismPortal,
        IL2Oracle _l2Oracle,
        IL1CrossDomainMessenger _l1CrossDomainMessenger,
        address _l2CrossDomainMessenger,
        IL1StandardBridge _l1StandardBridge,
        address _l2StandardBridge
    ) {
        s_optimismPortal = _optimismPortal;
        s_l2Oracle = _l2Oracle;
        s_l1CrossDomainMessenger = _l1CrossDomainMessenger;
        s_l2CrossDomainMessenger = _l2CrossDomainMessenger;
        s_l1StandardBridge = _l1StandardBridge;
        s_l2StandardBridge = _l2StandardBridge;
    }

    receive() external payable {}

    function proveAndRequestFW(
        Types.WithdrawalTransaction memory _tx,
        uint256 _l2OutputIndex,
        Types.OutputRootProof calldata _outputRootProof,
        bytes[] calldata _withdrawalProof
    ) public {
        // check
        require(_tx.sender == msg.sender, "FW: _tx.sender must be msg.sender");
        require(
            _tx.target == address(this),
            "FW: _tx.target address must be this contract"
        );

        // prove
        IOptimismPortal optimismPortal = s_optimismPortal;
        optimismPortal.proveWithdrawalTransaction(
            _tx,
            _l2OutputIndex,
            _outputRootProof,
            _withdrawalProof
        );

        isWithdrawalProven(
            optimismPortal.provenWithdrawals(
                keccak256(
                    abi.encode(
                        _tx.nonce,
                        msg.sender,
                        address(this),
                        _tx.value,
                        _tx.gasLimit,
                        _tx.data
                    )
                )
            ),
            s_l2Oracle
        );

        // *** FW logic from here ***
        // send value 90%
        bool success = send(_tx.sender, gasleft(), (_tx.value * 9) / 10);
        require(success, "FW: failed to send value to sender");
    }

    function requestFWERC20(Types.WithdrawalTx memory withdrawalTx) public {
        IOptimismPortal optimismPortal = s_optimismPortal;

        bytes32 withdrawalHash = keccak256(
            abi.encode(
                withdrawalTx.nonce,
                s_l2CrossDomainMessenger,
                s_l1CrossDomainMessenger,
                withdrawalTx.value,
                withdrawalTx.gasLimit,
                withdrawalTx.data
            )
        );
        isWithdrawalProven(
            optimismPortal.provenWithdrawals(withdrawalHash),
            s_l2Oracle
        );

        // Check that this withdrawal has not already been finalized
        require(
            !optimismPortal.finalizedWithdrawals(withdrawalHash),
            "FW: withdrawal has already been finalized"
        );

        (
            bytes4 _relayMessageSelector,
            uint256 _nonce,
            address _sender,
            address _target,
            uint256 _value,
            uint256 _minGasLimit,
            bytes memory _message
        ) = abiDecodeRelayMessage(withdrawalTx.data);
        require(
            _relayMessageSelector == RELAY_MESSAGE_SELECTOR,
            "FW: fs not relayMessage"
        );
        require(_sender == s_l2StandardBridge, "FW: sender not l2bridge");
        require(
            _target == address(s_l1StandardBridge),
            "FW: target not l1bridge"
        );
        (, uint16 version) = decodeVersionedNonce(_nonce);

        require(
            version < 2,
            "CrossDomainMessenger: only version 0 or 1 messages are supported at this time"
        );

        // If the message is version 0, then it's a migrated legacy withdrawal. We therefore need
        // to check that the legacy version of the message has not already been relayed.
        if (version == 0) {
            bytes32 oldHash = hashCrossDomainMessageV0(
                _target,
                _sender,
                _message,
                _nonce
            );
            require(
                s_l1CrossDomainMessenger.successfulMessages(oldHash) == false,
                "CrossDomainMessenger: legacy withdrawal already relayed"
            );
        }

        // We use the v1 message hash as the unique identifier for the message because it commits
        // to the value and minimum gas limit of the message.
        bytes32 versionedHash = hashCrossDomainMessageV1(
            _nonce,
            _sender,
            _target,
            _value,
            _minGasLimit,
            _message
        );

        // if (_isOtherMessenger()) {
        //     // These properties should always hold when the message is first submitted (as
        //     // opposed to being replayed).
        //     assert(msg.value == _value);
        assert(_value == 0);
        assert(!s_l1CrossDomainMessenger.failedMessages(versionedHash));
        // } else {
        //     require(
        //         msg.value == 0,
        //         "CrossDomainMessenger: value must be zero unless message is from a system address"
        //     );

        //     require(
        //         s_l1CrossDomainMessenger.failedMessages(versionedHash),
        //         "CrossDomainMessenger: message cannot be replayed"
        //     );
        // }

        require(
            _isUnsafeTarget(_target) == false,
            "CrossDomainMessenger: cannot send message to blocked system address"
        );

        require(
            s_l1CrossDomainMessenger.successfulMessages(versionedHash) == false,
            "CrossDomainMessenger: message has already been relayed"
        );

        // If there is not enough gas left to perform the external call and finish the execution,
        // return early and assign the message to the failedMessages mapping.
        // We are asserting that we have enough gas to:
        // 1. Call the target contract (_minGasLimit + RELAY_CALL_OVERHEAD + RELAY_GAS_CHECK_BUFFER)
        //   1.a. The RELAY_CALL_OVERHEAD is included in `hasMinGas`.
        // 2. Finish the execution after the external call (RELAY_RESERVED_GAS).
        //
        // If `xDomainMsgSender` is not the default L2 sender, this function
        // is being re-entered. This marks the message as failed to allow it to be replayed.
        if (
            !hasMinGas(
                _minGasLimit,
                RELAY_RESERVED_GAS + RELAY_GAS_CHECK_BUFFER
            )
        ) {
            // Revert in this case if the transaction was triggered by the estimation address. This
            // should only be possible during gas estimation or we have bigger problems. Reverting
            // here will make the behavior of gas estimation change such that the gas limit
            // computed will be the amount required to relay the message, even if that amount is
            // greater than the minimum gas limit specified by the user.
            if (tx.origin == ESTIMATION_ADDRESS) {
                revert("CrossDomainMessenger: failed to relay message");
            }

            // s_l1CrossDomainMessenger.failedMessages(versionedHash) = true;
            // emit FailedRelayedMessage(versionedHash);
            revert("CrossDomainMessenger: insufficient gas to relay message");
        }

        (
            bytes4 _finalizeBridgeERC20Selector,
            address _localToken,
            address _remoteToken,
            address _from,
            address _to,
            uint256 _amount,

        ) = abiDecodeFinalizeERC20(_message);
        require(
            _finalizeBridgeERC20Selector == FINALIZE_BRIDGE_ERC20_SELECTOR,
            "FW: fs not finalizeBridgeERC20"
        );
        require(_from == msg.sender, "FW: _from must be msg.sender");
        require(_to == address(this), "FW: _to must be this contract");
        require(
            s_l1StandardBridge.deposits(_localToken, _remoteToken) >= _amount,
            "FW: insufficient deposit"
        );

        // *** FW logic from here ***
        IERC20(_localToken).safeTransfer(_to, (_amount * 9) / 10);
    }

    function requestFWETH(Types.WithdrawalTx memory withdrawalTx) public {
        IOptimismPortal optimismPortal = s_optimismPortal;

        bytes32 withdrawalHash = keccak256(
            abi.encode(
                withdrawalTx.nonce,
                msg.sender,
                address(this),
                withdrawalTx.value,
                withdrawalTx.gasLimit,
                withdrawalTx.data
            )
        );

        isWithdrawalProven(
            optimismPortal.provenWithdrawals(withdrawalHash),
            s_l2Oracle
        );

        // Check that this withdrawal has not already been finalized
        require(
            !optimismPortal.finalizedWithdrawals(withdrawalHash),
            "FW: withdrawal has already been finalized"
        );

        // *** FW logic from here ***
        bool success = send(
            msg.sender,
            gasleft(),
            (withdrawalTx.value * 9) / 10
        );
        require(success, "FW: failed to send value to sender");
    }

    /// @notice Determines whether the finalization period has elapsed with respect to
    ///         the provided block timestamp.
    /// @param _timestamp Timestamp to check.
    /// @return Whether or not the finalization period has elapsed.
    function _isFinalizationPeriodElapsed(
        uint256 _timestamp,
        IL2Oracle l2Oracle
    ) internal view returns (bool) {
        return
            block.timestamp > _timestamp + l2Oracle.finalizationPeriodSeconds();
    }

    function isWithdrawalProven(
        IOptimismPortal.ProvenWithdrawal memory provenWithdrawal,
        IL2Oracle l2Oracle
    ) internal view {
        // We know that a withdrawal has
        // been proven at least once when its timestamp is non-zero. Unproven withdrawals will have
        // a timestamp of zero.
        require(
            provenWithdrawal.timestamp != 0,
            "FW: withdrawal has not been proven yet"
        );

        // As a sanity check, we make sure that the proven withdrawal's timestamp is greater than
        // starting timestamp inside the L2OutputOracle. Not strictly necessary but extra layer of
        // safety against weird bugs in the proving step.
        require(
            provenWithdrawal.timestamp >= l2Oracle.startingTimestamp(),
            "FW: withdrawal timestamp less than L2 Oracle starting timestamp"
        );

        require(
            !_isFinalizationPeriodElapsed(provenWithdrawal.timestamp, l2Oracle),
            "FW: proven withdrawal finalization period has elapsed"
        );

        // Grab the OutputProposal from the L2OutputOracle, will revert if the output that
        // corresponds to the given index has not been proposed yet.
        IL2Oracle.OutputProposal memory proposal = l2Oracle.getL2Output(
            provenWithdrawal.l2OutputIndex
        );

        // Check that the output root that was used to prove the withdrawal is the same as the
        // current output root for the given output index. An output root may change if it is
        // deleted by the challenger address and then re-proposed.
        require(
            proposal.outputRoot == provenWithdrawal.outputRoot,
            "FW: output root proven is not the same as current output root"
        );

        // Check that the output proposal has also been finalized.
        require(
            !_isFinalizationPeriodElapsed(proposal.timestamp, l2Oracle),
            "FW: output proposal finalization period has elapsed"
        );
    }

    /// @notice Performs a low level call without copying any returndata.
    /// @dev Passes no calldata to the call context.
    /// @param _target   Address to call
    /// @param _gas      Amount of gas to pass to the call
    /// @param _value    Amount of value to pass to the call
    function send(
        address _target,
        uint256 _gas,
        uint256 _value
    ) internal returns (bool) {
        bool _success;
        assembly {
            _success := call(
                _gas, // gas
                _target, // recipient
                _value, // ether value
                0, // inloc
                0, // inlen
                0, // outloc
                0 // outlen
            )
        }
        return _success;
    }

    /// @notice Pulls the version out of a version-encoded nonce.
    /// @param _nonce Message nonce with version encoded into the first two bytes.
    /// @return Nonce without encoded version.
    /// @return Version of the message.
    function decodeVersionedNonce(
        uint256 _nonce
    ) internal pure returns (uint240, uint16) {
        uint240 nonce;
        uint16 version;
        assembly {
            nonce := and(
                _nonce,
                0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
            )
            version := shr(240, _nonce)
        }
        return (nonce, version);
    }

    /// @notice Hashes a cross domain message based on the V0 (legacy) encoding.
    /// @param _target Address of the target of the message.
    /// @param _sender Address of the sender of the message.
    /// @param _data   Data to send with the message.
    /// @param _nonce  Message nonce.
    /// @return Hashed cross domain message.
    function hashCrossDomainMessageV0(
        address _target,
        address _sender,
        bytes memory _data,
        uint256 _nonce
    ) internal pure returns (bytes32) {
        return
            keccak256(
                encodeCrossDomainMessageV0(_target, _sender, _data, _nonce)
            );
    }

    /// @notice Encodes a cross domain message based on the V0 (legacy) encoding.
    /// @param _target Address of the target of the message.
    /// @param _sender Address of the sender of the message.
    /// @param _data   Data to send with the message.
    /// @param _nonce  Message nonce.
    /// @return Encoded cross domain message.
    function encodeCrossDomainMessageV0(
        address _target,
        address _sender,
        bytes memory _data,
        uint256 _nonce
    ) internal pure returns (bytes memory) {
        return
            abi.encodeWithSignature(
                "relayMessage(address,address,bytes,uint256)",
                _target,
                _sender,
                _data,
                _nonce
            );
    }

    /// @notice Hashes a cross domain message based on the V1 (current) encoding.
    /// @param _nonce    Message nonce.
    /// @param _sender   Address of the sender of the message.
    /// @param _target   Address of the target of the message.
    /// @param _value    ETH value to send to the target.
    /// @param _gasLimit Gas limit to use for the message.
    /// @param _data     Data to send with the message.
    /// @return Hashed cross domain message.
    function hashCrossDomainMessageV1(
        uint256 _nonce,
        address _sender,
        address _target,
        uint256 _value,
        uint256 _gasLimit,
        bytes memory _data
    ) internal pure returns (bytes32) {
        return
            keccak256(
                encodeCrossDomainMessageV1(
                    _nonce,
                    _sender,
                    _target,
                    _value,
                    _gasLimit,
                    _data
                )
            );
    }

    /// @notice Encodes a cross domain message based on the V1 (current) encoding.
    /// @param _nonce    Message nonce.
    /// @param _sender   Address of the sender of the message.
    /// @param _target   Address of the target of the message.
    /// @param _value    ETH value to send to the target.
    /// @param _gasLimit Gas limit to use for the message.
    /// @param _data     Data to send with the message.
    /// @return Encoded cross domain message.
    function encodeCrossDomainMessageV1(
        uint256 _nonce,
        address _sender,
        address _target,
        uint256 _value,
        uint256 _gasLimit,
        bytes memory _data
    ) internal pure returns (bytes memory) {
        return
            abi.encodeWithSignature(
                "relayMessage(uint256,address,address,uint256,uint256,bytes)",
                _nonce,
                _sender,
                _target,
                _value,
                _gasLimit,
                _data
            );
    }

    // function _isOtherMessenger() internal view returns (bool) {
    //     return
    //         msg.sender == address(s_optimismPortal) &&
    //         s_optimismPortal.l2Sender() == address(s_l2CrossDomainMessenger);
    // }

    function _isUnsafeTarget(address _target) internal view returns (bool) {
        return _target == address(this) || _target == address(s_optimismPortal);
    }

    /// @notice Helper function to determine if there is sufficient gas remaining within the context
    ///         to guarantee that the minimum gas requirement for a call will be met as well as
    ///         optionally reserving a specified amount of gas for after the call has concluded.
    /// @param _minGas      The minimum amount of gas that may be passed to the target context.
    /// @param _reservedGas Optional amount of gas to reserve for the caller after the execution
    ///                     of the target context.
    /// @return `true` if there is enough gas remaining to safely supply `_minGas` to the target
    ///         context as well as reserve `_reservedGas` for the caller after the execution of
    ///         the target context.
    /// @dev !!!!! FOOTGUN ALERT !!!!!
    ///      1.) The 40_000 base buffer is to account for the worst case of the dynamic cost of the
    ///          `CALL` opcode's `address_access_cost`, `positive_value_cost`, and
    ///          `value_to_empty_account_cost` factors with an added buffer of 5,700 gas. It is
    ///          still possible to self-rekt by initiating a withdrawal with a minimum gas limit
    ///          that does not account for the `memory_expansion_cost` & `code_execution_cost`
    ///          factors of the dynamic cost of the `CALL` opcode.
    ///      2.) This function should *directly* precede the external call if possible. There is an
    ///          added buffer to account for gas consumed between this check and the call, but it
    ///          is only 5,700 gas.
    ///      3.) Because EIP-150 ensures that a maximum of 63/64ths of the remaining gas in the call
    ///          frame may be passed to a subcontext, we need to ensure that the gas will not be
    ///          truncated.
    ///      4.) Use wisely. This function is not a silver bullet.
    function hasMinGas(
        uint256 _minGas,
        uint256 _reservedGas
    ) internal view returns (bool) {
        bool _hasMinGas;
        assembly {
            // Equation: gas × 63 ≥ minGas × 64 + 63(40_000 + reservedGas)
            _hasMinGas := iszero(
                lt(
                    mul(gas(), 63),
                    add(mul(_minGas, 64), mul(add(40000, _reservedGas), 63))
                )
            )
        }
        return _hasMinGas;
    }

    function abiDecodeRelayMessage(
        bytes memory _data
    )
        internal
        pure
        returns (
            bytes4 sig,
            uint256 nonce,
            address sender,
            address target,
            uint256 value,
            uint256 minGasLimit,
            bytes memory message
        )
    {
        assembly {
            sig := mload(add(_data, 32))
            nonce := mload(add(_data, 36))
            sender := mload(add(_data, 68))
            target := mload(add(_data, 100))
            value := mload(add(_data, 132))
            minGasLimit := mload(add(_data, 164))
            message := add(_data, 228)
        }
    }

    function abiDecodeFinalizeERC20(
        bytes memory _data
    )
        internal
        pure
        returns (
            bytes4 sig,
            address localToken,
            address remoteToken,
            address from,
            address to,
            uint256 amount,
            bytes memory extraData
        )
    {
        assembly {
            sig := mload(add(_data, 32))
            localToken := mload(add(_data, 36))
            remoteToken := mload(add(_data, 68))
            from := mload(add(_data, 100))
            to := mload(add(_data, 132))
            amount := mload(add(_data, 164))
            extraData := add(_data, 228)
        }
    }
}
