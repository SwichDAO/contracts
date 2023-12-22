import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";
import { BigNumber } from "ethers";

describe("GenesisNFTCore", function () {
  beforeEach(async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const GenesisNFTCore = await hre.ethers.getContractFactory(
      "GenesisNFTCore"
    );
    this.genesisNFTCore = await GenesisNFTCore.connect(owner).deploy(
      "Swich Genesis NFT",
      "SwNFT",
      "https://test-api.swich.finance/v1/genesis-nfts/metadata/"
    );
    await this.genesisNFTCore.deployed();
  });

  it("exists()", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    expect(await this.genesisNFTCore.exists(1)).to.equal(false);
    await this.genesisNFTCore.safeMint(owner.address);
    expect(await this.genesisNFTCore.exists(1)).to.equal(true);
    expect(await this.genesisNFTCore.exists(2)).to.equal(false);
  });

  it("baseURI()", async function () {
    expect(await this.genesisNFTCore.baseURI()).to.equal(
      "https://test-api.swich.finance/v1/genesis-nfts/metadata/"
    );
  });

  it("setBaseURI()", async function () {
    await this.genesisNFTCore.setBaseURI(
      "https://new-test-api.swich.finance/v1/genesis-nfts/metadata/"
    );
    expect(await this.genesisNFTCore.baseURI()).to.equal(
      "https://new-test-api.swich.finance/v1/genesis-nfts/metadata/"
    );
  });

  it("safeMint()", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    await this.genesisNFTCore.safeMint(owner.address);
    expect(await this.genesisNFTCore.balanceOf(owner.address)).to.equal(1);
    expect(await this.genesisNFTCore.ownerOf(1)).to.equal(owner.address);

    await this.genesisNFTCore.safeMint(owner.address);
    expect(await this.genesisNFTCore.balanceOf(owner.address)).to.equal(2);
    expect(await this.genesisNFTCore.ownerOf(2)).to.equal(owner.address);
  });

  it("safeMintBatch()", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    await this.genesisNFTCore.safeMintBatch([owner.address]);
    expect(await this.genesisNFTCore.balanceOf(owner.address)).to.equal(1);
    expect(await this.genesisNFTCore.ownerOf(1)).to.equal(owner.address);

    await this.genesisNFTCore.safeMintBatch([
      owner.address,
      addr1.address,
      addr2.address,
      addr3.address,
    ]);
    expect(await this.genesisNFTCore.balanceOf(owner.address)).to.equal(2);
    expect(await this.genesisNFTCore.balanceOf(addr1.address)).to.equal(1);
    expect(await this.genesisNFTCore.balanceOf(addr2.address)).to.equal(1);
    expect(await this.genesisNFTCore.balanceOf(addr3.address)).to.equal(1);
    expect(await this.genesisNFTCore.ownerOf(2)).to.equal(owner.address);
    expect(await this.genesisNFTCore.ownerOf(3)).to.equal(addr1.address);
    expect(await this.genesisNFTCore.ownerOf(4)).to.equal(addr2.address);
    expect(await this.genesisNFTCore.ownerOf(5)).to.equal(addr3.address);
  });

  it("reveal()", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    await this.genesisNFTCore.safeMintBatch([owner.address]);
    expect(await this.genesisNFTCore.cid(1)).to.equal(0);

    await this.genesisNFTCore.reveal(1, 1);
    expect(await this.genesisNFTCore.cid(1)).to.equal(1);

    await expect(this.genesisNFTCore.reveal(1, 2)).to.be.reverted;
  });

  it("revealBatch()", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    await this.genesisNFTCore.safeMintBatch([
      owner.address,
      addr1.address,
      addr2.address,
      addr3.address,
    ]);

    await this.genesisNFTCore.revealBatch([1, 2, 3, 4], [1, 2, 3, 4]);
    expect(await this.genesisNFTCore.cid(1)).to.equal(1);
    expect(await this.genesisNFTCore.cid(2)).to.equal(2);
    expect(await this.genesisNFTCore.cid(3)).to.equal(3);
    expect(await this.genesisNFTCore.cid(4)).to.equal(4);

    await expect(this.genesisNFTCore.revealBatch([1, 2, 3, 4], [1, 2, 3, 4])).to
      .be.reverted;
  });

  it("transferFrom()", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    await this.genesisNFTCore.safeMintBatch([
      owner.address,
      addr1.address,
      addr2.address,
      addr3.address,
    ]);

    await this.genesisNFTCore.transferFrom(owner.address, addr1.address, 1);
  });

  it("pause()", async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    await this.genesisNFTCore.safeMintBatch([
      owner.address,
      addr1.address,
      addr2.address,
      addr3.address,
    ]);

    await this.genesisNFTCore.pause();
    await expect(
      this.genesisNFTCore.transferFrom(owner.address, addr1.address, 1)
    ).to.be.reverted;

    await this.genesisNFTCore.unpause();
    await this.genesisNFTCore.transferFrom(owner.address, addr1.address, 1);
  });

  it("tokenURI() 1", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    await this.genesisNFTCore.safeMintBatch([owner.address]);
    expect(await this.genesisNFTCore.tokenURI(1)).to.equal(
      "https://test-api.swich.finance/v1/genesis-nfts/metadata/0"
    );

    await this.genesisNFTCore.reveal(1, 1);
    expect(await this.genesisNFTCore.tokenURI(1)).to.equal(
      "https://test-api.swich.finance/v1/genesis-nfts/metadata/1"
    );
  });

  it("tokenURI() 2", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    await this.genesisNFTCore.safeMintBatch([owner.address]);
    expect(await this.genesisNFTCore.tokenURI(1)).to.equal(
      "https://test-api.swich.finance/v1/genesis-nfts/metadata/0"
    );

    await this.genesisNFTCore.reveal(1, 2);
    expect(await this.genesisNFTCore.tokenURI(1)).to.equal(
      "https://test-api.swich.finance/v1/genesis-nfts/metadata/2"
    );
  });

  it("tokenURI() 3", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    await this.genesisNFTCore.safeMintBatch([owner.address]);
    expect(await this.genesisNFTCore.tokenURI(1)).to.equal(
      "https://test-api.swich.finance/v1/genesis-nfts/metadata/0"
    );

    await this.genesisNFTCore.reveal(1, 3);
    expect(await this.genesisNFTCore.tokenURI(1)).to.equal(
      "https://test-api.swich.finance/v1/genesis-nfts/metadata/3"
    );
  });

  it("tokenURI() 4", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    await this.genesisNFTCore.safeMintBatch([owner.address]);
    expect(await this.genesisNFTCore.tokenURI(1)).to.equal(
      "https://test-api.swich.finance/v1/genesis-nfts/metadata/0"
    );

    await this.genesisNFTCore.reveal(1, 4);
    expect(await this.genesisNFTCore.tokenURI(1)).to.equal(
      "https://test-api.swich.finance/v1/genesis-nfts/metadata/4"
    );
  });

  it("tokenIdTracker()", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    expect(await this.genesisNFTCore.tokenIdTracker()).to.equal(1);
    await this.genesisNFTCore.safeMint(owner.address);
    expect(await this.genesisNFTCore.tokenIdTracker()).to.equal(2);
  });
});
