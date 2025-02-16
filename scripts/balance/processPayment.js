// scripts/balance/processPayment.js
const ethers = require('ethers');
const { gasManager } = require('../utils/gasUtils');
const hre = require("hardhat");

async function processPayment(params) {
    try {
        // Connect to the network
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        console.log("Connected wallet:", wallet.address);

        // Get contract instance
        const contractABI = [
            "function tokenBalance(uint256 tokenId) view returns (uint256)",
            "function authorizedMerchants(address merchant) view returns (bool)",
            "function processPayment(uint256 tokenId, uint256 amount, string memory metadata) returns (bool)"
        ];
        const contract = new ethers.Contract(process.env.WAVEX_NFT_V2_ADDRESS, contractABI, wallet);

        // Get current balance
        console.log("Getting token balance...");
        const tokenBalance = await contract.tokenBalance(params.tokenId);
        console.log(`Current balance (raw): ${tokenBalance.toString()}`);
        const formattedBalance = ethers.formatUnits(tokenBalance, 6);
        console.log(`Current balance: ${formattedBalance} USDT`);

        // Convert payment amount to wei
        const paymentAmount = ethers.parseUnits(params.amount.toString(), 6);
        console.log(`Payment amount: ${params.amount} USDT (${paymentAmount.toString()} wei)`);

        // Check balance
        if (tokenBalance < paymentAmount) {
            throw new Error(`Insufficient balance. Required: ${params.amount} USDT, Available: ${formattedBalance} USDT`);
        }

        // Check merchant authorization
        const isAuthorized = await contract.authorizedMerchants(wallet.address);
        console.log("Merchant authorization:", isAuthorized);
        if (!isAuthorized) {
            throw new Error("Wallet is not an authorized merchant");
        }

        const gasConfig = await gasManager.getGasConfig();

        // Process payment
        console.log(`Processing payment of ${params.amount} USDT from token ${params.tokenId}...`);

        const gasLimit = await gasManager.estimateGasWithMargin(contract, 'processPayment', [params.tokenId, paymentAmount, params.metadata || ""]);

        console.log(`Estimated gas limit: ${gasLimit.toString()}`);

        const tx = await contract.processPayment(
            params.tokenId,
            paymentAmount,
            params.metadata || "",
            {
                ...gasConfig,
                gasLimit
            }
        );

        console.log(`Transaction submitted: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

        // Get updated balance
        const updatedBalance = await contract.tokenBalance(params.tokenId);
        const formattedUpdatedBalance = ethers.formatUnits(updatedBalance, 6);

        // Prepare transaction details
        const txDetails = {
            success: true,
            tokenId: params.tokenId,
            amount: params.amount,
            merchant: wallet.address,
            metadata: params.metadata,
            initialBalance: formattedBalance,
            newBalance: formattedUpdatedBalance,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            timestamp: new Date().toISOString()
        };

        // Add gas information if available
        if (receipt.gasUsed) {
            txDetails.gasUsed = receipt.gasUsed.toString();
        }
        if (receipt.effectiveGasPrice) {
            txDetails.effectiveGasPrice = receipt.effectiveGasPrice.toString();
        }

        return txDetails;

    } catch (error) {
        console.error("Error processing payment:", error);
        return {
            success: false,
            error: error.message,
            details: error.stack
        };
    }
}

async function main() {
    try {
        const payment = {
            tokenId: process.env.PROCESS_PAYMENT_TOKEN_ID || "1",
            amount: process.env.PROCESS_PAYMENT_AMOUNT || "100",
            metadata: process.env.PROCESS_PAYMENT_METADATA || "Test payment"
        };
        
        console.log("Starting payment process with parameters:", payment);
        const result = await processPayment(payment);
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    processPayment
};