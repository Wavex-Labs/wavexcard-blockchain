const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();
const {
  alchemy,
  wallet,
  deployContract,
  getGasPrice,
  getTransactionReceipt
} = require('../utils/alchemy_utils');

async function deployV2() {
    try {
        console.log("\n=== Starting WaveX NFT V2 deployment on Polygon Mumbai ===\n");

        // Get deployer account
        const deployerAddress = wallet.address;
        console.log("Deploying contracts with account:", deployerAddress);

        // Get balance
        const balance = await alchemy.core.getBalance(deployerAddress);
        console.log("Account balance:", ethers.utils.formatEther(balance), "MATIC");

        // Get gas price
        const gasPrice = await getGasPrice();
        const gasLimit = process.env.GAS_LIMIT || '5000000';

        const gasSettings = {
            gasPrice: gasPrice,
            gasLimit: gasLimit
        };

        // Deploy contract
        console.log('\nDeploying contract...');
        const wavexNFTV2 = await deployContract("WaveXNFTV2", [], gasSettings);
        console.log('Contract deployed to:', wavexNFTV2.address);

        // Initialize contract
        console.log('\nInitializing contract...');

        // Add supported tokens
        console.log('\nAdding supported tokens...');
        const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;
        const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;

        if (usdtAddress) {
            console.log('Adding USDT support...');
            const addUsdtTx = await wavexNFTV2.addSupportedToken(usdtAddress, gasSettings);
            await getTransactionReceipt(addUsdtTx.hash);
            console.log('USDT support added');
        }

        if (usdcAddress) {
            console.log('Adding USDC support...');
            const addUsdcTx = await wavexNFTV2.addSupportedToken(usdcAddress, gasSettings);
            await getTransactionReceipt(addUsdcTx.hash);
            console.log('USDC support added');
        }

        // Initialize default templates
        console.log('\nInitializing default templates...');
        const initTx = await wavexNFTV2.initializeDefaultTemplates(gasSettings);
        await getTransactionReceipt(initTx.hash);
        console.log('Default templates initialized');

        // Authorize merchant
        console.log('\nAuthorizing merchant...');
        const merchantAddress = process.env.MERCHANT_ADDRESS;
        if (merchantAddress) {
            const authTx = await wavexNFTV2.authorizeMerchant(merchantAddress, gasSettings);
            await getTransactionReceipt(authTx.hash);
            console.log('Merchant authorized:', merchantAddress);
        }

        // Save deployment info
        const deploymentInfo = {
            networkName: "mumbai",
            chainId: 80002,
            contractAddress: wavexNFTV2.address,
            deploymentTime: new Date().toISOString(),
            deployer: deployerAddress,
            supportedTokens: {
                USDT: usdtAddress || '',
                USDC: usdcAddress || ''
            },
            authorizedMerchants: [merchantAddress]
        };

        const deploymentsDir = path.join(__dirname, '../../deployments/v2');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const deploymentPath = path.join(
            deploymentsDir,
            `mumbai_deployment.json`
        );

        fs.writeFileSync(
            deploymentPath,
            JSON.stringify(deploymentInfo, null, 2)
        );

        // Update .env
        let envContent = fs.readFileSync('.env', 'utf8');
        envContent = envContent.replace(
            /WAVEX_NFT_V2_ADDRESS=.*/,
            `WAVEX_NFT_V2_ADDRESS=${wavexNFTV2.address}`
        );
        fs.writeFileSync('.env', envContent);

        console.log("\nDeployment completed successfully!");
        console.log("Configuration files updated");

        return deploymentInfo;

    } catch (error) {
        console.error("\nError during deployment:");
        console.error('- Message:', error.message);
        console.error('- Stack:', error.stack);
        if (error.code) console.error('- Code:', error.code);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.data) console.error('- Data:', error.data);
        throw error;
    }
}

// Export the deployV2 function
module.exports = { deployV2 };

// Run deployment if called directly
if (require.main === module) {
    deployV2()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
