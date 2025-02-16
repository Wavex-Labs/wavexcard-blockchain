// Terminal Command: npx hardhat run scripts/templates/listTemplates.js --network polygonAmoy
const hre = require("hardhat");
const { gasManager } = require('../utils/gasUtils');
require('dotenv').config();

async function listTemplates(options = {}) {
    try {
        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V3_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V3_ADDRESS not found in environment");
        }

        console.log("Contract address:", contractAddress);

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV3");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get network gas settings from environment variables instead of network config
        const gasSettings = {
            gasPrice: process.env.GAS_PRICE 
                ? hre.ethers.parseUnits(process.env.GAS_PRICE.toString(), "wei")
                : undefined,
            gasLimit: process.env.GAS_LIMIT 
                ? BigInt(process.env.GAS_LIMIT)
                : undefined
        };

        console.log('\nUsing gas settings:', {
            gasPrice: gasSettings.gasPrice 
                ? `${hre.ethers.formatUnits(gasSettings.gasPrice, "gwei")} gwei`
                : "network default",
            gasLimit: gasSettings.gasLimit 
                ? gasSettings.gasLimit.toString()
                : "network default"
        });

        console.log("\nFetching template information...");
        
        const templates = [];
        
        // Get total template count
        const templateCount = await wavexNFT.getTemplateCount();
        console.log(`\nFound ${templateCount.toString()} total templates`);
        
        // Iterate through all templates
        for (let i = 1; i <= templateCount; i++) {
            try {
                const template = await wavexNFT.getTemplate(i);

                const templateInfo = {
                    id: i,
                    name: template[0],
                    baseBalance: `$${hre.ethers.formatEther(template[1])}`,
                    price: `$${hre.ethers.formatEther(template[2])}`,
                    discount: Number(template[3]),
                    isVIP: template[4],
                    metadataURI: template[5],
                    active: template[6]
                };

                templates.push(templateInfo);

                console.log(`\nTemplate ${i}:`);
                console.log(`- Name: ${templateInfo.name}`);
                console.log(`- Base Balance: ${templateInfo.baseBalance} USD`);
                console.log(`- Price: ${templateInfo.price} USD`);
                console.log(`- Discount: ${templateInfo.discount}%`);
                console.log(`- VIP: ${templateInfo.isVIP}`);
                console.log(`- Active: ${templateInfo.active}`);
                console.log(`- Metadata URI: ${templateInfo.metadataURI}`);

            } catch (error) {
                if (error.message.includes("Template does not exist")) {
                    console.log(`Template ${i} not found or inactive`);
                } else {
                    console.error(`Error fetching template ${i}:`, error.message);
                }
            }
        }

        if (options.format === 'json') {
            console.log("\nTemplate List (JSON):");
            console.log(JSON.stringify(templates, null, 2));
        } else {
            console.log("\nTemplate List (Table):");
            console.table(templates);
        }

        return templates;
    } catch (error) {
        console.error("\nError listing templates:");
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        if (error.code) console.error('- Code:', error.code);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.data) console.error('- Data:', error.data);
        throw error;
    }
}

// Export the function
module.exports = listTemplates;

// Run if called directly
if (require.main === module) {
    listTemplates()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}