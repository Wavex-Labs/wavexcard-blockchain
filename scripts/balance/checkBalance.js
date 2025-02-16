require('dotenv').config();
const { gasManager } = require('../utils/gasUtils');
const hre = require("hardhat");

function validateEnvVariables() {
    const required = [
        'WAVEX_NFT_V2_ADDRESS',
        'USDT_CONTRACT_ADDRESS',
        'USDC_CONTRACT_ADDRESS',
        'NETWORK_RPC_URL',
        'DEFAULT_BATCH_SIZE',
        'TRANSACTION_HISTORY_LIMIT'
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

async function getTokenBalance(tokenContract, address) {
    const decimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(address);
    return {
        raw: balance.toString(),
        formatted: hre.ethers.formatUnits(balance, decimals)
    };
}

async function checkBalance(tokenId, options = {}) {
    try {
        validateEnvVariables();
        if (!tokenId) {
            throw new Error("Token ID is required");
        }

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const gasConfig = await gasManager.getGasConfig();
        const wavexNFT = WaveXNFT.attach(process.env.WAVEX_NFT_V2_ADDRESS);
        const gasLimit = await gasManager.estimateGasWithMargin(wavexNFT, 'tokenBalance', [tokenId]);

        // Get token balance
        const balance = await wavexNFT.tokenBalance(tokenId, { ...gasConfig, gasLimit });
        const owner = await wavexNFT.ownerOf(tokenId, { ...gasConfig, gasLimit });

        // Create USDT and USDC contract instances
        const IERC20_ABI = [
            "function balanceOf(address) view returns (uint256)",
            "function decimals() view returns (uint8)"
        ];

        const usdtContract = new hre.ethers.Contract(
            process.env.USDT_CONTRACT_ADDRESS,
            IERC20_ABI,
            hre.ethers.provider
        );

        const usdcContract = new hre.ethers.Contract(
            process.env.USDC_CONTRACT_ADDRESS,
            IERC20_ABI,
            hre.ethers.provider
        );

        // Get transaction history if requested
        let transactions = [];
        if (options.includeHistory) {
            const txCount = await wavexNFT.getTransactionCount(tokenId, { ...gasConfig, gasLimit });
            const txCountNumber = Number(txCount);
            const historyLimit = parseInt(process.env.TRANSACTION_HISTORY_LIMIT || '100');
            const processCount = Math.min(txCountNumber, historyLimit);

            for (let i = 0; i < processCount; i++) {
                const tx = await wavexNFT.getTransaction(tokenId, i, { ...gasConfig, gasLimit });
                const tokenType = tx.token === process.env.USDT_CONTRACT_ADDRESS ? 'USDT' : 
                                tx.token === process.env.USDC_CONTRACT_ADDRESS ? 'USDC' : 'UNKNOWN';
                
                transactions.push({
                    timestamp: new Date(Number(tx.timestamp) * 1000).toISOString(),
                    merchant: tx.merchant,
                    amount: hre.ethers.formatUnits(tx.amount, 6), // Both USDT and USDC use 6 decimals
                    type: tx.transactionType,
                    token: tokenType,
                    metadata: tx.metadata
                });
            }
        }

        // Format response
        const response = {
            tokenId: tokenId.toString(),
            owner,
            balances: {
                card: hre.ethers.formatUnits(balance, 6),
                stablecoins: {
                    usdt: await getTokenBalance(usdtContract, owner),
                    usdc: await getTokenBalance(usdcContract, owner)
                }
            },
            lastChecked: new Date().toISOString(),
            network: process.env.NETWORK_NAME || 'unknown'
        };

        if (options.includeHistory) {
            response.transactions = transactions;
            
            // Calculate statistics per token type
            const stats = transactions.reduce((acc, tx) => {
                const amount = parseFloat(tx.amount);
                const tokenType = tx.token.toLowerCase();
                
                if (!acc[tokenType]) {
                    acc[tokenType] = {
                        totalTopUps: 0,
                        totalSpent: 0,
                        topUpCount: 0,
                        paymentCount: 0
                    };
                }

                if (tx.type === 'TOPUP') {
                    acc[tokenType].totalTopUps += amount;
                    acc[tokenType].topUpCount++;
                } else if (tx.type === 'PAYMENT') {
                    acc[tokenType].totalSpent += amount;
                    acc[tokenType].paymentCount++;
                }
                return acc;
            }, {});

            response.statistics = stats;
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

async function batchCheckBalance(tokenIds, options = {}) {
    try {
        validateEnvVariables();
        if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
            throw new Error("At least one token ID is required");
        }

        const batchSize = parseInt(process.env.DEFAULT_BATCH_SIZE || '50');
        const chunks = [];
        
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
        
        return {
            totalTokens: tokenIds.length,
            successfulChecks: successfulChecks.length,
            failedChecks: allResults.length - successfulChecks.length,
            network: process.env.NETWORK_NAME || 'unknown',
            timestamp: new Date().toISOString(),
            results: allResults
        };
    } catch (error) {
        console.error("Error in batch balance check:", error);
        throw error;
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

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    checkBalance,
    batchCheckBalance
};