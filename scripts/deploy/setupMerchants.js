// Terminal Command: npx hardhat run scripts/deploy/setupMerchants.js --network polygonAmoy
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
    `../../deployments/${networkName}_deployment.json`
  );
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`No deployment found for network ${networkName}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const WaveXNFTV2 = await ethers.getContractFactory("WaveXNFTV2");
  return WaveXNFTV2.attach(deployment.address);
}

async function main() {
  console.log("Starting merchant setup...");

  try {
    // Get the network
    const network = await ethers.provider.getNetwork();
    console.log(`Setting up merchants on network: ${network.name}`);

    // Get the deployed contract
    const wavexNFT = await getDeployedContract(network.name);
    console.log("Contract loaded at:", await wavexNFT.getAddress());

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
        const isAuthorized = await wavexNFT.authorizedMerchants(merchant.address);
        
        if (!isAuthorized) {
          console.log(`Authorizing merchant: ${merchant.address}`);
          const tx = await wavexNFT.authorizeMerchant(merchant.address, {
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit: 300000 // Safe gas limit for merchant authorization
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
        authorized: await wavexNFT.authorizedMerchants(merchant.address),
        lastUpdated: new Date().toISOString()
      }))
    );

    const merchantStatusPath = path.join(
      __dirname,
      `../../deployments/${network.name}_merchants.json`
    );
    
    fs.writeFileSync(
      merchantStatusPath,
      JSON.stringify(updatedMerchants, null, 2)
    );
    
    console.log(`Merchant status saved to ${merchantStatusPath}`);
    console.log("Merchant setup completed successfully!");

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