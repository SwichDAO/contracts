import hre from "hardhat";

async function main() {
  const GenesisNFTSale = await hre.ethers.getContractFactory(
    "GenesisNFTSale"
  );
  const genesisNFTSale = GenesisNFTSale.attach(
    process.env.GENESIS_NFT_SALE_ADDRESS || ""
  );
  const tx1 = await genesisNFTSale.setPrices(
    [process.env.USDT_ADDRESS || "", process.env.FSN_ADDRESS || "", process.env.CHNG_ADDRESS || ""],
    [process.env.USDT_PRICE || "", process.env.FSN_PRICE || "", process.env.CHNG_PRICE || ""]
  );
  console.log("setPrices start:", tx1.hash);
  await tx1.wait();
  console.log("setPrices end:", tx1.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
