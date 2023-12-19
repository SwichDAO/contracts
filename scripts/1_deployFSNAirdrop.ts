import hre from "hardhat";

async function main() {
  const FSNAirdrop = await hre.ethers.getContractFactory("FSNAirdrop");
  const fsnAirdrop = await FSNAirdrop.deploy();

  await fsnAirdrop.deployed();
  console.log(`FSNAirdrop deployed to ${fsnAirdrop.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
