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

import { MessageStatus } from "@eth-optimism/sdk";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";
import { Hex, erc20Abi, parseEther } from "viem";
import afterDevnetUp from "../../afterDevnetUp.deploy.json";
import FastWithdraw from "../../artifacts/contracts/FastWithdraw.sol/FastWithdraw.json";
import { publicClientL1, walletClientL1, walletClientL2 } from "../../config";
import deploy from "../../deploy.json";
import l2Address from "../../l2Address.json";
import { proveWithdraw, requestWithdraw } from "../OpStackViem";
import { accounts, privateKeys as privateKeysDevent } from "../shared/Accounts";
import OptimismMintableERC20 from "../shared/forge-artifacts/OptimismMintableERC20.sol/OptimismMintableERC20.json";
import { messenger } from "../shared/messenger";
import { proveMessage } from "../shared/proveWithdrawERC20";
import { returnArgsForFinalizeMessage } from "../shared/withdrawERC20";
export async function deployFastWithdrawFixture() {
  const hash = await walletClientL1.deployContract({
    abi: FastWithdraw.abi,
    account: accounts[9],
    bytecode: FastWithdraw.bytecode as `0x${string}`,
    args: [
      walletClientL2.chain.contracts.portal[walletClientL2.chain.sourceId]
        .address,
      walletClientL2.chain.contracts.l2OutputOracle[
        walletClientL2.chain.sourceId
      ].address,
      deploy["L1CrossDomainMessengerProxy"],
      l2Address["L2CrossDomainMessenger"],
      deploy["L1StandardBridgeProxy"],
      l2Address["L2StandardBridge"],
    ],
  });
  const receipt = await publicClientL1.waitForTransactionReceipt({ hash });
  return { FastWithdrawAddressFromReceipt: receipt.contractAddress };
}

export type WithdrawalTx = {
  nonce: bigint;
  value: bigint;
  gasLimit: bigint;
  data: Hex;
};

describe("FastWithdraw", async function () {
  const privateKeys = privateKeysDevent;
  let l1Wallet: ethers.Wallet;
  let l2Wallet: ethers.Wallet;
  let l1Token: string;
  let l2Token: string;
  let l1ERC20: ethers.Contract;
  let oneToken: ethers.BigNumber;
  let l2ERC20: ethers.Contract;
  let FastWithdrawAddress: `0x${string}`;
  const optimismPortalAddress =
    walletClientL2.chain.contracts.portal[walletClientL2.chain.sourceId]
      .address;
  const l2OutputOracleAddress =
    walletClientL2.chain.contracts.l2OutputOracle[walletClientL2.chain.sourceId]
      .address;
  it("deploy FastWithdraw Contract", async function () {
    // **** get
    const accountBalance = await publicClientL1.getBalance({
      address: walletClientL1.account.address,
    });
    // **** act
    const { FastWithdrawAddressFromReceipt } = await loadFixture(
      deployFastWithdrawFixture
    );
    FastWithdrawAddress = FastWithdrawAddressFromReceipt as `0x${string}`;

    const FastWithdrawBalance = await publicClientL1.getBalance({
      address: FastWithdrawAddress,
    });
    if (FastWithdrawBalance < parseEther("1000")) {
      const hash = await walletClientL1.sendTransaction({
        to: FastWithdrawAddress,
        value: parseEther("1000"),
      });
      await publicClientL1.waitForTransactionReceipt({ hash });
      const fastWithdrawBalance = await publicClientL1.getBalance({
        address: FastWithdrawAddress,
      });
      // **** assert
      await expect(fastWithdrawBalance).to.equal(parseEther("1000"));
    }
  });
  it("request withdraw And Prove and RequestFW ETH", async function () {
    // **** get
    const [from] = accounts;
    const toAddress = FastWithdrawAddress;
    const amount: bigint = parseEther("1");
    const balanceOfFromOnL1 = await publicClientL1.getBalance({
      address: from!.address,
    });
    const balanceOfToOnL1 = await publicClientL1.getBalance({
      address: toAddress,
    });

    // **** act
    const requestWithdrawalReceipt = await requestWithdraw(
      from!,
      toAddress!,
      amount
    );
    const [withdrawal, gasUsePrice] = await proveWithdraw(
      requestWithdrawalReceipt,
      from!
    );
    const requestFWArgs: WithdrawalTx = {
      nonce: withdrawal.nonce,
      value: withdrawal.value,
      gasLimit: withdrawal.gasLimit,
      data: withdrawal.data,
    };
    const balanceOfFromOnL1BeforeRequestFW = await publicClientL1.getBalance({
      address: from!.address,
    });
    const requestFWHash = await walletClientL1.writeContract({
      account: from,
      abi: FastWithdraw!.abi,
      address: FastWithdrawAddress,
      functionName: "requestFWETH",
      args: [requestFWArgs],
    });

    const requestFWReceipt = await publicClientL1.waitForTransactionReceipt({
      hash: requestFWHash,
    });
    console.log("requestFWReceipt", requestFWReceipt);
    const gasPrice = await publicClientL1.getGasPrice();
    console.log("gasPrice", gasPrice);

    // *** assert
    // await expect(balanceOfFromOnL1After).to.equal(
    //   balanceOfFromOnL1 +
    //     (amount / 9n) * 10n -
    //     gasUsePrice -
    //     (balanceOfFromOnL1BeforeRequestFW -
    //       balanceOfFromOnL1AfterRequestFW +
    //       (amount / 9n) * 10n)
    // );
    // await expect(balanceOfToOnL1After).to.equal(balanceOfToOnL1 - amount);
  });
  it("setting for ERC20 tests", async function () {
    const privateKey = privateKeys[9];
    const l1Provider = new ethers.providers.StaticJsonRpcProvider(
      "http://127.0.0.1:8545/"
    );
    const l2Provider = new ethers.providers.StaticJsonRpcProvider(
      "http://127.0.0.1:9545/"
    );
    l1Wallet = new ethers.Wallet(privateKey, l1Provider);
    l2Wallet = new ethers.Wallet(privateKey, l2Provider);
    l1Token = afterDevnetUp["Ton"];
    l2Token = "0xeB6BeA277df716954FbAA6313D5A9b3447dae415";
    l1ERC20 = new ethers.Contract(l1Token, erc20Abi, l1Wallet);
    const l1Balance = await l1ERC20.balanceOf(l1Wallet.address);
    console.log("L1 balance: ", l1Balance.toString());
  });
  it("withdraw And Prove and RequestFW ERC20, send FastwithdrawContract", async function () {
    oneToken = ethers.BigNumber.from("2000000000000000000000000");
    let tx = await messenger.approveERC20(l1Token, l2Token, oneToken);
    await tx.wait();
    tx = await messenger.depositERC20(l1Token, l2Token, oneToken);
    await tx.wait();
    await messenger.waitForMessageStatus(tx.hash, MessageStatus.RELAYED);
    console.log((await l1ERC20.balanceOf(l1Wallet.address)).toString());
    l2ERC20 = new ethers.Contract(
      l2Token,
      OptimismMintableERC20["abi"],
      l2Wallet
    );
    console.log((await l2ERC20.balanceOf(l2Wallet.address)).toString());
    // send to FastWithdraw Contract
    const transferTx = await l1ERC20
      .connect(l1Wallet)
      .populateTransaction.transfer(
        FastWithdrawAddress,
        ethers.BigNumber.from("4000000000000000000000000")
      );
    tx = await l1Wallet.sendTransaction(transferTx);
    await tx.wait();
  });
  it("request withdraw And Prove and RequestFW ERC20", async function () {
    const withdrawal = await messenger.withdrawERC20(
      l1Token,
      l2Token,
      oneToken,
      {
        recipient: FastWithdrawAddress,
      }
    );
    await withdrawal.wait();
    console.log((await l2ERC20.balanceOf(l2Wallet.address)).toString());
    await messenger.waitForMessageStatus(
      withdrawal.hash,
      MessageStatus.READY_TO_PROVE
    );
    //await messenger.proveMessage(withdrawal.hash);
    const [tx, proofArgs] = await proveMessage(withdrawal, l1Wallet);
    await tx.wait();

    const from = accounts[9];
    // const requestFWArgs: WithdrawalTx = {
    //   nonce: BigInt(proofArgs[0][0].toString()),
    //   value: BigInt(proofArgs[0][3].toString()),
    //   gasLimit: BigInt(proofArgs[0][4].toString()),
    //   data: proofArgs[0][5] as `0x${string}`,
    // };
    const [withdrawArgs, opts] = await returnArgsForFinalizeMessage(withdrawal);
    const requestFWArgs: WithdrawalTx = {
      nonce: BigInt(withdrawArgs[0].toString()),
      value: BigInt(withdrawArgs[3].toString()),
      gasLimit: BigInt(withdrawArgs[4].toString()),
      data: withdrawArgs[5] as `0x${string}`,
    };
    console.log(requestFWArgs.data);
    const requestFWHash = await walletClientL1.writeContract({
      account: from,
      abi: FastWithdraw!.abi,
      address: FastWithdrawAddress,
      functionName: "requestFWERC20",
      args: [requestFWArgs],
    });

    const requestFWReceipt = await publicClientL1.waitForTransactionReceipt({
      hash: requestFWHash,
    });
    console.log("requestFWReceipt", requestFWReceipt);
  });
});
