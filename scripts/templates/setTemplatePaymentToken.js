const { ethers, network } = require("hardhat");

async function setTemplatePaymentToken() {
    try {
        const [signer] = await ethers.getSigners();
        console.log(`Using signer: ${signer.address}`);
        console.log(`Current Network: ${network.name}`);

        const nftAddress = process.env.WAVEX_NFT_V3_ADDRESS;
        const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;
        const templateId = process.env.MINT_FROM_TEMPLATE_ID;

        if (!nftAddress || !usdtAddress || !templateId) {
            throw new Error("Missing required environment variables");
        }

        console.log('NFT Contract:', nftAddress);
        console.log('USDT Address:', usdtAddress);
        console.log('Template ID:', templateId);

        const nftContract = await ethers.getContractAt("WaveXNFTV3", nftAddress, signer);

        // Check current payment token
        const currentPaymentToken = await nftContract.templatePaymentTokens(templateId);
        console.log('Current template payment token:', currentPaymentToken);

        if (currentPaymentToken.toLowerCase() === usdtAddress.toLowerCase()) {
            console.log('Payment token already set correctly');
            return;
        }

        // Check if USDT is supported
        const isSupported = await nftContract.supportedTokens(usdtAddress);
        if (!isSupported) {
            console.log('Adding USDT as supported token...');
            const addTx = await nftContract.addSupportedToken(usdtAddress);
            await addTx.wait();
            console.log('USDT added as supported token');
        }

        console.log('Setting template payment token...');
        const tx = await nftContract.setTemplatePaymentToken(templateId, usdtAddress);
        await tx.wait();
        console.log('Template payment token set successfully');

        // Verify the change
        const newPaymentToken = await nftContract.templatePaymentTokens(templateId);
        console.log('New template payment token:', newPaymentToken);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    setTemplatePaymentToken()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { setTemplatePaymentToken };