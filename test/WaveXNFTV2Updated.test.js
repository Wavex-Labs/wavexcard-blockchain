const hre = require("hardhat");
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting test sequence...\n");

    // Load deployment info
    const deploymentPath = path.join(__dirname, '../deployments', `${hre.network.name}_deployment_updated.json`);
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment info not found. Please run deployV2Updated.js first.");
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath));
    
    // Get contract instances
    const nftContract = await hre.ethers.getContractAt(
        "WaveXNFTV2Updated",
        deploymentInfo.WaveXNFTV2Updated
    );

    // Get signers
    const [owner, buyer, merchant] = await hre.ethers.getSigners();
    console.log("Testing with accounts:");
    console.log("Owner:", owner.address);
    console.log("Buyer:", buyer.address);
    console.log("Merchant:", merchant.address);

    // Test 1: Authorize merchant
    console.log("\nTest 1: Authorizing merchant...");
    const authTx = await nftContract.authorizeMerchant(merchant.address);
    await authTx.wait();
    const isMerchant = await nftContract.authorizedMerchants(merchant.address);
    console.log("Merchant authorized:", isMerchant);
    expect(isMerchant).to.be.true;

    // Test 2: Mint NFT from template
    console.log("\nTest 2: Minting NFT from template...");
    const templateId = 1; // Gold template
    const mintTx = await nftContract.mintFromTemplate(
        templateId,
        buyer.address,
        "ipfs://QmTest"
    );
    const mintReceipt = await mintTx.wait();
    const mintEvent = mintReceipt.events.find(e => e.event === "Transfer");
    const tokenId = mintEvent.args.tokenId;
    console.log("Minted token ID:", tokenId);
    expect(await nftContract.ownerOf(tokenId)).to.equal(buyer.address);

    // Test 3: Create event
    console.log("\nTest 3: Creating event...");
    const createEventTx = await nftContract.createEvent(
        "Test Event",
        hre.ethers.parseEther("0.1"),
        100, // capacity
        1 // event type
    );
    const eventReceipt = await createEventTx.wait();
    const eventCreatedLog = eventReceipt.events.find(e => e.event === "EventCreated");
    const eventId = eventCreatedLog.args.eventId;
    console.log("Created event ID:", eventId);

    // Test 4: Purchase event entrance
    console.log("\nTest 4: Purchasing event entrance...");
    const purchaseTx = await nftContract.connect(buyer).purchaseEventEntrance(tokenId, eventId);
    await purchaseTx.wait();
    const hasTicket = (await nftContract.getTokenEvents(tokenId)).includes(eventId);
    console.log("Has ticket:", hasTicket);
    expect(hasTicket).to.be.true;

    // Test 5: Check in to event
    console.log("\nTest 5: Checking in to event...");
    const checkInTx = await nftContract.connect(merchant).checkInEvent(tokenId, eventId);
    await checkInTx.wait();
    const isCheckedIn = await nftContract.isCheckedIn(eventId, tokenId);
    console.log("Checked in:", isCheckedIn);
    expect(isCheckedIn).to.be.true;

    // Test 6: Verify double check-in prevention
    console.log("\nTest 6: Verifying double check-in prevention...");
    try {
        await nftContract.connect(merchant).checkInEvent(tokenId, eventId);
        throw new Error("Should not allow double check-in");
    } catch (error) {
        if (error.message.includes("Already checked in")) {
            console.log("Double check-in prevented successfully");
        } else {
            throw error;
        }
    }

    console.log("\nAll tests completed successfully!");
}

// Execute tests
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Test failed:", error);
            process.exit(1);
        });
}

module.exports = { testV2Updated: main };