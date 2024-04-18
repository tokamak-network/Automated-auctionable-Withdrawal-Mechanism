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
import { viem } from "hardhat";
import { Account, TransactionReceipt, WalletClient, parseEther } from "viem";
import { Withdrawal } from "viem/_types/op-stack/types/withdrawal";
import { privateKeyToAccount } from "viem/accounts";
import { getWithdrawals } from "viem/op-stack";

import { assert } from "chai";
import { getL2TransactionHashes } from "viem/op-stack";
import {
  account,
  portalAbi,
  publicClientL1,
  publicClientL2,
  walletClientL1,
  walletClientL2,
} from "../config";
describe("OpStack Viem", async function () {
  let walletClients: WalletClient[];
  beforeEach("get wallet clients", async function () {
    walletClients = (await viem.getWalletClients()) as WalletClient[];
  });
  it("deposit", async function () {
    // Build parameters for the transaction on the L2.
    const args = await publicClientL2.buildDepositTransaction({
      mint: parseEther("1"),
      //account: (walletClients[0].account as Account).address,
      to: (walletClients[0].account as Account).address,
    });

    // Execute the deposit transaction on L1
    const hash = await walletClientL1.depositTransaction(args);
    // Get the L1 transaction info
    const info = await publicClientL1.getTransaction({ hash });

    // Wait for the L1 transaction to be processed.
    const receipt = await publicClientL1.waitForTransactionReceipt({
      hash,
    });

    // Get the L2 transaction hash from the L1 transaction receipt.
    const [l2Hash] = getL2TransactionHashes(receipt);

    // Wait for the L2 transaction to be processed.
    const l2Receipt = await publicClientL2.waitForTransactionReceipt({
      hash: l2Hash,
    });
  });
  it("get version", async function () {
    const version = await publicClientL1.readContract({
      address:
        publicClientL2.chain.contracts.portal[publicClientL2.chain.sourceId]
          .address,
      abi: portalAbi,
      functionName: "version",
    });
    assert.equal(version.toString(), "2.5.0");
  });
  it("withdraw", async function () {
    // Build parameters to initiate the withdrawal transaction on the L1
    const args = await publicClientL1.buildInitiateWithdrawal({
      account,
      to: (walletClients[0].account as Account).address,
      value: parseEther("1"),
    });
    assert.equal(args.request.data, undefined);
    assert.equal(args.request.gas, 21000n);
    assert.equal(args.request.to, account.address);
    assert.equal(args.request.value, parseEther("1"));

    // Execute the initiate withdrawal transaction on L2.
    const hash = await walletClientL2.initiateWithdrawal(args);

    // Wait for the initiate withdrawal transaction receipt.
    const receipt = await publicClientL2.waitForTransactionReceipt({ hash });

    const { seconds, timestamp } = await publicClientL1.getTimeToProve({
      receipt,
      targetChain: walletClientL2.chain,
    });
    const [withdrawal] = getWithdrawals(receipt);
    console.log("withdrawal", withdrawal);

    let status = await publicClientL1.getWithdrawalStatus({
      receipt,
      targetChain: walletClientL2.chain,
    });
    console.log("status", status);

    // wait for seconds
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

    const output = await publicClientL1.getL2Output({
      l2BlockNumber: receipt.blockNumber,
      targetChain: walletClientL2.chain,
    });
    console.log("output", output);

    status = await publicClientL1.getWithdrawalStatus({
      receipt,
      targetChain: walletClientL2.chain,
    });
    console.log("status", status);

    // Build parameters to prove the withdrawal on the L2.
    const proveArgs = await publicClientL2.buildProveWithdrawal({
      account: walletClients[0].account as Account,
      output,
      withdrawal,
    });
    const account2 = privateKeyToAccount(
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    );
    const account3 = privateKeyToAccount(
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
    );
    proveArgs.account = account2;
    console.log(proveArgs);

    // Prove the withdrawal on the L1.
    const proveHash = await walletClientL1.proveWithdrawal(proveArgs);

    // Wait until the prove withdrawal is processed.
    const proveReceipt = await publicClientL1.waitForTransactionReceipt({
      hash: proveHash,
    });

    // //Wait until the withdrawal is ready to finalize.
    // await publicClientL1.waitToFinalize({
    //   targetChain: walletClientL2.chain,
    //   withdrawalHash: withdrawal.withdrawalHash,
    // });

    const {
      period,
      seconds: secondsForFinalize,
      timestamp: timestampForFinalize,
    } = await publicClientL1.getTimeToFinalize({
      withdrawalHash: withdrawal.withdrawalHash,
      targetChain: walletClientL2.chain,
    });
    console.log(period, secondsForFinalize, timestampForFinalize);
    // wait for seconds
    await new Promise((resolve) =>
      setTimeout(resolve, (secondsForFinalize + 1) * 1000)
    );

    //Finalize the withdrawal.
    const finalizeHash = await walletClientL1.finalizeWithdrawal({
      targetChain: walletClientL2.chain,
      withdrawal,
      //account: walletClients[0].account as Account,
      account: account3,
    });

    // Wait until the withdrawal is finalized.
    const finalizeReceipt = await publicClientL1.waitForTransactionReceipt({
      hash: finalizeHash,
    });
    console.log(finalizeReceipt);
  });
});

export async function requestWithdraw(
  from: Account,
  toAddress: `0x${string}`,
  amount: bigint
): Promise<TransactionReceipt> {
  // Build parameters to initiate the withdrawal transaction on the L1
  const args = await publicClientL1.buildInitiateWithdrawal({
    account: from,
    to: toAddress,
    value: amount,
  });
  // Execute the initiate withdrawal transaction on L2.
  const hash = await walletClientL2.initiateWithdrawal(args);
  const requestWithdrawalReceipt =
    await publicClientL2.waitForTransactionReceipt({ hash });
  return requestWithdrawalReceipt;
}

export async function proveWithdraw(
  requestWithdrawalReceipt: TransactionReceipt,
  from: Account
): Promise<[Withdrawal, bigint]> {
  // wait for seconds
  const { seconds, timestamp } = await publicClientL1.getTimeToProve({
    receipt: requestWithdrawalReceipt,
    targetChain: walletClientL2.chain,
  });
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

  // Build parameters to prove the withdrawal
  const [withdrawal] = getWithdrawals(requestWithdrawalReceipt);
  const output = await publicClientL1.getL2Output({
    l2BlockNumber: requestWithdrawalReceipt.blockNumber,
    targetChain: walletClientL2.chain,
  });
  const proveArgs = await publicClientL2.buildProveWithdrawal({
    account: from,
    output,
    withdrawal,
  });

  // Prove the withdrawal on the L1.
  const balanceOfFromOnL1BeforeProve = await publicClientL1.getBalance({
    address: from.address,
  });
  const proveHash = await walletClientL1.proveWithdrawal(proveArgs);

  const proveReceipt = await publicClientL1.waitForTransactionReceipt({
    hash: proveHash,
  });
  const balanceOfFromOnL1AfterProve = await publicClientL1.getBalance({
    address: from.address,
  });
  return [
    withdrawal,
    balanceOfFromOnL1BeforeProve - balanceOfFromOnL1AfterProve,
  ];
}

export async function finalizeWithdrawal(
  from: Account,
  withdrawal: Withdrawal
) {
  // wait for seconds
  const {
    period,
    seconds: secondsForFinalize,
    timestamp: timestampForFinalize,
  } = await publicClientL1.getTimeToFinalize({
    withdrawalHash: withdrawal.withdrawalHash,
    targetChain: walletClientL2.chain,
  });

  await new Promise((resolve) =>
    setTimeout(resolve, (secondsForFinalize + 1) * 1000)
  );

  //Finalize the withdrawal.
  const finalizeHash = await walletClientL1.finalizeWithdrawal({
    targetChain: walletClientL2.chain,
    withdrawal,
    //account: walletClients[0].account as Account,
    account: from,
  });

  // Wait until the withdrawal is finalized.
  const finalizeReceipt = await publicClientL1.waitForTransactionReceipt({
    hash: finalizeHash,
  });
  console.log(finalizeReceipt);
}
