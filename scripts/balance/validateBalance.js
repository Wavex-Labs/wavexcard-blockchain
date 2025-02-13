require('dotenv').config();
const hre = require("hardhat");
const { checkBalance } = require('./checkBalance');

function validateEnvVariables() {
    const required = [
        'WAVEX_NFT_V2_ADDRESS',
        'USDT_CONTRACT_ADDRESS',
        'USDC_CONTRACT_ADDRESS',
        'VALIDATE_TOKEN_ID',
        'VALIDATE_REQUIRED_AMOUNT',
        'VALIDATE_OPERATION_TYPE',
        'VALIDATE_INCLUDE_HISTORY',
        'VALIDATE_INCLUDE_EVENTS',
        'TRANSACTION_HISTORY_LIMIT'
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

async function getTokenBalances(ownerAddress, provider) {
    const IERC20_ABI = [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];
    
    const balances = {};
    
    // Check USDT balance
    const usdtContract = new hre.ethers.Contract(
        process.env.USDT_CONTRACT_ADDRESS,
        IERC20_ABI,
        provider
    );
    const usdtDecimals = await usdtContract.decimals();
    const usdtBalance = await usdtContract.balanceOf(ownerAddress);
    balances.usdt = hre.ethers.formatUnits(usdtBalance, usdtDecimals);

    // Check USDC balance
    const usdcContract = new hre.ethers.Contract(
        process.env.USDC_CONTRACT_ADDRESS,
        IERC20_ABI,
        provider
    );
    const usdcDecimals = await usdcContract.decimals();
    const usdcBalance = await usdcContract.balanceOf(ownerAddress);
    balances.usdc = hre.ethers.formatUnits(usdcBalance, usdcDecimals);

    return balances;
}

async function validateBalance(params = {}, options = {}) {
    try {
        validateEnvVariables();

        const validationParams = {
            tokenId: params.tokenId || process.env.VALIDATE_TOKEN_ID,
            requiredAmount: params.requiredAmount || process.env.VALIDATE_REQUIRED_AMOUNT,
            operation: params.operation || process.env.VALIDATE_OPERATION_TYPE
        };

        const validationOptions = {
            includeHistory: options.includeHistory || process.env.VALIDATE_INCLUDE_HISTORY === 'true',
            includeEvents: options.includeEvents || process.env.VALIDATE_INCLUDE_EVENTS === 'true',
            eventId: options.eventId || process.env.VALIDATE_EVENT_ID
        };

        const wavexNFT = await hre.ethers.getContractFactory("WaveXNFTV2")
            .then(factory => factory.attach(process.env.WAVEX_NFT_V2_ADDRESS));

        const balanceInfo = await checkBalance(validationParams.tokenId, validationOptions);
        const tokenBalances = await getTokenBalances(balanceInfo.owner, hre.ethers.provider);

        const validationResult = {
            tokenId: validationParams.tokenId,
            balances: tokenBalances,
            timestamp: new Date().toISOString(),
            checks: {},
            valid: true,
            warnings: []
        };

        // Validate token existence
        validationResult.checks.exists = true;

        // Validate owner
        validationResult.checks.owner = {
            address: balanceInfo.owner,
            valid: true
        };

        // Check required amount
        if (validationParams.requiredAmount) {
            const required = parseFloat(validationParams.requiredAmount);
            const available = {
                usdt: parseFloat(tokenBalances.usdt),
                usdc: parseFloat(tokenBalances.usdc)
            };

            validationResult.checks.requiredAmount = {
                required: validationParams.requiredAmount,
                sufficient: available.usdt >= required || available.usdc >= required
            };

            if (!validationResult.checks.requiredAmount.sufficient) {
                validationResult.valid = false;
                validationResult.warnings.push(
                    `Insufficient balance. Required: ${validationParams.requiredAmount} USD, ` +
                    `Available: USDT ${tokenBalances.usdt}, USDC ${tokenBalances.usdc}`
                );
            }
        }

        // Operation validations
        if (validationParams.operation) {
            switch (validationParams.operation.toUpperCase()) {
                case 'PAYMENT':
                    const paused = await wavexNFT.paused();
                    validationResult.checks.payment = {
                        allowed: !paused,
                        contractPaused: paused
                    };
                    break;
                case 'EVENT':
                    if (balanceInfo.events) {
                        validationResult.checks.events = {
                            count: balanceInfo.events.length,
                            hasConflicts: false
                        };
                    }
                    break;
            }
        }

        // Transaction history analysis
        if (validationOptions.includeHistory && balanceInfo.transactions) {
            validationResult.analysis = analyzeTransactionHistory(balanceInfo.transactions);
        }

        return validationResult;

    } catch (error) {
        console.error("Error validating balance:", error);
        throw error;
    }
}

function analyzeTransactionHistory(transactions) {
    const analysis = {
        totalTransactions: transactions.length,
        topUps: 0,
        payments: 0,
        totalTopUpAmount: {
            usdt: 0,
            usdc: 0
        },
        totalSpentAmount: {
            usdt: 0,
            usdc: 0
        },
        lastTransaction: null
    };

    if (transactions.length === 0) return analysis;

    transactions.forEach(tx => {
        const amount = parseFloat(tx.amount || 0);
        // Safely handle token type checking
        const tokenType = tx.token ? tx.token.toString().toLowerCase() : 'unknown';

        if (tx.type === 'TOPUP') {
            analysis.topUps++;
            if (tokenType === process.env.USDT_CONTRACT_ADDRESS.toLowerCase()) {
                analysis.totalTopUpAmount.usdt += amount;
            } else if (tokenType === process.env.USDC_CONTRACT_ADDRESS.toLowerCase()) {
                analysis.totalTopUpAmount.usdc += amount;
            }
        } else if (tx.type === 'PAYMENT') {
            analysis.payments++;
            if (tokenType === process.env.USDT_CONTRACT_ADDRESS.toLowerCase()) {
                analysis.totalSpentAmount.usdt += amount;
            } else if (tokenType === process.env.USDC_CONTRACT_ADDRESS.toLowerCase()) {
                analysis.totalSpentAmount.usdc += amount;
            }
        }
    });

    // Get the last transaction if available
    if (transactions.length > 0) {
        const lastTx = transactions[transactions.length - 1];
        analysis.lastTransaction = {
            timestamp: lastTx.timestamp || new Date().toISOString(),
            merchant: lastTx.merchant || "0x0000000000000000000000000000000000000000",
            amount: lastTx.amount || "0",
            type: lastTx.type || "UNKNOWN",
            token: lastTx.token || "UNKNOWN",
            metadata: lastTx.metadata || ""
        };
    }

    return analysis;
}

async function batchValidateBalance(validations = [], options = {}) {
    try {
        const batchSize = parseInt(process.env.DEFAULT_BATCH_SIZE) || 1;
        validations = validations.length > 0 ? validations : [{
            tokenId: process.env.VALIDATE_TOKEN_ID,
            requiredAmount: process.env.VALIDATE_REQUIRED_AMOUNT,
            operation: process.env.VALIDATE_OPERATION_TYPE
        }];

        const results = await Promise.allSettled(
            validations.map(params =>
                validateBalance(params, options)
                    .then(result => ({
                        tokenId: params.tokenId,
                        success: true,
                        details: result
                    }))
                    .catch(error => ({
                        tokenId: params.tokenId,
                        success: false,
                        error: error.message
                    }))
            )
        );

        return {
            totalValidations: validations.length,
            successfulValidations: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
            timestamp: new Date().toISOString(),
            results: results.map(r => r.status === 'fulfilled' ? r.value : {
                tokenId: r.reason?.tokenId,
                success: false,
                error: r.reason?.message || 'Unknown error'
            })
        };
    } catch (error) {
        console.error("Error in batch validation:", error);
        throw error;
    }
}

async function main() {
    try {
        const result = await validateBalance();
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
    validateBalance,
    batchValidateBalance,
    analyzeTransactionHistory
};