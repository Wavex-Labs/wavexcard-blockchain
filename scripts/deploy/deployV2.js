const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Libraries first
  console.log("\nDeploying WaveXLib...");
  const WaveXLib = await ethers.getContractFactory("WaveXLib");
  const waveXLib = await WaveXLib.deploy();
  await waveXLib.deployed();
  console.log("WaveXLib deployed to:", waveXLib.address);

  // Link library to main contract
  const WaveXNFTV2 = await ethers.getContractFactory("v2/WaveXNFTV2", {
    libraries: {
      WaveXLib: waveXLib.address,
    },
  });

  // Deploy main contract
  console.log("\nDeploying WaveXNFTV2...");
  const waveXNFTV2 = await WaveXNFTV2.deploy();
  await waveXNFTV2.deployed();
  console.log("WaveXNFTV2 deployed to:", waveXNFTV2.address);

  // Initialize configuration
  console.log("\nInitializing contract configuration...");

  // Add supported tokens
  const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;
  console.log("\nAdding USDT support...");
  await waveXNFTV2.addSupportedToken(usdtAddress);

  // Initialize default templates with USDT values (6 decimals)
  console.log("\nInitializing default templates...");
  await waveXNFTV2.initializeDefaultTemplates();

  // Add validators and merchants
  console.log("\nAuthorizing merchants and validators...");
  const addresses = [
    process.env.MERCHANT_ADDRESS,
    process.env.CASHIER1_ADDRESS
  ];
  
  for (const address of addresses) {
    await waveXNFTV2.authorizeMerchant(address);
    console.log(`Authorized merchant: ${address}`);
  }

  // Save deployment information
  const deploymentInfo = {
    network: hre.network.name,
    waveXLib: waveXLib.address,
    waveXNFTV2: waveXNFTV2.address,
    usdt: usdtAddress,
    merchants: addresses,
    deploymentDate: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, `../deployments/${hre.network.name}_deployment.json`);
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\nDeployment information saved to ${deploymentPath}`);

  // Verify contracts on Etherscan/Polygonscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nVerifying contracts on explorer...");
    
    try {
      // Verify library
      await hre.run("verify:verify", {
        address: waveXLib.address,
        constructorArguments: []
      });
      console.log("WaveXLib verified successfully");

      // Verify main contract
      await hre.run("verify:verify", {
        address: waveXNFTV2.address,
        constructorArguments: [],
        contract: "contracts/v2/WaveXNFTV2.sol:WaveXNFTV2"
      });
      console.log("WaveXNFTV2 verified successfully");
    } catch (error) {
      console.error("Verification error:", error);
    }
  }

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });