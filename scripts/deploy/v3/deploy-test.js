const hre = require("hardhat");
const config = require("./config");

async function main() {
    console.log("Starting test deployment for V3...");

    try {
        // Deploy library first
        const WaveXLibV3 = await hre.ethers.getContractFactory("WaveXLibV3");
        const lib = await WaveXLibV3.deploy();
        await lib.waitForDeployment();
        const libAddress = await lib.getAddress();
        console.log("Library deployed to:", libAddress);

        // Link library and deploy main contract
        const WaveXNFTV3 = await hre.ethers.getContractFactory("WaveXNFTV3", {
            libraries: {
                WaveXLibV3: libAddress
            }
        });
        const nft = await WaveXNFTV3.deploy();
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();
        console.log("NFT Contract deployed to:", nftAddress);

        // Test basic functionality
        await nft.initializeDefaultTemplates();
        console.log("Default templates initialized");

        // Get template count
        const count = await nft.getTemplateCount();
        console.log("Template count:", count.toString());

        // Test getting template details
        const template = await nft.getTemplate(1);
        console.log("Template 1 details:", template);

    } catch (error) {
        console.error("Deployment failed:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });