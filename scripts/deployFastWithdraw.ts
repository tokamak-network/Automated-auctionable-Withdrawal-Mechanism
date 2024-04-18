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
import fs from "fs";
import FastWithdraw from "../artifacts/contracts/FastWithdraw.sol/FastWithdraw.json";
import { publicClientL1, walletClientL1, walletClientL2 } from "../config";
import deploy from "../deploy.json";
import l2Address from "../l2Address.json";
import { accounts } from "../test/shared/Accounts";

const DIRROOT = __dirname + "/../afterDevnetUp.deploy.json";
// limitations under the License.
async function deployFastWithdraw() {
  console.log("Deploying FastWithdraw...");
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
  const FastWithdrawAddress = receipt.contractAddress;
  console.log(`FastWithdraw deployed at: ${FastWithdrawAddress}`);

  // ***** fs write
  const data = JSON.parse(fs.readFileSync(DIRROOT, "utf8"));
  data["FastWithdraw"] = FastWithdrawAddress;
  fs.writeFileSync(DIRROOT, JSON.stringify(data));
}

deployFastWithdraw()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
