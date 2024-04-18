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
import { MessageDirection, MessageLike } from "@eth-optimism/sdk";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import {
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  Overrides,
  PayableOverrides,
  Signer,
  ethers,
} from "ethers";
import deploy from "../../deploy.json";
import OptimismPortal from "./forge-artifacts/OptimismPortal.sol/OptimismPortal.json";
import { messenger } from "./messenger";
export type AccessList = Array<{ address: string; storageKeys: Array<string> }>;

// Input allows flexibility in describing an access list
export type AccessListish =
  | AccessList
  | Array<[string, Array<string>]>
  | Record<string, Array<string>>;

export type TransactionRequest = {
  to?: string;
  from?: string;
  nonce?: BigNumberish;

  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;

  data?: BytesLike;
  value?: BigNumberish;
  chainId?: number;

  type?: number;
  accessList?: AccessListish;

  maxPriorityFeePerGas?: BigNumberish;
  maxFeePerGas?: BigNumberish;

  customData?: Record<string, any>;
  ccipReadEnabled?: boolean;
};
type proofArgs = readonly [
  readonly [BigNumber, string, string, BigNumber, BigNumber, string],
  number,
  readonly [string, string, string, string],
  string[],
  PayableOverrides
];

export async function proveMessage(
  message: MessageLike,
  l1Wallet: ethers.Wallet,
  opts?: {
    signer?: Signer;
    overrides?: Overrides;
  },
  /**
   * The index of the withdrawal if multiple are made with multicall
   */
  messageIndex: number = 0
): Promise<[TransactionResponse, proofArgs]> {
  const [tx, proofArgs] = await populateProveMessage(
    message,
    l1Wallet,
    opts,
    messageIndex
  );
  console.log("tx", tx);
  return [await (opts?.signer || l1Wallet).sendTransaction(tx), proofArgs];
}

export async function estimateGasProveMessage(
  message: MessageLike,
  l1Wallet: ethers.Wallet,
  l1Provider: ethers.providers.StaticJsonRpcProvider,
  opts?: {
    overrides?: CallOverrides;
  },
  messageIndex = 0
): Promise<BigNumber> {
  const [tx, args] = await populateProveMessage(
    message,
    l1Wallet,
    opts,
    messageIndex
  );
  return l1Provider.estimateGas(tx);
}

export async function populateProveMessage(
  message: MessageLike,
  l1Wallet: ethers.Wallet,
  opts?: {
    overrides?: PayableOverrides;
  },
  messageIndex = 0
): Promise<[TransactionRequest, proofArgs]> {
  const resolved = await messenger.toCrossChainMessage(message, messageIndex);
  console.log("resolved", resolved);
  if (resolved.direction === MessageDirection.L1_TO_L2) {
    throw new Error("cannot finalize L1 to L2 message");
  }

  const withdrawal = await messenger.toLowLevelMessage(resolved, messageIndex);
  console.log("withdrawal", withdrawal);
  const proof = await messenger.getBedrockMessageProof(resolved, messageIndex);
  console.log("proof", proof);
  const args = [
    [
      withdrawal.messageNonce,
      withdrawal.sender,
      withdrawal.target,
      withdrawal.value,
      withdrawal.minGasLimit,
      withdrawal.message,
    ],
    proof.l2OutputIndex,
    [
      proof.outputRootProof.version,
      proof.outputRootProof.stateRoot,
      proof.outputRootProof.messagePasserStorageRoot,
      proof.outputRootProof.latestBlockhash,
    ],
    proof.withdrawalProof,
    opts?.overrides || {},
  ] as const;
  console.log("args", args);
  const OptimismPortalContract: ethers.Contract = new ethers.Contract(
    deploy["OptimismPortalProxy"],
    OptimismPortal["abi"],
    l1Wallet
  );
  return [
    await OptimismPortalContract.populateTransaction.proveWithdrawalTransaction(
      ...args
    ),
    args,
  ];
}
