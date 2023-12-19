import hre from "hardhat";

async function main() {
  const GenesisNFTManager = await hre.ethers.getContractFactory(
    "GenesisNFTManager"
  );
  const genesisNFTManager = await GenesisNFTManager.deploy(
    process.env.GENESIS_NFT_CORE_ADDRESS || "",
    process.env.GENESIS_NFT_CORE_REVEAL_TS || 0
  );

  await genesisNFTManager.deployed();
  console.log(`GenesisNFTManager deployed to ${genesisNFTManager.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
