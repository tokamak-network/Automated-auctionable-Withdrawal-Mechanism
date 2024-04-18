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
import { ethers } from "ethers";
import afterDevnetUp from "../afterDevnetUp.deploy.json";
import { privateKeys as privateKeysDevent } from "./shared/Accounts";
import OptimismMintableERC20 from "./shared/forge-artifacts/OptimismMintableERC20.sol/OptimismMintableERC20.json";
import { messenger } from "./shared/messenger";
import { proveMessage } from "./shared/proveWithdrawERC20";
import { finalizeMessage } from "./shared/withdrawERC20";

describe("OptimismSDK", async function () {
  const privateKeys = privateKeysDevent;
  let l1Wallet: ethers.Wallet;
  let l2Wallet: ethers.Wallet;
  let l1Token: string;
  let l2Token: string;
  let l1ERC20: ethers.Contract;
  let erc20ABI: any;
  let oneToken: ethers.BigNumber;
  let l2ERC20: ethers.Contract;
  it("set session variables", async function () {
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
    erc20ABI = [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
      },
      {
        inputs: [],
        name: "faucet",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];
    l1ERC20 = new ethers.Contract(l1Token, erc20ABI, l1Wallet);
    const l1Balance = await l1ERC20.balanceOf(l1Wallet.address);
    console.log("L1 balance: ", l1Balance.toString());
  });
  it("send token from L1 to L2", async function () {
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
  });
  it("send token from L2 to L1", async function () {
    oneToken = ethers.BigNumber.from("1000000000000000000000000");
    const withdrawal = await messenger.withdrawERC20(
      l1Token,
      l2Token,
      oneToken
    );
    await withdrawal.wait();
    console.log((await l2ERC20.balanceOf(l2Wallet.address)).toString());
    await messenger.waitForMessageStatus(
      withdrawal.hash,
      MessageStatus.READY_TO_PROVE
    );
    //await messenger.proveMessage(withdrawal.hash);
    const [tx, proveArgs] = await proveMessage(withdrawal, l1Wallet);
    await tx.wait();
    await messenger.waitForMessageStatus(
      withdrawal.hash,
      MessageStatus.READY_FOR_RELAY
    );
    await new Promise((resolve) => setTimeout(resolve, 3 * 1000));
    //await messenger.finalizeMessage(withdrawal.hash);
    const finalizeTx = await finalizeMessage(withdrawal);
    await finalizeTx.wait();
    await messenger.waitForMessageStatus(
      withdrawal.hash,
      MessageStatus.RELAYED
    );
    console.log((await l1ERC20.balanceOf(l1Wallet.address)).toString());
  });
  it("send token from L2 to L1 different account", async function () {
    const withdrawal = await messenger.withdrawERC20(
      l1Token,
      l2Token,
      oneToken,
      {
        recipient: afterDevnetUp["FastWithdraw"],
      }
    );
    await withdrawal.wait();
    console.log((await l2ERC20.balanceOf(l2Wallet.address)).toString());
    await messenger.waitForMessageStatus(
      withdrawal.hash,
      MessageStatus.READY_TO_PROVE
    );
    //await messenger.proveMessage(withdrawal.hash);
    const [tx, proveArgs] = await proveMessage(withdrawal, l1Wallet);
    await tx.wait();
    await messenger.waitForMessageStatus(
      withdrawal.hash,
      MessageStatus.READY_FOR_RELAY
    );
    await new Promise((resolve) => setTimeout(resolve, 3 * 1000));
    //await messenger.finalizeMessage(withdrawal.hash);
    const finalizeTx = await finalizeMessage(withdrawal);
    await finalizeTx.wait();
    await messenger.waitForMessageStatus(
      withdrawal.hash,
      MessageStatus.RELAYED
    );
    console.log(
      (await l1ERC20.balanceOf(afterDevnetUp["FastWithdraw"])).toString()
    );
  });
});
