import "@nomicfoundation/hardhat-toolbox-viem";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";

const hardhat1PrivateKey = `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`;
const hardhat2PrivateKey =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

const config: HardhatUserConfig = {
  // gasReporter: {
  //   enabled: true,
  //   currency: "ETH",
  //   gasPriceApi:
  //     "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
  //   coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  // },
  defaultNetwork: "hardhat",
  networks: {
    devnetL1: {
      url: "http://localhost:8545",
      accounts: [hardhat1PrivateKey, hardhat2PrivateKey],
      chainId: 900,
    },
    devnetL2: {
      url: "http://localhost:9545",
      accounts: [hardhat1PrivateKey, hardhat2PrivateKey],
      chainId: 901,
    },
  },
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 4294967295,
        details: {
          yul: true,
        },
      },
    },
  },
  mocha: {
    timeout: 100000000,
  },
};

export default config;
