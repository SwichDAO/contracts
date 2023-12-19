import hre from "hardhat";

async function main() {
  const FSNAirdrop = await hre.ethers.getContractFactory("FSNAirdrop");
  const fsnAirdrop = FSNAirdrop.attach(process.env.FSN_AIRDROP_ADDRESS || "");
  // const tx1 = await fsnAirdrop.addBatchRewards(
  //   [
  //     "0x501DCFb3cfa751512803a68cDDad4230EF538194",
  //     "0x819c56e1214b6b475cD609768FCD9a1CBCAB851d",
  //     "0x279d3154db16b6350c05Aeac3991157EAa7c21Bf",
  //   ],
  //   ["20000000000000000", "10000000000000000", "10000000000000000"],
  //   {
  //     gasLimit: 1000000,
  //   }
  // );
  // console.log("processing:", tx1.hash);
  // await tx1.wait();
  // console.log("end:", tx1.hash);

  const pendingRewards = await fsnAirdrop.pendingRewards("0x501DCFb3cfa751512803a68cDDad4230EF538194")
  console.log(pendingRewards)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
