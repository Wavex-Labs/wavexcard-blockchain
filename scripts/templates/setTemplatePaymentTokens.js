const { ethers, network } = require("hardhat");

const { gasManager } = require('../utils/gasUtils');
 
async function main() {
    const [signer] = await ethers.getSigners();
    console.log(`Using signer: ${signer.address}`);
    console.log(`Current Network: ${network.name}`);

    // Get contract addresses from environment
    const nftAddress = process.env.WAVEX_NFT_V3_ADDRESS;
    const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;

    if (!nftAddress || !usdtAddress) {
        throw new Error("Missing required environment variables");
    }

    console.log('NFT Contract Address:', nftAddress);
    console.log('USDT Contract Address:', usdtAddress);

    // Initialize contract
    const nftContract = await ethers.getContractAt("WaveXNFTV3", nftAddress, signer);

    // Get gas config
    const gasConfig = await gasManager.getGasConfig();
    console.log('\nGas Configuration:', {
        maxFeePerGas: gasConfig.maxFeePerGas.toString(),
        maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas.toString()
    });

    // First add USDT as supported token if not already
    console.log('\nAdding USDT as supported token...');
    const addSupportedTx = await nftContract.addSupportedToken(usdtAddress, {
        maxFeePerGas: gasConfig.maxFeePerGas,
        maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas
    });
    await addSupportedTx.wait();
    console.log('USDT added as supported token');

    // Set USDT as payment token for template 1
    console.log('\nSetting USDT as payment token for template 1...');
    const setPaymentTx = await nftContract.setTemplatePaymentToken(1, usdtAddress, {
        maxFeePerGas: gasConfig.maxFeePerGas,
        maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas
    });
    await setPaymentTx.wait();
    console.log('Payment token set successfully');

    // Verify the settings
    const template = await nftContract.getTemplate(1);
    const templatePaymentToken = await nftContract.templatePaymentTokens(1);
    
    console.log('\nTemplate 1 Details:');
    console.log('Name:', template.name);
    console.log('Price:', ethers.formatUnits(template.price, 18));
    console.log('Payment Token:', templatePaymentToken);
    console.log('Active:', template.active);
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { main };