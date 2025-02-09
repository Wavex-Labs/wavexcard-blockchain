// scripts/test/testTemplateCreation.js
const hre = require("hardhat");
require('dotenv').config();

async function main() {
    console.error('\nStarting template creation test...');
    
    try {
        // Validate required environment variables
        const requiredEnvVars = [
            'PRIVATE_KEY',
            'WAVEX_NFT_V2_ADDRESS',
            'GAS_LIMIT',
            'GAS_PRICE'
        ];

        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }

        console.error('Environment variables validated');

        // Get contract instance
        console.error('\nGetting contract instance...');
        console.error('Contract address:', process.env.WAVEX_NFT_V2_ADDRESS);
        
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        console.error('Contract factory obtained');
        
        const wavexNFT = WaveXNFT.attach(process.env.WAVEX_NFT_V2_ADDRESS);
        console.error('Contract instance attached');

        // Get template parameters from environment
        const templateId = parseInt(process.env.TEMPLATE_ID || "1");
        const templateName = process.env.TEMPLATE_NAME || "Gold";
        const baseBalance = process.env.TEMPLATE_BASE_BALANCE || "20";
        const price = process.env.TEMPLATE_PRICE || "20";
        const discount = parseInt(process.env.TEMPLATE_DISCOUNT || "0");
        const isVIP = process.env.TEMPLATE_IS_VIP === 'true';
        const metadataURI = `template-${templateId}`;

        console.error('\nTemplate Parameters:', {
            templateId,
            templateName,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI
        });

        // Gas settings from environment
        const gasSettings = {
            gasPrice: BigInt(process.env.GAS_PRICE),
            gasLimit: BigInt(process.env.GAS_LIMIT)
        };

        console.error('\nGas Settings:', {
            gasPrice: gasSettings.gasPrice.toString(),
            gasLimit: gasSettings.gasLimit.toString()
        });

        console.error('\nSending transaction...');
        const tx = await wavexNFT.addTemplate(
            templateId,
            templateName,
            hre.ethers.parseEther(baseBalance),
            hre.ethers.parseEther(price),
            discount,
            isVIP,
            metadataURI,
            true, // active
            gasSettings
        );

        console.error('Transaction sent:', tx.hash);
        console.error('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.error('\nTransaction confirmed!');
        console.error('Block number:', receipt.blockNumber);
        console.error('Gas used:', receipt.gasUsed.toString());

        // Verify template was created
        console.error('\nVerifying template...');
        const template = await wavexNFT.getTemplate(templateId);
        console.error('Template verified:', {
            name: template[0],
            baseBalance: hre.ethers.formatEther(template[1]),
            price: hre.ethers.formatEther(template[2]),
            discount: Number(template[3]),
            isVIP: template[4],
            metadataURI: template[5],
            active: template[6]
        });

        return {
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        };

    } catch (error) {
        console.error('\nError creating template:');
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        if (error.code) console.error('- Code:', error.code);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.data) console.error('- Data:', error.data);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Execute if run directly
if (require.main === module) {
    main()
        .then((result) => {
            console.error('\nExecution result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
            console.error('\nUnhandled error:', error);
            process.exit(1);
        });
}

module.exports = main;