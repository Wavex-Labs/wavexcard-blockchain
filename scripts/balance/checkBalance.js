// npx hardhat run scripts/balance/checkBalance.js --network polygonAmoy
require('dotenv').config();
const hre = require("hardhat");

// Environment variable validation
function validateEnvVariables() {
    const required = [
        'WAVEX_NFT_V2_ADDRESS',
        'NETWORK_RPC_URL',
        'DEFAULT_BATCH_SIZE',
        'TRANSACTION_HISTORY_LIMIT'
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
async function main() {
    try {
        const tokenId = process.env.CHECK_BALANCE_TOKEN_ID;
        if (!tokenId) {
            throw new Error("TOKEN_ID environment variable is required");
        }

        const options = {
            includeHistory: true,
            includeEvents: true
        };

        const result = await checkBalance(tokenId, options);
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

// Execute the script
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
/**
 * Checks the balance of a specific token
 * @param {string|number} tokenId Token ID to check
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Balance information
 */
async function checkBalance(tokenId, options = {}) {
    try {
        // Validate environment variables
        validateEnvVariables();

        if (!tokenId) {
            throw new Error("Token ID is required");
        }

        // Get contract instance using environment variables
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get token balance
        const balance = await wavexNFT.tokenBalance(tokenId);
        const owner = await wavexNFT.ownerOf(tokenId);

        // Get transaction history if requested
        let transactions = [];
        if (options.includeHistory) {
            const txCount = await wavexNFT.getTransactionCount(tokenId);
            // Convert BigInt to Number safely
            const txCountNumber = Number(txCount);
            const historyLimit = parseInt(process.env.TRANSACTION_HISTORY_LIMIT || '100');
            
            // Limit the number of transactions to process
            const processCount = Math.min(txCountNumber, historyLimit);
            
            for (let i = 0; i < processCount; i++) {
                const tx = await wavexNFT.getTransaction(tokenId, i);
                transactions.push({
                    timestamp: new Date(Number(tx.timestamp) * 1000).toISOString(),
                    merchant: tx.merchant,
                    amount: hre.ethers.formatEther(tx.amount),
                    type: tx.transactionType,
                    metadata: tx.metadata
                });
            }
        }

        // Get token events if requested
        let events = [];
        if (options.includeEvents) {
            const tokenEvents = await wavexNFT.getTokenEvents(tokenId);
            events = tokenEvents.map(e => e.toString());
        }

        // Format response
        const response = {
            tokenId: tokenId.toString(),
            owner,
            balance: hre.ethers.formatEther(balance),
            balanceWei: balance.toString(),
            lastChecked: new Date().toISOString(),
            network: process.env.NETWORK_NAME || 'unknown'
        };

        if (options.includeHistory) {
            response.transactions = transactions;

            // Calculate statistics
            const stats = transactions.reduce((acc, tx) => {
                const amount = parseFloat(tx.amount);
                if (tx.type === 'TOPUP') {
                    acc.totalTopUps += amount;
                    acc.topUpCount++;
                } else if (tx.type === 'PAYMENT') {
                    acc.totalSpent += amount;
                    acc.paymentCount++;
                }
                return acc;
            }, {
                totalTopUps: 0,
                totalSpent: 0,
                topUpCount: 0,
                paymentCount: 0
            });
            response.statistics = stats;
        }

        if (options.includeEvents) {
            response.events = events;
        }

        return response;

    } catch (error) {
        if (error.message.includes("ERC721: invalid token ID")) {
            throw new Error(`Token ${tokenId} does not exist`);
        }
        console.error("Error checking balance:", error);
        throw error;
    }
}

/**
 * Batch checks balances for multiple tokens
 * @param {Array<string|number>} tokenIds Array of token IDs
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Batch balance information
 */
async function batchCheckBalance(tokenIds, options = {}) {
    try {
        // Validate environment variables
        validateEnvVariables();

        if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
            throw new Error("At least one token ID is required");
        }

        // Use batch size from environment or default
        const batchSize = parseInt(process.env.DEFAULT_BATCH_SIZE || '50');
        const chunks = [];

        // Split tokenIds into chunks of batchSize
        for (let i = 0; i < tokenIds.length; i += batchSize) {
            chunks.push(tokenIds.slice(i, i + batchSize));
        }

        const allResults = [];
        for (const chunk of chunks) {
            const chunkResults = await Promise.allSettled(
                chunk.map(tokenId =>
                    checkBalance(tokenId, options)
                        .then(result => ({
                            tokenId,
                            success: true,
                            details: result
                        }))
                        .catch(error => ({
                            tokenId,
                            success: false,
                            error: error.message
                        }))
                )
            );
            allResults.push(...chunkResults.map(r => r.value));
        }

        const successfulChecks = allResults.filter(r => r.success);
        const totalBalance = successfulChecks.reduce(
            (sum, r) => sum + parseFloat(r.details.balance),
            0
        );

        return {
            totalTokens: tokenIds.length,
            successfulChecks: successfulChecks.length,
            failedChecks: allResults.length - successfulChecks.length,
            totalBalance: totalBalance.toString(),
            averageBalance: (totalBalance / successfulChecks.length).toString(),
            batchSize,
            network: process.env.NETWORK_NAME || 'unknown',
            timestamp: new Date().toISOString(),
            results: allResults
        };

    } catch (error) {
        console.error("Error in batch balance check:", error);
        throw error;
    }
}

module.exports = {
    checkBalance,
    batchCheckBalance
};