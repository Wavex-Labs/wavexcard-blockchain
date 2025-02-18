// Terminal Command: npx hardhat run scripts/templates/createTemplate.js --network polygonAmoy
const hre = require("hardhat");
const { getTemplateMetadata } = require('../config/templateConfig');
const { gasManager } = require('../utils/gasUtils');
require('dotenv').config();

async function createTemplate(templateId = null, options = {}) {
    try {
        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V3_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV3");
        const wavexNFT = WaveXNFT.attach(contractAddress);
        const gasConfig = await gasManager.getGasConfig();

        // If no templateId provided, get the next available ID
        if (templateId === null) {
            const gasLimitCount = await gasManager.estimateGasWithMargin(wavexNFT, 'getTemplateCount');
            const currentCount = await wavexNFT.getTemplateCount({ ...gasConfig, gasLimit: gasLimitCount });
            templateId = Number(currentCount) + 1;
            console.log(`\nNo template ID provided. Using next available ID: ${templateId}`);
        }

        console.log(`\nManaging template ${templateId}...`);

        // Get all configuration from .env
        const config = {
            name: process.env.TEMPLATE_NEW_NAME,
            baseBalance: process.env.TEMPLATE_NEW_BASE_BALANCE || "0",
            price: process.env.TEMPLATE_NEW_PRICE || "0",
            discount: parseInt(process.env.TEMPLATE_NEW_DISCOUNT || "0"),
            isVIP: process.env.TEMPLATE_NEW_IS_VIP === "true" || false,
            contractAddress: process.env.WAVEX_NFT_V3_ADDRESS
        };

        // Basic validation
        if (!config.name) {
            throw new Error(`Template name not found in environment variables`);
        }

        if (!config.contractAddress) {
            throw new Error("WAVEX_NFT_V3_ADDRESS not found in environment");
        }

        console.log('Template configuration:', {
            name: config.name,
            baseBalance: config.baseBalance,
            price: config.price,
            discount: config.discount,
            isVIP: config.isVIP
        });

        // Generate metadata
        console.log('\nGenerating metadata...');
        const metadata = await getTemplateMetadata(templateId);

        // Use local URI scheme
        const metadataURI = `template-${templateId}`;
        console.log('Using metadata URI:', metadataURI);

        console.log('\nContract address:', config.contractAddress);

        // Check if template exists
        let operation = 'create';
        try {
            const gasLimit = await gasManager.estimateGasWithMargin(wavexNFT, 'getTemplate', [templateId]);
            await wavexNFT.getTemplate(templateId, { ...gasConfig, gasLimit });
            console.log('\nTemplate already exists. Updating template...');
            operation = 'update';
        } catch (error) {
            if (!error.message.includes("Template does not exist")) {
                throw error;
            }
            console.log('\nCreating new template...');
        }

        const tx = await (operation === 'update'
            ? wavexNFT.modifyTemplate(
                templateId,
                config.name,
                hre.ethers.parseEther(config.baseBalance),
                hre.ethers.parseEther(config.price),
                config.discount,
                config.isVIP,
                metadataURI,
                true,
                gasConfig
            )
            : wavexNFT.addTemplate(
                templateId,
                config.name,
                hre.ethers.parseEther(config.baseBalance),
                hre.ethers.parseEther(config.price),
                config.discount,
                config.isVIP,
                metadataURI,
                true,
                gasConfig
            ));

        console.log(`${operation === 'update' ? 'Update' : 'Creation'} transaction sent:`, tx.hash);
        console.log('Waiting for confirmation...');

        const receipt = await tx.wait();
        console.log(`Template ${operation} confirmed in block:`, receipt.blockNumber);

        // Verify template
        console.log('\nVerifying template...');
        const gasLimitGetTemplate = await gasManager.estimateGasWithMargin(wavexNFT, 'getTemplate', [templateId]);

        const createdTemplate = await wavexNFT.getTemplate(templateId, { ...gasConfig, gasLimit: gasLimitGetTemplate });

        console.log('Template verified:', {
            name: createdTemplate[0],
            baseBalance: hre.ethers.formatEther(createdTemplate[1]),
            price: hre.ethers.formatEther(createdTemplate[2]),
            discount: Number(createdTemplate[3]),
            isVIP: createdTemplate[4],
            metadataURI: createdTemplate[5],
            active: createdTemplate[6]
        });

        return {
            templateId,
            metadataURI,
            operation
        };

    } catch (error) {
        console.error("\nError managing template:");
        console.error('- Message:', error.message);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.code) console.error('- Code:', error.code);
        if (error.data) console.error('- Data:', error.data);
        if (error.transaction) console.error('- Transaction:', error.transaction);
        throw error;
    }
}

async function main() {
    // Get template ID from command line, environment variable, or auto-increment
    const templateId = process.argv.length > 2
        ? parseInt(process.argv[2])
        : (process.env.TEMPLATE_NEW_ID ? parseInt(process.env.TEMPLATE_NEW_ID) : null);

    try {
        const result = await createTemplate(templateId);
        console.log("\nTemplate management successful!");
        console.log("Result:", result);
        process.exit(0);
    } catch (error) {
        console.error("\nTemplate creation failed:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = createTemplate;