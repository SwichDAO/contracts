import hre from "hardhat";

async function main() {
  const GenesisNFTCore = await hre.ethers.getContractFactory("GenesisNFTCore");
  const genesisNFTCore = await GenesisNFTCore.deploy(
    "Swich Genesis NFT",
    "SwNFT",
    "https://test.uri/"
  );

  await genesisNFTCore.deployed();
  console.log(`GenesisNFTCore deployed to ${genesisNFTCore.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
