// scripts/events/testMetadata.js
const { 
    generateEventMetadata, 
    saveEventMetadata 
} = require('./eventMetadata');

async function main() {
    // Test event data
    const eventData = {
        id: "20118555884664906777450632590385202544243916988406321193658098884280408961172",
        name: "Wavex Brunch",
        price: "600",
        capacity: "20",
        eventType: 0,
        active: true
    };

    const options = {
        description: "Special Wavex Brunch Event",
        image: process.env.DEFAULT_EVENT_IMAGE // From your .env file
    };

    try {
        console.log("Generating metadata...");
        const metadata = await generateEventMetadata(eventData, options);
        console.log("Generated Metadata:", JSON.stringify(metadata, null, 2));

        console.log("\nSaving to IPFS...");
        const ipfsHash = await saveEventMetadata(eventData.id, metadata);
        console.log("IPFS Hash:", ipfsHash);

    } catch (error) {
        console.error("Error:", error);
    }
}

// Execute with Hardhat
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}