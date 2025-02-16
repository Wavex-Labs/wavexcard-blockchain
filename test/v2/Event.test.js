// test/v2/Event.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Event Contract Tests", function () {
    let wavexNFTV2;
    let owner;
    let user;
    let templateId; // Declare templateId here

    beforeEach(async function () {
        const WaveXNFTV2 = await ethers.getContractFactory("WaveXNFTV2");
        wavexNFTV2 = await WaveXNFTV2.deploy();
        await wavexNFTV2.waitForDeployment();
        [owner, user] = await ethers.getSigners();

        // Initialize default templates
        await wavexNFTV2.initializeDefaultTemplates();

        // Create a new template with low price for testing
        const txCreateTemplate = await wavexNFTV2.addTemplate(
            3,
            "TestTemplate",
            ethers.parseUnits("100", "ether"),
            ethers.parseUnits("1", "ether"), // Low price for testing
            0,
            false,
            "ipfs://test-template.json",
            true
        );
        await txCreateTemplate.wait();
        templateId = 3; // Set templateId to the newly created template

        // Mint NFT to user, but don't top up balance for insufficient balance test
        await wavexNFTV2.mintFromTemplate(templateId, user.address, "ipfs://nft-metadata.json", { value: ethers.parseUnits("1", "ether") }); // Mint with minimal payment
    });

    it("Should create an event", async function () {
        const eventName = "VIP Party";
        const eventPrice = ethers.parseUnits("100", "ether");
        const eventCapacity = 100;
        const eventType = 1; // Standard event

        const tx = await wavexNFTV2.createEvent(
            eventName,
            eventPrice,
            eventCapacity,
            eventType
        );
        const receipt = await tx.wait();
        const eventId = receipt.logs[0].args[0]; // Get eventId from event

        await expect(tx)
            .to.emit(wavexNFTV2, "EventCreated")
            .withArgs(
                eventId,
                eventName,
                eventCapacity
            );

        const event = await wavexNFTV2.events(eventId); // Access event mapping directly
        expect(event.name).to.equal(eventName);
        expect(event.price).to.equal(eventPrice);
        expect(event.capacity).to.equal(eventCapacity);
        expect(event.eventType).to.equal(eventType);
        expect(event.active).to.equal(true); // Default active is true
        expect(event.soldCount).to.equal(0); // Initial soldCount is 0
    });

    it("Should purchase event entrance", async function () {
        const eventName = "Exclusive Dinner";
        const eventPrice = ethers.parseUnits("50", "ether");
        const eventCapacity = 50;
        const eventType = 2; // VIP event

        const txEventCreate = await wavexNFTV2.createEvent(
            eventName,
            eventPrice,
            eventCapacity,
            eventType
        );
        const receiptEventCreate = await txEventCreate.wait();
        const eventId = receiptEventCreate.logs[0].args[0];

        // Top up user's balance (optional, balance is already set on mint)
        // await wavexNFTV2.topUpBalance(1, ethers.parseUnits("1000", "ether"), ethers.ZeroAddress);


        const initialBalance = await wavexNFTV2.tokenBalance(1);

        const txPurchase = await wavexNFTV2.purchaseEventEntrance(1, eventId);
        await txPurchase.wait();

        const finalBalance = await wavexNFTV2.tokenBalance(1);
        expect(finalBalance).to.equal(initialBalance - eventPrice);

        await expect(txPurchase)
            .to.emit(wavexNFTV2, "EventPurchased")
            .withArgs(1, eventId);

        await expect(txPurchase)
            .to.emit(wavexNFTV2, "BalanceUpdated")
            .withArgs(1, finalBalance, "EVENT_PURCHASE");

        const event = await wavexNFTV2.events(eventId);
        expect(event.soldCount).to.equal(1); // soldCount should increase
    });

    it("Should fail to purchase event entrance if insufficient balance", async function () {
        const eventName = "Expensive Gala";
        const eventPrice = ethers.parseUnits("2000", "ether"); // Event price higher than initial balance
        const eventCapacity = 20;
        const eventType = 3; // Exclusive event

        const txEventCreate = await wavexNFTV2.createEvent(
            eventName,
            eventPrice,
            eventCapacity,
            eventType
        );
        const receiptEventCreate = await txEventCreate.wait();
        const eventId = receiptEventCreate.logs[0].args[0];

        await expect(wavexNFTV2.purchaseEventEntrance(1, eventId))
            .to.be.revertedWith("Insufficient balance");
    });

    it("Should fail to purchase event entrance if event is full", async function () {
        const eventName = "Limited Spots Event";
        const eventPrice = ethers.parseUnits("10", "ether");
        const eventCapacity = 1; // Event capacity is 1
        const eventType = 1; // Standard event

        const txEventCreate = await wavexNFTV2.createEvent(
            eventName,
            eventPrice,
            eventCapacity,
            eventType
        );
        const receiptEventCreate = await txEventCreate.wait();
        const eventId = receiptEventCreate.logs[0].args[0];

        // First purchase should succeed
        await wavexNFTV2.purchaseEventEntrance(1, eventId);

        // Second purchase should fail as event is full
        await expect(wavexNFTV2.purchaseEventEntrance(1, eventId))
            .to.be.revertedWith("Event full");
    });
});