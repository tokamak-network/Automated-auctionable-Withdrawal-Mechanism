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
export const CanonicalTransactionChainABI = [
  {
    inputs: [
      { internalType: "address", name: "_libAddressManager", type: "address" },
      {
        internalType: "uint256",
        name: "_maxTransactionGasLimit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_l2GasDiscountDivisor",
        type: "uint256",
      },
      { internalType: "uint256", name: "_enqueueGasCost", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "l2GasDiscountDivisor",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "enqueueGasCost",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "enqueueL2GasPrepaid",
        type: "uint256",
      },
    ],
    name: "L2GasParamsUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_startingQueueIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_numQueueElements",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_totalElements",
        type: "uint256",
      },
    ],
    name: "QueueBatchAppended",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_startingQueueIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_numQueueElements",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_totalElements",
        type: "uint256",
      },
    ],
    name: "SequencerBatchAppended",
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
    name: "TransactionBatchAppended",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_l1TxOrigin",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_gasLimit",
        type: "uint256",
      },
      { indexed: false, internalType: "bytes", name: "_data", type: "bytes" },
      {
        indexed: true,
        internalType: "uint256",
        name: "_queueIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_timestamp",
        type: "uint256",
      },
    ],
    name: "TransactionEnqueued",
    type: "event",
  },
  {
    inputs: [],
    name: "MAX_ROLLUP_TX_SIZE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_ROLLUP_TX_GAS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "appendSequencerBatch",
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
      { internalType: "address", name: "_target", type: "address" },
      { internalType: "uint256", name: "_gasLimit", type: "uint256" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    name: "enqueue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "enqueueGasCost",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "enqueueL2GasPrepaid",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getLastBlockNumber",
    outputs: [{ internalType: "uint40", name: "", type: "uint40" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getLastTimestamp",
    outputs: [{ internalType: "uint40", name: "", type: "uint40" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getNextQueueIndex",
    outputs: [{ internalType: "uint40", name: "", type: "uint40" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getNumPendingQueueElements",
    outputs: [{ internalType: "uint40", name: "", type: "uint40" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_index", type: "uint256" }],
    name: "getQueueElement",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "transactionHash", type: "bytes32" },
          { internalType: "uint40", name: "timestamp", type: "uint40" },
          { internalType: "uint40", name: "blockNumber", type: "uint40" },
        ],
        internalType: "struct Lib_OVMCodec.QueueElement",
        name: "_element",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getQueueLength",
    outputs: [{ internalType: "uint40", name: "", type: "uint40" }],
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
    inputs: [],
    name: "l2GasDiscountDivisor",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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
    inputs: [],
    name: "maxTransactionGasLimit",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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
      {
        internalType: "uint256",
        name: "_l2GasDiscountDivisor",
        type: "uint256",
      },
      { internalType: "uint256", name: "_enqueueGasCost", type: "uint256" },
    ],
    name: "setGasParams",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
