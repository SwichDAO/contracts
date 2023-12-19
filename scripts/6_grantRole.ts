import hre from "hardhat";

async function main() {
  const GenesisNFTManager = await hre.ethers.getContractFactory(
    "GenesisNFTManager"
  );
  const genesisNFTManager = GenesisNFTManager.attach(
    process.env.GENESIS_NFT_MANAGER_ADDRESS || ""
  );
  const MINTER_ROLE = await genesisNFTManager.MINTER_ROLE();
  const tx1 = await genesisNFTManager.grantRole(
    MINTER_ROLE,
    process.env.GENESIS_NFT_SALE_ADDRESS || ""
  );
  console.log("grantRole start:", tx1.hash);
  await tx1.wait();
  console.log("grantRole end:", tx1.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
