const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { config } = require("../../config/contract.config");

describe("WaveXNFTV2", function () {
  // Fixture to deploy the contract and set up initial state
  async function deployContractFixture() {
    const [owner, merchant, user] = await ethers.getSigners();

    // Deploy mock tokens (USDT/USDC)
    const MockToken = await ethers.getContractFactory("MockERC20");
    const usdt = await MockToken.deploy("Mock USDT", "USDT");
    const usdc = await MockToken.deploy("Mock USDC", "USDC");

    // Deploy WaveXNFTV2
    const WaveXNFTV2 = await ethers.getContractFactory("WaveXNFTV2");
    const wavexNFT = await WaveXNFTV2.deploy();

    // Initialize contract
    await wavexNFT.initializeDefaultTemplates();
    await wavexNFT.addSupportedToken(await usdt.getAddress());
    await wavexNFT.addSupportedToken(await usdc.getAddress());
    await wavexNFT.authorizeMerchant(merchant.address);

    return {
      wavexNFT,
      usdt,
      usdc,
      owner,
      merchant,
      user
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct name and symbol", async function () {
      const { wavexNFT } = await loadFixture(deployContractFixture);
      expect(await wavexNFT.name()).to.equal("WaveX NFT V2");
      expect(await wavexNFT.symbol()).to.equal("WAVEX2");
    });

    it("Should initialize default templates", async function () {
      const { wavexNFT } = await loadFixture(deployContractFixture);
      const goldTemplate = await wavexNFT.getTemplate(1);
      const platinumTemplate = await wavexNFT.getTemplate(2);

      expect(goldTemplate.name).to.equal("Gold");
      expect(platinumTemplate.name).to.equal("Platinum");
    });
  });

  describe("Template Management", function () {
    it("Should allow owner to add new template", async function () {
      const { wavexNFT, owner } = await loadFixture(deployContractFixture);
      
      await wavexNFT.addTemplate(
        3,
        "Black",
        ethers.parseEther("5000"),
        ethers.parseEther("5000"),
        0,
        true,
        "",
        true
      );

      const template = await wavexNFT.getTemplate(3);
      expect(template.name).to.equal("Black");
      expect(template.isVIP).to.be.true;
    });

    it("Should not allow non-owner to add template", async function () {
      const { wavexNFT, user } = await loadFixture(deployContractFixture);
      
      await expect(
        wavexNFT.connect(user).addTemplate(
          3,
          "Black",
          ethers.parseEther("5000"),
          ethers.parseEther("5000"),
          0,
          true,
          "",
          true
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Token Minting", function () {
    it("Should mint token from template", async function () {
      const { wavexNFT, user } = await loadFixture(deployContractFixture);
      const price = ethers.parseEther("1000");
      
      await expect(
        wavexNFT.connect(user).mintFromTemplate(
          1, // Gold template
          user.address,
          "ipfs://metadata",
          { value: price }
        )
      ).to.emit(wavexNFT, "BalanceUpdated");

      expect(await wavexNFT.ownerOf(1)).to.equal(user.address);
    });
  });

  describe("Balance Management", function () {
    it("Should allow token top-up", async function () {
      const { wavexNFT, usdt, user } = await loadFixture(deployContractFixture);
      const amount = ethers.parseEther("100");

      // Mint token first
      await wavexNFT.connect(user).mintFromTemplate(
        1,
        user.address,
        "ipfs://metadata",
        { value: ethers.parseEther("1000") }
      );

      // Approve USDT spending
      await usdt.mint(user.address, amount);
      await usdt.connect(user).approve(await wavexNFT.getAddress(), amount);

      // Top up balance
      await expect(
        wavexNFT.connect(user).topUpBalance(1, amount, await usdt.getAddress())
      ).to.emit(wavexNFT, "BalanceUpdated");
    });

    it("Should allow merchant to process payment", async function () {
      const { wavexNFT, merchant, user } = await loadFixture(deployContractFixture);
      
      // Mint token with initial balance
      await wavexNFT.connect(user).mintFromTemplate(
        1,
        user.address,
        "ipfs://metadata",
        { value: ethers.parseEther("1000") }
      );

      // Process payment
      const paymentAmount = ethers.parseEther("100");
      await expect(
        wavexNFT.connect(merchant).processPayment(
          1,
          paymentAmount,
          "Test payment"
        )
      ).to.emit(wavexNFT, "BalanceUpdated");
    });
  });

  describe("Event Management", function () {
    it("Should create and purchase event", async function () {
      const { wavexNFT, owner, user } = await loadFixture(deployContractFixture);
      
      // Create event
      const eventPrice = ethers.parseEther("100");
      const createTx = await wavexNFT.createEvent(
        "Test Event",
        eventPrice,
        100, // capacity
        1 // event type
      );
      const receipt = await createTx.wait();
      
      // Get event ID from transaction logs
      const eventId = receipt.logs[0].args[0];

      // Mint token for user
      await wavexNFT.connect(user).mintFromTemplate(
        1,
        user.address,
        "ipfs://metadata",
        { value: ethers.parseEther("1000") }
      );

      // Purchase event
      await expect(
        wavexNFT.connect(user).purchaseEventEntrance(1, eventId)
      ).to.emit(wavexNFT, "EventPurchased");
    });
  });

  describe("Merchant Management", function () {
    it("Should manage merchant authorization", async function () {
      const { wavexNFT, owner, user } = await loadFixture(deployContractFixture);
      
      await wavexNFT.authorizeMerchant(user.address);
      expect(await wavexNFT.authorizedMerchants(user.address)).to.be.true;

      await wavexNFT.revokeMerchant(user.address);
      expect(await wavexNFT.authorizedMerchants(user.address)).to.be.false;
    });
  });
});