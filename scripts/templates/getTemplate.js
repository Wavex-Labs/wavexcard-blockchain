// scripts/templates/getTemplate.js Terminal Command: npx hardhat run scripts/templates/getTemplate.js --network polygonAmoy
const hre = require("hardhat");
const { gasManager } = require('../utils/gasUtils');
require('dotenv').config();

async function getTemplate(templateId) {
    try {
        console.log(`\nGetting template ${templateId}...`);

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V3_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V3_ADDRESS not found in environment");
        }
        console.log('\nContract address:', contractAddress);

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV3");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get template details
        const template = await wavexNFT.getTemplate(templateId);
        
        console.log('\nTemplate details:', {
            name: template[0],
            baseBalance: hre.ethers.formatEther(template[1]),
            price: hre.ethers.formatEther(template[2]),
            discount: Number(template[3]),
            isVIP: template[4],
            metadataURI: template[5],
            active: template[6]
        });

        return template;
    } catch (error) {
        console.error("\nError getting template:");
        console.error('- Message:', error.message);
        if (error.reason) console.error('- Reason:', error.reason);
        throw error;
    }
}

// Parse command line arguments
async function main() {
    // Get template ID from command line arguments
    // const templateId = process.argv.length > 2 ? parseInt(process.argv[2]) : 1;
    const templateId = process.env.TEMPLATE_ID;
    if (!templateId) {
        throw new Error("TEMPLATE_ID environment variable is required");
    }
    
    try {
        await getTemplate(templateId);
        process.exit(0);
    } catch (error) {
        console.error("\nTemplate retrieval failed:", error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = getTemplate;