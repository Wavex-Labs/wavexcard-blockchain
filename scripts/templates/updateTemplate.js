// scripts/templates/updateTemplate.js
const hre = require("hardhat");
const { TEMPLATE_METADATA } = require('../config/metadataConfig');
const { getTemplateMetadata } = require('../config/templateConfig');
require('dotenv').config();

async function updateTemplate(templateId, options = {}) {
    try {
        console.log(`\nUpdating template ${templateId}...`);

        // Validate template exists in metadata config
        if (!TEMPLATE_METADATA[templateId]) {
            throw new Error(`Template ID ${templateId} not found in metadata configuration`);
        }

        const template = TEMPLATE_METADATA[templateId];
        console.log('New template configuration:', {
            name: template.name,
            baseBalance: template.baseBalance,
            price: template.price,
            discount: template.discount,
            isVIP: template.isVIP
        });

        // Generate metadata
        console.log('\nGenerating metadata...');
        const metadata = await getTemplateMetadata(templateId);

        // Use local URI scheme
        const metadataURI = `template-${templateId}`;
        console.log('Using metadata URI:', metadataURI);

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment");
        }
        console.log('\nContract address:', contractAddress);

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get gas settings from environment or use network defaults
        const gasPrice = process.env.GAS_PRICE ? hre.ethers.parseUnits(process.env.GAS_PRICE.toString(), "wei") : undefined;
        const gasLimit = process.env.GAS_LIMIT ? BigInt(process.env.GAS_LIMIT) : undefined;

        console.log('\nUsing gas settings:', {
            gasPrice: gasPrice ? `${hre.ethers.formatUnits(gasPrice, "gwei")} gwei` : "network default",
            gasLimit: gasLimit ? gasLimit.toString() : "network default"
        });

        // First simulate the transaction to get potential revert reason
        try {
            await wavexNFT.modifyTemplate.staticCall(
                templateId,
                template.name,
                hre.ethers.parseEther(template.baseBalance || "0"),
                hre.ethers.parseEther(template.price || "0"),
                template.discount || 0,
                template.isVIP || false,
                metadataURI,
                true // active
            );
        } catch (error) {
            console.error("\nTransaction would fail:", error.reason || error.message);
            throw error;
        }

        // If simulation succeeds, send the actual transaction
        console.log('\nSending transaction to update template...');
        const tx = await wavexNFT.modifyTemplate(
            templateId,
            template.name,
            hre.ethers.parseEther(template.baseBalance || "0"),
            hre.ethers.parseEther(template.price || "0"),
            template.discount || 0,
            template.isVIP || false,
            metadataURI,
            true, // active
            {
                gasPrice,
                gasLimit
            }
        );

        console.log('Transaction sent:', tx.hash);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        
        // Verify template was updated
        console.log('\nVerifying template update...');
        const updatedTemplate = await wavexNFT.getTemplate(templateId);
        console.log('Template verified:', {
            name: updatedTemplate[0],
            baseBalance: hre.ethers.formatEther(updatedTemplate[1]),
            price: hre.ethers.formatEther(updatedTemplate[2]),
            discount: Number(updatedTemplate[3]),
            isVIP: updatedTemplate[4],
            metadataURI: updatedTemplate[5],
            active: updatedTemplate[6]
        });

        return {
            templateId,
            metadataURI,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber
        };

    } catch (error) {
        console.error("\nError updating template:");
        console.error('- Message:', error.message);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.code) console.error('- Code:', error.code);
        if (error.data) console.error('- Data:', error.data);
        if (error.transaction) console.error('- Transaction:', error.transaction);
        throw error;
    }
}

// Parse command line arguments
async function main() {
    // Get template ID from command line arguments
    const templateId = process.argv.length > 2 ? parseInt(process.argv[2]) : 1;
    
    try {
        const result = await updateTemplate(templateId);
        console.log("\nTemplate update successful!");
        console.log("Result:", result);
        process.exit(0);
    } catch (error) {
        console.error("\nTemplate update failed:", error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = updateTemplate;