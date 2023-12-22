import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";
import { BigNumber } from "ethers";

describe.only("GenesisNFTManager", function () {
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

    const revealTs = await time.latest();
    const GenesisNFTManager = await hre.ethers.getContractFactory(
      "GenesisNFTManager"
    );
    this.genesisNFTManager = await GenesisNFTManager.connect(owner).deploy(
      this.genesisNFTCore.address,
      revealTs
    );
    await this.genesisNFTManager.deployed();

    await this.genesisNFTCore.transferOwnership(this.genesisNFTManager.address);
  });

  it("updateRevealTimestamp()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    const newRevealTs = await time.latest();
    await expect(
      this.genesisNFTManager
        .connect(addresses[0])
        .updateRevealTimestamp(newRevealTs)
    ).to.be.reverted;

    const oldRevealTs = await this.genesisNFTManager.revealTimestamp();
    expect(newRevealTs).not.equal(oldRevealTs);

    await this.genesisNFTManager
      .connect(owner)
      .updateRevealTimestamp(newRevealTs);
    const revealTs = await this.genesisNFTManager.revealTimestamp();
    expect(newRevealTs).to.equal(revealTs);
  });

  it("setRevealBatchMaxSize()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    expect(await this.genesisNFTManager.revealBatchMaxSize()).to.equal(255);

    await expect(
      this.genesisNFTManager.connect(addresses[0]).setRevealBatchMaxSize(100)
    ).to.be.reverted;
    await expect(this.genesisNFTManager.connect(owner).setRevealBatchMaxSize(0))
      .to.be.reverted;
    await expect(
      this.genesisNFTManager.connect(owner).setRevealBatchMaxSize(256)
    ).to.be.reverted;

    await this.genesisNFTManager.connect(owner).setRevealBatchMaxSize(100);
    expect(await this.genesisNFTManager.revealBatchMaxSize()).to.equal(100);

    await this.genesisNFTManager.connect(owner).setRevealBatchMaxSize(100);
    expect(await this.genesisNFTManager.revealBatchMaxSize()).to.equal(100);
  });

  it("mintNFT()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    await expect(
      this.genesisNFTManager.connect(addresses[0]).mintNFT(owner.address)
    ).to.be.reverted;

    await this.genesisNFTManager.connect(owner).mintNFT(owner.address);
    await this.genesisNFTManager.connect(owner).mintNFT(addresses[0].address);

    expect(await this.genesisNFTCore.balanceOf(owner.address)).to.equal(1);
    expect(await this.genesisNFTCore.balanceOf(addresses[0].address)).to.equal(
      1
    );

    expect(await this.genesisNFTCore.totalSupply()).to.equal(2);
  });

  it("mintNFTs()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    await expect(
      this.genesisNFTManager.connect(addresses[0]).mintNFTs(owner.address, 1)
    ).to.be.reverted;
    await expect(
      this.genesisNFTManager.connect(owner).mintNFTs(owner.address, 10001)
    ).to.be.reverted;

    for (let i = 0; i < 100; i++) {
      await this.genesisNFTManager.connect(owner).mintNFTs(owner.address, 100);
    }

    expect(await this.genesisNFTCore.totalSupply()).to.equal(10000);
    expect(await this.genesisNFTCore.balanceOf(owner.address)).to.equal(10000);
    await expect(
      this.genesisNFTManager.connect(owner).mintNFTs(owner.address, 1)
    ).to.be.reverted;
  });

  it("mintNFTBatch()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    await expect(
      this.genesisNFTManager
        .connect(addresses[0])
        .mintNFTBatch([addresses[0].address])
    ).to.be.reverted;

    const tos = [];
    for (let i = 0; i < 100; i++) {
      tos.push(addresses[0].address);
    }
    for (let i = 0; i < 100; i++) {
      await this.genesisNFTManager.connect(owner).mintNFTBatch(tos);
    }

    expect(await this.genesisNFTCore.totalSupply()).to.equal(10000);
    expect(await this.genesisNFTCore.balanceOf(addresses[0].address)).to.equal(
      10000
    );
    await expect(
      this.genesisNFTManager.connect(owner).mintNFTBatch([addresses[0].address])
    ).to.be.reverted;
  });

  it("revealNFT()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    await this.genesisNFTManager.connect(owner).mintNFTs(owner.address, 2);
    await this.genesisNFTManager.connect(owner).revealNFT(1);
    await expect(this.genesisNFTManager.connect(owner).revealNFT(1)).to.be
      .reverted;

    const currentTs = await time.latest();
    await this.genesisNFTManager
      .connect(owner)
      .updateRevealTimestamp(currentTs + 1000);
    await expect(this.genesisNFTManager.connect(owner).revealNFT(2)).to.be
      .reverted;

    await time.increase(1000);
    await this.genesisNFTManager.connect(owner).revealNFT(2);

    await expect(this.genesisNFTManager.connect(owner).revealNFT(2)).to.be
      .reverted;
  });

  it("revealNFTBatch()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    await mine(1000);
    let common = 0;
    let standard = 0;
    let rare = 0;
    let epic = 0;

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const tx1 = await this.genesisNFTManager.mintNFTs(
          addresses[i].address,
          100
        );
        await tx1.wait();
        const tokenIds = [];
        for (let k = 1; k <= 100; k++) {
          tokenIds.push(1000 * i + 100 * j + k);
        }
        console.log("tokenIds:", tokenIds);
        const tx2 = await this.genesisNFTManager
          .connect(addresses[i])
          .revealNFTBatch(tokenIds);
        await tx2.wait();

        for (let k = 1; k <= 100; k++) {
          const cid = await this.genesisNFTCore.cid(1000 * i + 100 * j + k);
          if (cid == 1) {
            common++;
          }
          if (cid == 2) {
            standard++;
          }
          if (cid == 3) {
            rare++;
          }
          if (cid == 4) {
            epic++;
          }
        }
      }
    }

    expect(common).to.equal(5600);
    expect(standard).to.equal(3000);
    expect(rare).to.equal(1200);
    expect(epic).to.equal(200);
  });

  it("mintAndRevealNFT()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    await expect(
      this.genesisNFTManager
        .connect(addresses[0])
        .mintAndRevealNFT(owner.address)
    ).to.be.reverted;

    await this.genesisNFTManager.connect(owner).mintAndRevealNFT(owner.address);
    expect(await this.genesisNFTCore.cid(1)).not.equal(0);

    await expect(this.genesisNFTManager.connect(owner).revealNFT(1)).to.be
      .reverted;
  });

  it("mintAndRevealNFTs()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    await expect(
      this.genesisNFTManager
        .connect(addresses[0])
        .mintAndRevealNFTs(owner.address, 1)
    ).to.be.reverted;
    await expect(
      this.genesisNFTManager
        .connect(owner)
        .mintAndRevealNFTs(owner.address, 10001)
    ).to.be.reverted;

    await mine(10000);
    for (let i = 0; i < 100; i++) {
      await this.genesisNFTManager
        .connect(owner)
        .mintAndRevealNFTs(owner.address, 100);
    }

    expect(await this.genesisNFTCore.totalSupply()).to.equal(10000);
    expect(await this.genesisNFTCore.balanceOf(owner.address)).to.equal(10000);
    await expect(
      this.genesisNFTManager.connect(owner).mintAndRevealNFTs(owner.address, 1)
    ).to.be.reverted;

    await expect(this.genesisNFTManager.connect(owner).revealNFT(1)).to.be
      .reverted;

    await expect(this.genesisNFTManager.connect(owner).revealNFT(10000)).to.be
      .reverted;
  });

  it("mintAndRevealNFTBatch()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    await expect(
      this.genesisNFTManager
        .connect(addresses[0])
        .mintAndRevealNFTBatch([addresses[0].address])
    ).to.be.reverted;

    await mine(10000);
    const tos = [];
    for (let i = 0; i < 100; i++) {
      tos.push(addresses[0].address);
    }
    for (let i = 0; i < 100; i++) {
      await this.genesisNFTManager.connect(owner).mintAndRevealNFTBatch(tos);
    }

    expect(await this.genesisNFTCore.totalSupply()).to.equal(10000);
    expect(await this.genesisNFTCore.balanceOf(addresses[0].address)).to.equal(
      10000
    );
    await expect(
      this.genesisNFTManager
        .connect(owner)
        .mintAndRevealNFTBatch([addresses[0].address])
    ).to.be.reverted;

    await expect(this.genesisNFTManager.connect(owner).revealNFT(1)).to.be
      .reverted;

    await expect(this.genesisNFTManager.connect(owner).revealNFT(10000)).to.be
      .reverted;
  });

  it("pauseNFTCore()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();

    await this.genesisNFTManager.mintNFTBatch([
      owner.address,
      addresses[0].address,
      addresses[1].address,
      addresses[2].address,
    ]);

    await this.genesisNFTManager.pauseNFTCore();
    await expect(
      this.genesisNFTCore.transferFrom(owner.address, addresses[0].address, 1)
    ).to.be.reverted;

    await this.genesisNFTManager.unpauseNFTCore();
    await this.genesisNFTCore.transferFrom(
      owner.address,
      addresses[0].address,
      1
    );
  });

  it("transferOwnership()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();

    expect(await this.genesisNFTCore.owner()).to.equal(
      this.genesisNFTManager.address
    );

    const revealTs = await time.latest();
    const GenesisNFTManager = await hre.ethers.getContractFactory(
      "GenesisNFTManager"
    );
    const newGenesisNFTManager = await GenesisNFTManager.connect(owner).deploy(
      this.genesisNFTCore.address,
      revealTs
    );
    await newGenesisNFTManager.deployed();
    expect(await this.genesisNFTCore.owner()).not.equal(
      newGenesisNFTManager.address
    );

    await expect(
      this.genesisNFTManager
        .connect(addresses[0])
        .transferOwnership(newGenesisNFTManager.address)
    ).to.be.reverted;
    await this.genesisNFTManager
      .connect(owner)
      .transferOwnership(newGenesisNFTManager.address);
    expect(await this.genesisNFTCore.owner()).to.equal(
      newGenesisNFTManager.address
    );
  });

  it("setBaseURI()", async function () {
    const [owner, ...addresses] = await ethers.getSigners();
    await expect(
      this.genesisNFTManager
        .connect(addresses[0])
        .setBaseURI(
          "https://new-test-api.swich.finance/v1/genesis-nfts/metadata/"
        )
    ).to.be.reverted;

    expect(await this.genesisNFTCore.baseURI()).not.equal(
      "https://new-test-api.swich.finance/v1/genesis-nfts/metadata/"
    );
    await this.genesisNFTManager
      .connect(owner)
      .setBaseURI(
        "https://new-test-api.swich.finance/v1/genesis-nfts/metadata/"
      );
    expect(await this.genesisNFTCore.baseURI()).to.equal(
      "https://new-test-api.swich.finance/v1/genesis-nfts/metadata/"
    );
  });
});
