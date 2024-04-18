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
import Multicall3 from "../artifacts/contracts/test/Multicall3.sol/Multicall3.json";
import { publicClientL1, walletClientL1 } from "../config";
import { accounts } from "../test/shared/Accounts";
const DIRROOT = __dirname + "/../afterDevnetUp.deploy.json";
// limitations under the License.
async function deployMulticall3() {
  console.log("Deploying Multicall3...");
  const hash = await walletClientL1.deployContract({
    abi: Multicall3.abi,
    account: accounts[9],
    bytecode: Multicall3.bytecode as `0x${string}`,
    args: [],
  });
  const receipt = await publicClientL1.waitForTransactionReceipt({ hash });
  const Multicall3Address = receipt.contractAddress;
  console.log(`Multicall3 deployed at: ${Multicall3Address}`);

  // ***** fs write
  const data = JSON.parse(fs.readFileSync(DIRROOT, "utf8"));
  data["Multicall3"] = Multicall3Address;
  fs.writeFileSync(DIRROOT, JSON.stringify(data));
}

deployMulticall3()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
