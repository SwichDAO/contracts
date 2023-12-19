import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "hardhat-docgen";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  networks: {
    fusionTestnet: {
      url: "https://testnet.fusionnetwork.io",
      chainId: 46688,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ""],
    },
    fusion: {
      url: "https://mainnet.fusionnetwork.io",
      chainId: 32659,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ""],
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ""],
    },
    hardhat: {
      accounts: {
        count: 20, // 12850531 gasUsed
        // accountsBalance: 10000000000000000000000, // default value is 10000ETH in wei
      },
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.ETHERSCAN_API_KEY || "",
    },
  },
  mocha: {
    timeout: 100000000,
  },
};

export default config;
