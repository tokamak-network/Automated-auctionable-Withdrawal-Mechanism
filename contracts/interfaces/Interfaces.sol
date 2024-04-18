// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import {Types} from "../libraries/Types.sol";

interface IL1CrossDomainMessenger {
    /// @notice Mapping of message hashes to boolean receipt values. Note that a message will only
    ///         be present in this mapping if it has successfully been relayed on this chain, and
    ///         can therefore not be relayed again.
    //mapping(bytes32 => bool) public successfulMessages;
    function successfulMessages(bytes32) external view returns (bool);

    /// @notice Mapping of message hashes to a boolean if and only if the message has failed to be
    ///         executed at least once. A message will not be present in this mapping if it
    ///         successfully executed on the first attempt.
    //mapping(bytes32 => bool) public failedMessages;
    function failedMessages(bytes32) external view returns (bool);
}

interface IL1StandardBridge {
    /// @notice Mapping that stores deposits for a given pair of local and remote tokens.
    //mapping(address => mapping(address => uint256)) public deposits;
    function deposits(address, address) external view returns (uint256);
}

interface IL2Oracle {
    /// @notice OutputProposal represents a commitment to the L2 state. The timestamp is the L1
    ///         timestamp that the output root is posted. This timestamp is used to verify that the
    ///         finalization period has passed since the output root was submitted.
    /// @custom:field outputRoot    Hash of the L2 output.
    /// @custom:field timestamp     Timestamp of the L1 block that the output root was submitted in.
    /// @custom:field l2BlockNumber L2 block number that the output corresponds to.
    struct OutputProposal {
        bytes32 outputRoot;
        uint128 timestamp;
        uint128 l2BlockNumber;
    }

    /// @notice Returns an output by index. Needed to return a struct instead of a tuple.
    /// @param _l2OutputIndex Index of the output to return.
    /// @return The output at the given index.
    function getL2Output(
        uint256 _l2OutputIndex
    ) external view returns (OutputProposal memory);

    /// @notice The timestamp of the first L2 block recorded in this contract.
    function startingTimestamp() external view returns (uint256);

    /// @notice The minimum time (in seconds) that must elapse before a withdrawal can be finalized.
    /// @custom:network-specific
    function finalizationPeriodSeconds() external view returns (uint256);
}

interface IOptimismPortal {
    /// @notice Represents a proven withdrawal.
    /// @custom:field outputRoot    Root of the L2 output this was proven against.
    /// @custom:field timestamp     Timestamp at whcih the withdrawal was proven.
    /// @custom:field l2OutputIndex Index of the output this was proven against.
    struct ProvenWithdrawal {
        bytes32 outputRoot;
        uint128 timestamp;
        uint128 l2OutputIndex;
    }

    function finalizedWithdrawals(bytes32) external view returns (bool);

    //mapping(bytes32 => ProvenWithdrawal) public provenWithdrawals;
    function provenWithdrawals(
        bytes32
    ) external view returns (ProvenWithdrawal memory);

    /// @notice Proves a withdrawal transaction.
    /// @param _tx              Withdrawal transaction to finalize.
    /// @param _l2OutputIndex   L2 output index to prove against.
    /// @param _outputRootProof Inclusion proof of the L2ToL1MessagePasser contract's storage root.
    /// @param _withdrawalProof Inclusion proof of the withdrawal in L2ToL1MessagePasser contract.
    function proveWithdrawalTransaction(
        Types.WithdrawalTransaction memory _tx,
        uint256 _l2OutputIndex,
        Types.OutputRootProof calldata _outputRootProof,
        bytes[] calldata _withdrawalProof
    ) external;

    /// @notice Address of the L2 account which initiated a withdrawal in this transaction.
    ///         If the of this variable is the default L2 sender address, then we are NOT inside of
    ///         a call to finalizeWithdrawalTransaction.
    //address public l2Sender;
    function l2Sender() external view returns (address);
}
