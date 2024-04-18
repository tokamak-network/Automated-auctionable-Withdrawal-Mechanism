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
import fs from "fs";
import Ton from "../artifacts/contracts/test/Ton.sol/Ton.json";
import { publicClientL1, walletClientL1 } from "../config";
import { accounts } from "../test/shared/Accounts";
const DIRROOT = __dirname + "/../afterDevnetUp.deploy.json";
async function deployTon() {
  console.log("deploying Ton...");
  const hash = await walletClientL1.deployContract({
    abi: Ton.abi,
    account: accounts[9],
    bytecode: Ton.bytecode as `0x${string}`,
    args: ["tokamak network" as string, "ton" as string],
  });
  const receipt = await publicClientL1.waitForTransactionReceipt({ hash });
  const TonAddress = receipt.contractAddress;
  console.log(`Ton deployed at: ${TonAddress}`);

  // ***** fs write
  const data = JSON.parse(fs.readFileSync(DIRROOT, "utf8"));
  data["Ton"] = TonAddress;
  fs.writeFileSync(DIRROOT, JSON.stringify(data));
}

deployTon()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
