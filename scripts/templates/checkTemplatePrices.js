const { ethers, network } = require("hardhat");

async function checkTemplatePrices() {
    try {
        const [signer] = await ethers.getSigners();
        console.log(`Using signer: ${signer.address}`);
        console.log(`Current Network: ${network.name}`);

        const nftAddress = process.env.WAVEX_NFT_V3_ADDRESS;
        const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;

        if (!nftAddress || !usdtAddress) {
            throw new Error("Missing required environment variables");
        }

        const nftContract = await ethers.getContractAt("WaveXNFTV3", nftAddress, signer);
        const usdtContract = await ethers.getContractAt("IERC20V3", usdtAddress, signer);

        // Get template count
        const templateCount = await nftContract.getTemplateCount();
        console.log(`\nTotal templates: ${templateCount}`);

        // Get USDT balance
        const balance = await usdtContract.balanceOf(signer.address);
        console.log(`\nYour USDT Balance: ${ethers.formatUnits(balance, 6)} USDT`);

        console.log('\nTemplate Details:');
        console.log('----------------');

        // Check each template
        for (let i = 1; i <= templateCount; i++) {
            try {
                const template = await nftContract.getTemplate(i);
                const priceIn18Decimals = ethers.toBigInt(template.price.toString());
                const conversionFactor = ethers.toBigInt(10) ** ethers.toBigInt(12);
                const priceIn6Decimals = priceIn18Decimals / conversionFactor;

                console.log(`\nTemplate ${i}:`);
                console.log(`Name: ${template.name}`);
                console.log(`Price (18 decimals): ${priceIn18Decimals.toString()}`);
                console.log(`Price (6 decimals): ${priceIn6Decimals.toString()} USDT`);
                console.log(`Base Balance: ${ethers.formatEther(template.baseBalance)} ETH`);
                console.log(`Active: ${template.active}`);

                const paymentToken = await nftContract.templatePaymentTokens(i);
                console.log(`Payment Token: ${paymentToken}`);

                if (balance < priceIn6Decimals) {
                    console.log(`WARNING: Insufficient balance for this template. Need ${priceIn6Decimals.toString()} USDT more`);
                }
            } catch (error) {
                console.log(`Error fetching template ${i}: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    checkTemplatePrices()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { checkTemplatePrices };