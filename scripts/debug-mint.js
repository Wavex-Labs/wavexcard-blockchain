const { ethers, network } = require("hardhat");

async function debugMint() {
    try {
        const [signer] = await ethers.getSigners();
        console.log(`Using signer: ${signer.address}`);
        console.log(`Current Network: ${network.name}`);

        const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;
        const nftAddress = process.env.WAVEX_NFT_V3_ADDRESS;
        const templateId = process.env.MINT_FROM_TEMPLATE_ID;

        console.log('USDT Contract Address:', usdtAddress);
        console.log('NFT Contract Address:', nftAddress);
        console.log('Template ID:', templateId);

        // Contract initialization
        const USDT = await ethers.getContractAt("IERC20V3", usdtAddress, signer);
        const nftContract = await ethers.getContractAt("WaveXNFTV3", nftAddress, signer);

        // Get template details
        const template = await nftContract.getTemplate(templateId);
        console.log('\nTemplate Details:');
        console.log('Name:', template.name);
        console.log('Price (raw):', template.price.toString());
        console.log('Price (formatted 18 decimals):', ethers.formatUnits(template.price, 18));
        
        // Get USDT decimals
        const usdtDecimals = await USDT.decimals();
        console.log('\nUSDT Details:');
        console.log('Decimals:', usdtDecimals);

        // Get balances
        const usdtBalance = await USDT.balanceOf(signer.address);
        console.log('Balance (raw):', usdtBalance.toString());
        console.log('Balance (formatted 6 decimals):', ethers.formatUnits(usdtBalance, 6));

        // Calculate required amount in USDT decimals
        const requiredAmount = template.price / (BigInt(10) ** BigInt(18 - Number(usdtDecimals)));
        console.log('\nCalculations:');
        console.log('Required amount (raw):', requiredAmount.toString());
        console.log('Required amount (formatted 6 decimals):', ethers.formatUnits(requiredAmount, 6));

        // Check allowance
        const allowance = await USDT.allowance(signer.address, nftAddress);
        console.log('\nAllowance Details:');
        console.log('Current allowance (raw):', allowance.toString());
        console.log('Current allowance (formatted 6 decimals):', ethers.formatUnits(allowance, 6));

        // Compare values
        console.log('\nComparisons:');
        console.log('Has sufficient balance?', usdtBalance >= requiredAmount);
        console.log('Has sufficient allowance?', allowance >= requiredAmount);

        // Check template payment token
        const paymentToken = await nftContract.templatePaymentTokens(templateId);
        console.log('\nTemplate Payment Token:', paymentToken);
        console.log('Matches USDT address?', paymentToken.toLowerCase() === usdtAddress.toLowerCase());

        // Check if token is supported
        const isSupported = await nftContract.supportedTokens(usdtAddress);
        console.log('Is USDT supported?', isSupported);

    } catch (error) {
        console.error('Debug error:', error);
    }
}

if (require.main === module) {
    debugMint()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { debugMint };