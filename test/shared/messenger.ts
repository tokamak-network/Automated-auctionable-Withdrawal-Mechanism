// Copyright 2024 justin
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { CrossChainMessenger } from "@eth-optimism/sdk";
import { ethers } from "ethers";
import deploy from "../../deploy.json";
import l2Address from "../../l2Address.json";
import { privateKeys as privateKeysDevent } from "./Accounts";
import { CanonicalTransactionChainABI } from "./abis/CanonicalTransactionChainABI";
import { LegacyErc20ETHABI } from "./abis/LegacyERC20ETHABI";
import { StateCommitmentChainABI } from "./abis/StateCommitmentChainABI";
import AddressManager from "./forge-artifacts/AddressManager.sol/AddressManager.json";
import DeployerWhitelist from "./forge-artifacts/DeployerWhitelist.sol/DeployerWhitelist.json";
import GasPriceOracle from "./forge-artifacts/GasPriceOracle.sol/GasPriceOracle.json";
import L1BlockNumber from "./forge-artifacts/L1BlockNumber.sol/L1BlockNumber.json";
import L1CrossDomainMessenger from "./forge-artifacts/L1CrossDomainMessenger.sol/L1CrossDomainMessenger.json";
import L1StandardBridge from "./forge-artifacts/L1StandardBridge.sol/L1StandardBridge.json";
import L2CrossDomainMessenger from "./forge-artifacts/L2CrossDomainMessenger.sol/L2CrossDomainMessenger.json";
import L2OutputOracle from "./forge-artifacts/L2OutputOracle.sol/L2OutputOracle.json";
import L2StandardBridge from "./forge-artifacts/L2StandardBridge.sol/L2StandardBridge.json";
import L2ToL1MessagePasser from "./forge-artifacts/L2ToL1MessagePasser.sol/L2ToL1MessagePasser.json";
import OptimismPortal from "./forge-artifacts/OptimismPortal.sol/OptimismPortal.json";
import SequencerFeeVault from "./forge-artifacts/SequencerFeeVault.sol/SequencerFeeVault.json";
import WETH9 from "./forge-artifacts/WETH9.sol/WETH9.json";
const privateKeys = privateKeysDevent;
const privateKey = privateKeys[9];
const l1Provider = new ethers.providers.StaticJsonRpcProvider(
  "http://127.0.0.1:8545/"
);
const l2Provider = new ethers.providers.StaticJsonRpcProvider(
  "http://127.0.0.1:9545/"
);
const l1Wallet = new ethers.Wallet(privateKey, l1Provider);
const l2Wallet = new ethers.Wallet(privateKey, l2Provider);
export const messenger = new CrossChainMessenger({
  l1ChainId: 900,
  l2ChainId: 901,
  l1SignerOrProvider: l1Wallet,
  l2SignerOrProvider: l2Wallet,
  contracts: {
    l1: {
      AddressManager: new ethers.Contract(
        deploy["AddressManager"],
        AddressManager["abi"],
        l1Wallet
      ),
      L1CrossDomainMessenger: new ethers.Contract(
        deploy["L1CrossDomainMessengerProxy"],
        L1CrossDomainMessenger["abi"],
        l1Wallet
      ),
      L1StandardBridge: new ethers.Contract(
        deploy["L1StandardBridgeProxy"],
        L1StandardBridge["abi"],
        l1Wallet
      ),
      StateCommitmentChain: new ethers.Contract(
        "0xBe5dAb4A2e9cd0F27300dB4aB94BeE3A233AEB19",
        StateCommitmentChainABI,
        l1Wallet
      ),
      CanonicalTransactionChain: new ethers.Contract(
        "0x5E4e65926BA27467555EB562121fac00D24E9dD2",
        CanonicalTransactionChainABI,
        l1Wallet
      ),
      BondManager: new ethers.Contract(
        ethers.constants.AddressZero,
        [],
        l1Wallet
      ),
      OptimismPortal: new ethers.Contract(
        deploy["OptimismPortalProxy"],
        OptimismPortal["abi"],
        l1Wallet
      ),
      L2OutputOracle: new ethers.Contract(
        deploy["L2OutputOracleProxy"],
        L2OutputOracle["abi"],
        l1Wallet
      ),
    },
    l2: {
      L2CrossDomainMessenger: new ethers.Contract(
        l2Address["L2CrossDomainMessenger"],
        L2CrossDomainMessenger["abi"],
        l2Wallet
      ),
      L2StandardBridge: new ethers.Contract(
        l2Address["L2StandardBridge"],
        L2StandardBridge["abi"],
        l2Wallet
      ),
      L2ToL1MessagePasser: new ethers.Contract(
        l2Address["L2ToL1MessagePasser"],
        L2ToL1MessagePasser["abi"],
        l2Wallet
      ),
      OVM_L1BlockNumber: new ethers.Contract(
        l2Address["L1BlockNumber"],
        L1BlockNumber["abi"],
        l2Wallet
      ),
      OVM_L2ToL1MessagePasser: new ethers.Contract(
        l2Address["L2ToL1MessagePasser"],
        L2ToL1MessagePasser["abi"],
        l2Wallet
      ),
      OVM_DeployerWhitelist: new ethers.Contract(
        l2Address["DeployerWhitelist"],
        DeployerWhitelist["abi"],
        l2Wallet
      ),
      OVM_ETH: new ethers.Contract(
        l2Address["LegacyERC20ETH"],
        LegacyErc20ETHABI,
        l2Wallet
      ),
      OVM_GasPriceOracle: new ethers.Contract(
        l2Address["GasPriceOracle"],
        GasPriceOracle["abi"],
        l2Wallet
      ),
      OVM_SequencerFeeVault: new ethers.Contract(
        l2Address["SequencerFeeVault"],
        SequencerFeeVault["abi"],
        l2Wallet
      ),
      WETH: new ethers.Contract(
        "0x4200000000000000000000000000000000000006",
        WETH9["abi"],
        l2Wallet
      ),
      BedrockMessagePasser: new ethers.Contract(
        l2Address["L2ToL1MessagePasser"],
        L2ToL1MessagePasser["abi"],
        l2Wallet
      ),
    },
  },
});
