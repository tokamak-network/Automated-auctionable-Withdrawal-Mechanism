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
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { walletClientL2 } from "../../config";
export default buildModule("FastWithdraw", (m) => {
  const optimismPortalAddress = m.getParameter(
    "optimismPortalAddress",
    walletClientL2.chain.contracts.portal[walletClientL2.chain.sourceId].address
  );
  const l2OutputOracleAddress = m.getParameter(
    "l2OutputOracleAddress",
    walletClientL2.chain.contracts.l2OutputOracle[walletClientL2.chain.sourceId]
      .address
  );
  const FastWithdraw = m.contract("FastWithdraw", [
    optimismPortalAddress,
    l2OutputOracleAddress,
  ]);

  return {
    FastWithdraw,
  };
});
