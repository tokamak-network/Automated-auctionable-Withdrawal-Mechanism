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
import { defineChain } from "viem";
import { chainConfig } from "viem/op-stack";
import afterDevnetUp from "./afterDevnetUp.deploy.json";
import deployAddresses from "./deploy.json";
const sourceId = 900; // mainnet

export const mainnetLocal = /*#__PURE__*/ defineChain({
  id: sourceId,
  name: "Ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545/"],
    },
  },
  // blockExplorers: {
  //   default: {
  //     name: "Etherscan",
  //     url: "https://etherscan.io",
  //     apiUrl: "https://api.etherscan.io/api",
  //   },
  // },
  contracts: {
    ensRegistry: {
      address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    },
    ensUniversalResolver: {
      address: "0xce01f8eee7E479C928F8919abD53E553a36CeF67",
      blockCreated: 19_258_213,
    },
    multicall3: {
      address: afterDevnetUp["Multicall3"] as `0x${string}`,
    },
  },
});

export const optimismLocal = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 901,
  account: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  name: "OP Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:9545/"],
    },
  },
  // blockExplorers: {
  //   default: {
  //     name: "Optimism Explorer",
  //     url: "https://optimistic.etherscan.io",
  //     apiUrl: "https://api-optimistic.etherscan.io/api",
  //   },
  // },
  contracts: {
    ...chainConfig.contracts,
    l2OutputOracle: {
      [sourceId]: {
        //address: "0x59b670e9fA9D0A427751Af201D676719a970857b",
        address: deployAddresses.L2OutputOracleProxy as `0x${string}`,
      },
    },
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      // blockCreated: 4286263,
    },
    portal: {
      [sourceId]: {
        //address: "0x9A676e781A523b5d0C0e43731313A708CB607508",
        address: deployAddresses.OptimismPortalProxy as `0x${string}`,
        //address: "0x5caBe6e2F2f2b864169ef22cF9B94b0c3EDb0a3C",
      },
      //address: "0x4200000000000000000000000000000000000062",
    },
    l1StandardBridge: {
      [sourceId]: {
        //address: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
        address: deployAddresses.L1StandardBridgeProxy as `0x${string}`,
      },
    },
    disputeGameFactory: {
      [sourceId]: {
        //address: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
        address: deployAddresses.DisputeGameFactoryProxy as `0x${string}`,
      },
    },
  },
  sourceId,
});
