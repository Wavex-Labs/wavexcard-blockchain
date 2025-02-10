const hre = require("hardhat");
const { getTemplateMetadata } = require('../config/templateConfig');
require('dotenv').config();

async function createTemplate(templateId = null, options = {}) {
  try {
    // Get contract instance
    const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
    const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
    const wavexNFT = WaveXNFT.attach(contractAddress);

    // If no templateId provided, get the next available ID
    if (templateId === null) {
      const currentCount = await wavexNFT.getTemplateCount();
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
      contractAddress: process.env.WAVEX_NFT_V2_ADDRESS,
      gasPrice: process.env.GAS_PRICE,
      gasLimit: process.env.GAS_LIMIT
    };

    // Basic validation
    if (!config.name) {
      throw new Error(`Template name not found in environment variables`);
    }

    if (!config.contractAddress) {
      throw new Error("WAVEX_NFT_V2_ADDRESS not found in environment");
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

    // Configure gas settings
    const gasSettings = {
      gasPrice: config.gasPrice 
        ? hre.ethers.parseUnits(config.gasPrice.toString(), "wei")
        : undefined,
      gasLimit: config.gasLimit 
        ? BigInt(config.gasLimit)
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

    // Check if template exists
    let operation = 'create';
    try {
      await wavexNFT.getTemplate(templateId);
      console.log('\nTemplate already exists. Updating template...');
      operation = 'update';
    } catch (error) {
      if (!error.message.includes("Template does not exist")) {
        throw error;
      }
      console.log('\nCreating new template...');
    }

    // Prepare transaction
    const tx = operation === 'update' 
      ? await wavexNFT.modifyTemplate(
          templateId,
          config.name,
          hre.ethers.parseEther(config.baseBalance),
          hre.ethers.parseEther(config.price),
          config.discount,
          config.isVIP,
          metadataURI,
          true,
          gasSettings
        )
      : await wavexNFT.addTemplate(
          templateId,
          config.name,
          hre.ethers.parseEther(config.baseBalance),
          hre.ethers.parseEther(config.price),
          config.discount,
          config.isVIP,
          metadataURI,
          true,
          gasSettings
        );

    console.log(`${operation === 'update' ? 'Update' : 'Creation'} transaction sent:`, tx.hash);
    console.log('Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log(`Template ${operation} confirmed in block:`, receipt.blockNumber);

    // Verify template
    console.log('\nVerifying template...');
    const createdTemplate = await wavexNFT.getTemplate(templateId);
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