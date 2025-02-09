const { ethers } = require("hardhat");
const { getNetworkConfig } = require("../../config/contract.config");
const fs = require("fs");
const path = require("path");

async function getDeployedContract(networkName) {
  const deploymentPath = path.join(
    __dirname,
    `../../deployments/${networkName}_deployment.json`
  );
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`No deployment found for network ${networkName}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const WaveXNFTV2 = await ethers.getContractFactory("WaveXNFTV2");
  return WaveXNFTV2.attach(deployment.address);
}

async function verifyTokenContract(tokenAddress) {
  const code = await ethers.provider.getCode(tokenAddress);
  if (code === "0x") {
    throw new Error(`No contract found at address ${tokenAddress}`);
  }
  return true;
}

async function main() {
  console.log("Starting token setup...");

  try {
    // Get the network
    const network = await ethers.provider.getNetwork();
    console.log(`Setting up tokens on network: ${network.name}`);

    // Get network configuration
    const networkConfig = getNetworkConfig(network.name);
    console.log("Network configuration loaded");

    // Get the deployed contract
    const wavexNFT = await getDeployedContract(network.name);
    console.log("Contract loaded at:", await wavexNFT.getAddress());

    // Setup tokens
    const tokens = {
      USDT: networkConfig.usdt,
      USDC: networkConfig.usdc
    };

    const tokenStatus = {};

    for (const [symbol, address] of Object.entries(tokens)) {
      if (!address) {
        console.log(`Skipping ${symbol} setup - address not configured`);
        continue;
      }

      try {
        // Verify token contract exists
        console.log(`Verifying ${symbol} contract at ${address}`);
        await verifyTokenContract(address);

        // Check if token is already supported
        const isSupported = await wavexNFT.supportedTokens(address);
        
        if (!isSupported) {
          console.log(`Adding support for ${symbol} at ${address}`);
          const tx = await wavexNFT.addSupportedToken(address);
          await tx.wait();
          console.log(`${symbol} support added successfully`);
        } else {
          console.log(`${symbol} is already supported`);
        }

        tokenStatus[symbol] = {
          address,
          supported: true,
          lastUpdated: new Date().toISOString()
        };

      } catch (error) {
        console.error(`Failed to setup ${symbol}:`, error.message);
        tokenStatus[symbol] = {
          address,
          supported: false,
          error: error.message,
          lastUpdated: new Date().toISOString()
        };
      }
    }

    // Save token setup status
    const tokenStatusPath = path.join(
      __dirname,
      `../../deployments/${network.name}_tokens.json`
    );
    
    fs.writeFileSync(
      tokenStatusPath,
      JSON.stringify(tokenStatus, null, 2)
    );
    
    console.log(`Token status saved to ${tokenStatusPath}`);
    console.log("Token setup completed!");

    return tokenStatus;

  } catch (error) {
    console.error("Token setup failed:", error);
    process.exit(1);
  }
}

// Execute setup
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;