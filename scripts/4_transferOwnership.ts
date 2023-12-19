import hre from "hardhat";

async function main() {
  const GenesisNFTCore = await hre.ethers.getContractFactory("GenesisNFTCore");
  const genesisNFTCore = GenesisNFTCore.attach(
    process.env.GENESIS_NFT_CORE_ADDRESS || ""
  );
  const tx1 = await genesisNFTCore.transferOwnership(
    process.env.GENESIS_NFT_MANAGER_ADDRESS || ""
  );
  console.log("transferOwnership start:", tx1.hash);
  await tx1.wait();
  console.log("transferOwnership end:", tx1.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
