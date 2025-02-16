const { gasManager } = require('../utils/gasUtils');
// scripts/setup/setupTokens.js
async function main() {
    console.log("\n🚀 Starting token setup...");

    // Get contract
    const contractAddress = process.env.WAVEX_NFT_V3_ADDRESS;
    console.log(`📄 Contract Address: ${contractAddress}`);
    
    const WaveXNFTV3 = await hre.ethers.getContractFactory("WaveXNFTV3");
    const contract = WaveXNFTV3.attach(contractAddress);

    // Get token addresses
    const usdtAddress = process.env.USDT_CONTRACT_ADDRESS.split('#')[0].trim();
    const usdcAddress = process.env.USDC_CONTRACT_ADDRESS.split('#')[0].trim();

    const tokens = {
        USDT: usdtAddress,
        USDC: usdcAddress
    };

    console.log("\n🔍 Token Addresses to Setup:");
    Object.entries(tokens).forEach(([symbol, address]) => {
        console.log(`${symbol}: ${address}`);
    });

    // Get deployer info
    const [deployer] = await hre.ethers.getSigners();
    console.log(`\n👤 Deployer: ${deployer.address}`);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} AMOY\n`);

    console.log("🔄 Setting up supported tokens...\n");
    
    for (const [symbol, tokenAddress] of Object.entries(tokens)) {
        console.log(`Processing ${symbol}...`);
        
        // Check if token is already supported
        const isSupported = await contract.supportedTokens(tokenAddress);
        if (isSupported) {
            console.log(`✅ ${symbol} is already supported\n`);
            continue;
        }

        try {
            console.log(`Adding ${symbol}: ${tokenAddress}`);
            const tx = await contract.addSupportedToken(tokenAddress, {
                gasLimit: await gasManager.estimateGasWithMargin(contract, 'addSupportedToken', [tokenAddress])
            });
            
            console.log(`📝 Transaction Hash: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ ${symbol} added successfully`);
            console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}\n`);

            // Verify the token was actually added
            const verifySupported = await contract.supportedTokens(tokenAddress);
            if (!verifySupported) {
                throw new Error(`Verification failed for ${symbol}`);
            }

        } catch (error) {
            console.error(`❌ Error adding ${symbol}: ${error.message}\n`);
            throw error;
        }
    }

    // Final verification
    console.log("🔍 Final Verification:");
    for (const [symbol, tokenAddress] of Object.entries(tokens)) {
        const isSupported = await contract.supportedTokens(tokenAddress);
        console.log(`${symbol}: ${isSupported ? '✅ Supported' : '❌ Not Supported'}`);
    }

    console.log("\n✨ Token setup completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("\n❌ Setup failed:", error);
        process.exit(1);
    });