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
    // Get the contract factory
    const WaveXNFTV2 = await ethers.getContractFactory("WaveXNFTV2");
    console.log("Contract factory created");

    // Deploy the contract
    console.log("Deploying WaveXNFTV2...");
    const wavexNFT = await WaveXNFTV2.deploy();
    await wavexNFT.waitForDeployment();
    
    const deployedAddress = await wavexNFT.getAddress();
    console.log("WaveXNFTV2 deployed to:", deployedAddress);

    // Initialize default templates
    console.log("Initializing default templates...");
    const initTx = await wavexNFT.initializeDefaultTemplates();
    await initTx.wait();
    console.log("Default templates initialized");

    // Add supported tokens
    console.log("Adding supported tokens...");
    if (networkConfig.usdt) {
      const addUSDTTx = await wavexNFT.addSupportedToken(networkConfig.usdt);
      await addUSDTTx.wait();
      console.log("USDT token added:", networkConfig.usdt);
    }
    
    if (networkConfig.usdc) {
      const addUSDCTx = await wavexNFT.addSupportedToken(networkConfig.usdc);
      await addUSDCTx.wait();
      console.log("USDC token added:", networkConfig.usdc);
    }

    // Save deployment information
    const deploymentInfo = {
      network: network.name,
      address: deployedAddress,
      timestamp: new Date().toISOString(),
      supportedTokens: {
        USDT: networkConfig.usdt || "",
        USDC: networkConfig.usdc || ""
      }
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "../../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
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
      console.log("Waiting for block confirmations before verification...");
      await wavexNFT.deployTransaction.wait(networkConfig.confirmations);
      
      console.log("Verifying contract...");
      await hre.run("verify:verify", {
        address: deployedAddress,
        constructorArguments: []
      });
      console.log("Contract verified");
    }

    console.log("Deployment completed successfully!");
    return deploymentInfo;

  } catch (error) {
    console.error("Deployment failed:", error);
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