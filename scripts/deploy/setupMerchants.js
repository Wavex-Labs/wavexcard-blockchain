// Terminal Command: npx hardhat run scripts/deploy/setupMerchants.js --network polygonAmoy
const { gasManager } = require('../utils/gasUtils');
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function loadMerchants() {
  const merchantsPath = path.join(__dirname, "../../merchants.json");
  if (!fs.existsSync(merchantsPath)) {
    throw new Error("merchants.json not found. Please create it with merchant addresses.");
  }
  return JSON.parse(fs.readFileSync(merchantsPath, "utf8"));
}

async function getDeployedContract(networkName) {
  const deploymentPath = path.join(
    __dirname,
    `../../deployments/${networkName}_deploymentV3.json` // Updated deployment file path for V3
  );

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`No deployment found for network ${networkName}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const WaveXNFTV3 = await ethers.getContractFactory("WaveXNFTV3"); // Updated contract factory to WaveXNFTV3
  return WaveXNFTV3.attach(deployment.WaveXNFTV3);
}

async function main() {
  console.log("Starting merchant setup for V3 contract..."); // Updated log message

  try {
    // Get the network
    const network = await ethers.provider.getNetwork();
    console.log(`Setting up merchants on network: ${network.name}`);

    // Get the deployed contract
    const wavexNFTV3 = await getDeployedContract(network.name); // Updated contract variable name to wavexNFTV3
    console.log("V3 Contract loaded at:", await wavexNFTV3.getAddress()); // Updated log message

    // Get gas price settings
    const feeData = await ethers.provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice;
    const maxPriorityFeePerGas = ethers.parseUnits("31.5", "gwei"); // Increased for Polygon Amoy

    // Load merchants from configuration
    const merchants = await loadMerchants();
    console.log(`Found ${merchants.length} merchants to authorize`);

    // Process each merchant
    for (const merchant of merchants) {
      try {
        // Check if merchant is already authorized
        const isAuthorized = await wavexNFTV3.authorizedMerchants(merchant.address); // Updated contract variable name

        if (!isAuthorized) {
          console.log(`Authorizing merchant: ${merchant.address}`);
          const tx = await wavexNFTV3.authorizeMerchant(merchant.address, { // Updated contract variable name
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit: await gasManager.estimateGasWithMargin(wavexNFTV3, 'authorizeMerchant', [merchant.address]) // Updated contract variable name
          });
          await tx.wait();
          console.log(`Merchant ${merchant.address} authorized successfully`);
        } else {
          console.log(`Merchant ${merchant.address} is already authorized`);
        }

      } catch (error) {
        console.error(`Failed to authorize merchant ${merchant.address}:`, error.message);
        // Continue with next merchant
        continue;
      }
    }

    // Save updated merchant status
    const updatedMerchants = await Promise.all(
      merchants.map(async (merchant) => ({
        ...merchant,
        authorized: await wavexNFTV3.authorizedMerchants(merchant.address), // Updated contract variable name
        lastUpdated: new Date().toISOString()
      }))
    );

    const merchantStatusPath = path.join(
      __dirname,
      `../../deployments/${network.name}_merchantsV3.json` // Updated merchant status file name for V3
    );

    fs.writeFileSync(
      merchantStatusPath,
      JSON.stringify(updatedMerchants, null, 2)
    );

    console.log(`Merchant status saved to ${merchantStatusPath}`);
    console.log("Merchant setup for V3 contract completed successfully!"); // Updated log message

  } catch (error) {
    console.error("Merchant setup failed:", error);
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