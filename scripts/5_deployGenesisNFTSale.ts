import hre from "hardhat";

async function main() {
  const GenesisNFTSale = await hre.ethers.getContractFactory("GenesisNFTSale");
  const genesisNFTSale = await GenesisNFTSale.deploy(
    process.env.GENESIS_NFT_MANAGER_ADDRESS || "",
    9500,
    process.env.GENESIS_NFT_SALE_START || 0,
    process.env.GENESIS_NFT_SALE_END || 0
  );

  await genesisNFTSale.deployed();
  console.log(`GenesisNFTSale deployed to ${genesisNFTSale.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
