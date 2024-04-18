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
export const StateCommitmentChainABI = [
  {
    inputs: [
      { internalType: "address", name: "_libAddressManager", type: "address" },
      { internalType: "uint256", name: "_fraudProofWindow", type: "uint256" },
      {
        internalType: "uint256",
        name: "_sequencerPublishWindow",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_batchIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "_batchRoot",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_batchSize",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_prevTotalElements",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "_extraData",
        type: "bytes",
      },
    ],
    name: "StateBatchAppended",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_batchIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "_batchRoot",
        type: "bytes32",
      },
    ],
    name: "StateBatchDeleted",
    type: "event",
  },
  {
    inputs: [],
    name: "FRAUD_PROOF_WINDOW",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "SEQUENCER_PUBLISH_WINDOW",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32[]", name: "_batch", type: "bytes32[]" },
      {
        internalType: "uint256",
        name: "_shouldStartAtElement",
        type: "uint256",
      },
    ],
    name: "appendStateBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "batches",
    outputs: [
      {
        internalType: "contract IChainStorageContainer",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "uint256", name: "batchIndex", type: "uint256" },
          { internalType: "bytes32", name: "batchRoot", type: "bytes32" },
          { internalType: "uint256", name: "batchSize", type: "uint256" },
          {
            internalType: "uint256",
            name: "prevTotalElements",
            type: "uint256",
          },
          { internalType: "bytes", name: "extraData", type: "bytes" },
        ],
        internalType: "struct Lib_OVMCodec.ChainBatchHeader",
        name: "_batchHeader",
        type: "tuple",
      },
    ],
    name: "deleteStateBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getLastSequencerTimestamp",
    outputs: [
      {
        internalType: "uint256",
        name: "_lastSequencerTimestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalBatches",
    outputs: [
      { internalType: "uint256", name: "_totalBatches", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalElements",
    outputs: [
      { internalType: "uint256", name: "_totalElements", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "uint256", name: "batchIndex", type: "uint256" },
          { internalType: "bytes32", name: "batchRoot", type: "bytes32" },
          { internalType: "uint256", name: "batchSize", type: "uint256" },
          {
            internalType: "uint256",
            name: "prevTotalElements",
            type: "uint256",
          },
          { internalType: "bytes", name: "extraData", type: "bytes" },
        ],
        internalType: "struct Lib_OVMCodec.ChainBatchHeader",
        name: "_batchHeader",
        type: "tuple",
      },
    ],
    name: "insideFraudProofWindow",
    outputs: [{ internalType: "bool", name: "_inside", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "libAddressManager",
    outputs: [
      {
        internalType: "contract Lib_AddressManager",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_name", type: "string" }],
    name: "resolve",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_element", type: "bytes32" },
      {
        components: [
          { internalType: "uint256", name: "batchIndex", type: "uint256" },
          { internalType: "bytes32", name: "batchRoot", type: "bytes32" },
          { internalType: "uint256", name: "batchSize", type: "uint256" },
          {
            internalType: "uint256",
            name: "prevTotalElements",
            type: "uint256",
          },
          { internalType: "bytes", name: "extraData", type: "bytes" },
        ],
        internalType: "struct Lib_OVMCodec.ChainBatchHeader",
        name: "_batchHeader",
        type: "tuple",
      },
      {
        components: [
          { internalType: "uint256", name: "index", type: "uint256" },
          { internalType: "bytes32[]", name: "siblings", type: "bytes32[]" },
        ],
        internalType: "struct Lib_OVMCodec.ChainInclusionProof",
        name: "_proof",
        type: "tuple",
      },
    ],
    name: "verifyStateCommitment",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];
