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

import { hashCrossDomainMessagev1 } from "@eth-optimism/core-utils";
import { MessageDirection, MessageLike } from "@eth-optimism/sdk";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber, CallOverrides, PayableOverrides, Signer } from "ethers";
import { messenger } from "./messenger";
import { TransactionRequest } from "./proveWithdrawERC20";

interface AggregateError extends Error {
  errors: any[];
}
interface AggregateErrorConstructor {
  new (errors: Iterable<any>, message?: string): AggregateError;
  (errors: Iterable<any>, message?: string): AggregateError;
  readonly prototype: AggregateError;
}
declare var AggregateError: AggregateErrorConstructor;

export async function finalizeMessage(
  message: MessageLike,
  opts?: {
    signer?: Signer;
    overrides?: PayableOverrides;
  },
  messageIndex = 0
): Promise<TransactionResponse> {
  return (opts?.signer || messenger.l1Signer).sendTransaction(
    await populateFinalizeMessage(message, opts, messageIndex)
  );
}

export async function estimateGasFinalizeMessage(
  message: MessageLike,
  opts?: {
    overrides?: CallOverrides;
  },
  messageIndex = 0
): Promise<BigNumber> {
  return messenger.l1Provider.estimateGas(
    await populateFinalizeMessage(message, opts, messageIndex)
  );
}

type WithdrawalArgs = [
  messageNonce: BigNumber,
  sender: string,
  target: string,
  value: BigNumber,
  minGasLimit: BigNumber,
  message: string
];

export async function returnArgsForFinalizeMessage(
  message: MessageLike,
  opts?: {
    overrides?: PayableOverrides;
  },
  messageIndex = 0
): Promise<[WithdrawalArgs, any]> {
  const resolved = await messenger.toCrossChainMessage(message, messageIndex);
  if (resolved.direction === MessageDirection.L1_TO_L2) {
    throw new Error(`cannot finalize L1 to L2 message`);
  }
  const messageHashV1 = hashCrossDomainMessagev1(
    resolved.messageNonce,
    resolved.sender,
    resolved.target,
    resolved.value,
    resolved.minGasLimit,
    resolved.message
  );
  // fetch the following
  // 1. Wether it needs to be replayed because it failed
  // 2. The withdrawal as a low level message
  const [isFailed, withdrawal] = await Promise.allSettled([
    messenger.contracts.l1.L1CrossDomainMessenger.failedMessages(messageHashV1),
    messenger.toLowLevelMessage(resolved, messageIndex),
  ]);

  // handle errors
  if (isFailed.status === "rejected" || withdrawal.status === "rejected") {
    const rejections = [isFailed, withdrawal]
      .filter((p) => p.status === "rejected")
      .map((p) => (p as PromiseRejectedResult).reason);
    throw rejections.length > 1
      ? new AggregateError(rejections)
      : rejections[0];
  }
  console.log("here2");
  return [
    [
      withdrawal.value.messageNonce,
      withdrawal.value.sender,
      withdrawal.value.target,
      withdrawal.value.value,
      withdrawal.value.minGasLimit,
      withdrawal.value.message,
    ],
    opts?.overrides || {},
  ];
}

export async function populateFinalizeMessage(
  message: MessageLike,
  opts?: {
    overrides?: PayableOverrides;
  },
  messageIndex = 0
): Promise<TransactionRequest> {
  const resolved = await messenger.toCrossChainMessage(message, messageIndex);
  if (resolved.direction === MessageDirection.L1_TO_L2) {
    throw new Error(`cannot finalize L1 to L2 message`);
  }
  const messageHashV1 = hashCrossDomainMessagev1(
    resolved.messageNonce,
    resolved.sender,
    resolved.target,
    resolved.value,
    resolved.minGasLimit,
    resolved.message
  );
  // fetch the following
  // 1. Wether it needs to be replayed because it failed
  // 2. The withdrawal as a low level message
  const [isFailed, withdrawal] = await Promise.allSettled([
    messenger.contracts.l1.L1CrossDomainMessenger.failedMessages(messageHashV1),
    messenger.toLowLevelMessage(resolved, messageIndex),
  ]);

  // handle errors
  if (isFailed.status === "rejected" || withdrawal.status === "rejected") {
    const rejections = [isFailed, withdrawal]
      .filter((p) => p.status === "rejected")
      .map((p) => (p as PromiseRejectedResult).reason);
    throw rejections.length > 1
      ? new AggregateError(rejections)
      : rejections[0];
  }

  if (isFailed.value === true) {
    const xdmWithdrawal =
      messenger.contracts.l1.L1CrossDomainMessenger.interface.decodeFunctionData(
        "relayMessage",
        withdrawal.value.message
      );
    console.log("here1");
    console.log(
      xdmWithdrawal._nonce,
      xdmWithdrawal._sender,
      xdmWithdrawal._target,
      xdmWithdrawal._value,
      xdmWithdrawal._minGasLimit,
      xdmWithdrawal._message,
      opts?.overrides || {}
    );
    return messenger.contracts.l1.L1CrossDomainMessenger.populateTransaction.relayMessage(
      xdmWithdrawal._nonce,
      xdmWithdrawal._sender,
      xdmWithdrawal._target,
      xdmWithdrawal._value,
      xdmWithdrawal._minGasLimit,
      xdmWithdrawal._message,
      opts?.overrides || {}
    );
  }
  console.log("here2");
  console.log(
    withdrawal.value.messageNonce,
    withdrawal.value.sender,
    withdrawal.value.target,
    withdrawal.value.value,
    withdrawal.value.minGasLimit,
    withdrawal.value.message
  );
  return messenger.contracts.l1.OptimismPortal.populateTransaction.finalizeWithdrawalTransaction(
    [
      withdrawal.value.messageNonce,
      withdrawal.value.sender,
      withdrawal.value.target,
      withdrawal.value.value,
      withdrawal.value.minGasLimit,
      withdrawal.value.message,
    ],
    opts?.overrides || {}
  );
}
