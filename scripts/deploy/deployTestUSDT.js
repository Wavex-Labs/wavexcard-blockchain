require('dotenv').config();
const hre = require("hardhat");

async function main() {
    try {
        // Get deployer account
        const [deployer] = await hre.ethers.getSigners();
        console.log("Deploying TestUSDT with account:", deployer.address);
        console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

        // Get gas price data
        const feeData = await deployer.provider.getFeeData();
        const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice;
        const maxPriorityFeePerGas = hre.ethers.parseUnits("31.5", "gwei"); // Increased priority fee

        console.log("Gas Settings:");
        console.log("Max Fee Per Gas:", maxFeePerGas.toString());
        console.log("Max Priority Fee Per Gas:", maxPriorityFeePerGas.toString());

        // Deploy TestUSDT with custom gas settings
        const TestUSDT = await hre.ethers.getContractFactory("TestUSDT");
        const testUSDT = await TestUSDT.deploy({
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit: 5000000 // Explicit gas limit
        });
        
        console.log("Deploying...");
        await testUSDT.waitForDeployment();
        const testUsdtAddress = await testUSDT.getAddress();

        console.log("TestUSDT deployed to:", testUsdtAddress);

        // Mint initial supply with proper gas settings
        const mintAmount = hre.ethers.parseUnits("1000000", 6); // 1 million USDT
        console.log("Minting tokens...");
        const mintTx = await testUSDT.mint(deployer.address, mintAmount, {
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit: 200000
        });
        await mintTx.wait();

        console.log("Minted", hre.ethers.formatUnits(mintAmount, 6), "USDT to", deployer.address);

        // Add token as supported token in WaveXNFT contract
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(process.env.WAVEX_NFT_V2_ADDRESS);
        
        console.log("Adding USDT as supported token...");
        const addTokenTx = await wavexNFT.addSupportedToken(testUsdtAddress, {
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit: 200000
        });
        await addTokenTx.wait();
        
        console.log("TestUSDT added as supported token");

        // Save new token address to .env
        console.log("\nAdd this to your .env file:");
        console.log(`USDT_CONTRACT_ADDRESS=${testUsdtAddress}`);

    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });