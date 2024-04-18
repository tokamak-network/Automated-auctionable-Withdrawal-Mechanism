# Copyright 2024 justin
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     https://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
-include .env
.PHONY: all fastWithdraw multicall3 Ton

L1_ERC20_ADDRESS := 0x700b6a60ce7eaaea56f065753d8dcb9653dbad35

all: Ton multicall3 fastWithdraw TonL2

# fastWithdraw:; npx hardhat ignition deploy ignition/modules/FastWithdraw.ts --network devnetL1
# multicall3:; npx hardhat ignition deploy ignition/modules/Multicall3.ts --network devnetL1 --default-sender 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
# Ton:; npx hardhat ignition deploy ignition/modules/Ton.ts --network devnetL1
fastWithdraw:; npx hardhat run scripts/deployFastWithdraw.ts
multicall3:; npx hardhat run scripts/deployMulticall3.ts
Ton:; npx hardhat run scripts/deployTon.ts

TonL2:; cast send 0x4200000000000000000000000000000000000012 "createOptimismMintableERC20(address,string,string)" $(L1_ERC20_ADDRESS) "Tokamak Network" "Ton" --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:9545/ --json | jq -r '.logs[0].topics[2]' | cast parse-bytes32-address