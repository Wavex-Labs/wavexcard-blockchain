const { ethers, upgrades, network } = require("hardhat");
const { config, getNetworkConfig } = require("../../config/contract.config");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment process...");
  
  // Get network specific configuration
  const networkConfig = getNetworkConfig(network.name);
  console.log(`Deploying to network: ${network.name}`);

  try {
    // Get the signer
    const [deployer] = await ethers.getSigners();
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`Deploying with account: ${deployer.address}`);
    console.log(`Account balance: ${ethers.formatEther(balance)} AMOY`);

    // Get the contract factory
    const WaveXNFTV2 = await ethers.getContractFactory("WaveXNFTV2");
    console.log("Contract factory created");

    // Deploy without gas estimation first
    console.log("Deploying WaveXNFTV2...");
    const wavexNFT = await WaveXNFTV2.deploy({
        gasPrice: ethers.parseUnits("100", "gwei"), // Set fixed low gas price for Amoy
        gasLimit: 5000000 // Set reasonable gas limit for deployment
    });

    console.log("Waiting for deployment transaction...");
    await wavexNFT.waitForDeployment();
    
    const deployedAddress = await wavexNFT.getAddress();
    console.log("WaveXNFTV2 deployed to:", deployedAddress);

    // Initialize default templates with fixed gas settings
    console.log("Initializing default templates...");
    const initTx = await wavexNFT.initializeDefaultTemplates({
        gasPrice: ethers.parseUnits("100", "gwei"),
        gasLimit: 3000000
    });
    await initTx.wait();
    console.log("Default templates initialized");

    // Add supported tokens with fixed gas settings
    console.log("Adding supported tokens...");
    if (networkConfig.usdt) {
        const addUSDTTx = await wavexNFT.addSupportedToken(networkConfig.usdt, {
            gasPrice: ethers.parseUnits("100", "gwei"),
            gasLimit: 2000000
        });
        await addUSDTTx.wait();
        console.log("USDT token added:", networkConfig.usdt);
    }
    
    if (networkConfig.usdc) {
        const addUSDCTx = await wavexNFT.addSupportedToken(networkConfig.usdc, {
            gasPrice: ethers.parseUnits("100", "gwei"),
            gasLimit: 2000000
        });
        await addUSDCTx.wait();
        console.log("USDC token added:", networkConfig.usdc);
    }

    // Save deployment information
    const deploymentInfo = {
        network: network.name,
        address: deployedAddress,
        timestamp: new Date().toISOString(),
        deployerAddress: deployer.address,
        supportedTokens: {
            USDT: networkConfig.usdt || "",
            USDC: networkConfig.usdc || ""
        }
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "../../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment info to file
    const deploymentPath = path.join(
        deploymentsDir,
        `${network.name}_deployment.json`
    );
    fs.writeFileSync(
        deploymentPath,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`Deployment information saved to ${deploymentPath}`);

    // Verify contract if on testnet or mainnet
    if (network.name !== "hardhat" && network.name !== "localhost") {
        const confirmations = networkConfig.confirmations || 2; // Reduced confirmations for testnet
        console.log(`Waiting for ${confirmations} confirmations...`);
        
        if (wavexNFT.deploymentTransaction()) {
            await wavexNFT.deploymentTransaction().wait(confirmations);
        }
        
        console.log("Verifying contract...");
        try {
            await hre.run("verify:verify", {
                address: deployedAddress,
                constructorArguments: []
            });
            console.log("Contract verified successfully");
        } catch (error) {
            console.warn("Contract verification failed:", error.message);
            console.log("You can try verifying manually later using:");
            console.log(`npx hardhat verify --network ${network.name} ${deployedAddress}`);
        }
    }

    console.log("\nDeployment Summary:");
    console.log("===================");
    console.log(`Network: ${network.name}`);
    console.log(`Contract Address: ${deployedAddress}`);
    console.log(`USDT Support: ${networkConfig.usdt || 'Not Added'}`);
    console.log(`USDC Support: ${networkConfig.usdc || 'Not Added'}`);
    console.log("===================");
    
    console.log("\nDeployment completed successfully! 🎉");
    return deploymentInfo;

  } catch (error) {
    console.error("\nDeployment failed! ❌");
    console.error("Error details:", error);
    if (error.message) console.error("Error message:", error.message);
    if (error.code) console.error("Error code:", error.code);
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;