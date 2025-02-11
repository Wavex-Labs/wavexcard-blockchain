//   Terminal command: npx hardhat run scripts\balance\topUpBalance.js --network polygonAmoy
require('dotenv').config();
const hre = require("hardhat");
const { checkBalance } = require('./checkBalance');

/**
 * Validates environment variables
 * @throws {Error} If required variables are missing
 */
function validateEnvVariables() {
    const required = [
        'WAVEX_NFT_V2_ADDRESS',
        'USDT_CONTRACT_ADDRESS',
        'USDC_CONTRACT_ADDRESS',
        'GAS_LIMIT',
        'TOPUP_TOKEN_ID',           // Token ID to top up
        'TOPUP_AMOUNT',            // Amount in USD
        'TOPUP_PAYMENT_TOKEN',     // Payment token to use (USDT or USDC address)
        'MIN_TOPUP_AMOUNT',        // Minimum top-up amount in USD
        'MAX_TOPUP_AMOUNT'         // Maximum top-up amount in USD
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

/**
 * Validates top-up amount
 * @param {string} amount Amount to validate in USD
 * @returns {boolean}
 */
function validateTopUpAmount(amount) {
    const value = parseFloat(amount);
    const min = parseFloat(process.env.MIN_TOPUP_AMOUNT);
    const max = parseFloat(process.env.MAX_TOPUP_AMOUNT);

    if (isNaN(value) || value < min || value > max) {
        throw new Error(`Amount must be between $${min} and $${max} USD`);
    }
    return true;
}
// Main execution
async function main() {
    try {
        const result = await topUpBalance();
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
 * Tops up a token's balance using environment variables
 * @returns {Promise<Object>} Top-up result
 */
async function topUpBalance() {
    try {
        validateEnvVariables();

        const params = {
            tokenId: process.env.TOPUP_TOKEN_ID,
            amount: process.env.TOPUP_AMOUNT,
            paymentToken: process.env.TOPUP_PAYMENT_TOKEN
        };

        validateTopUpAmount(params.amount);

        // Get contract instances
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const ERC20 = await hre.ethers.getContractFactory("ERC20");
        
        const wavexNFT = WaveXNFT.attach(process.env.WAVEX_NFT_V2_ADDRESS);
        const token = ERC20.attach(params.paymentToken);

        // Validate payment token
        const supportedTokens = {
            USDT: process.env.USDT_CONTRACT_ADDRESS,
            USDC: process.env.USDC_CONTRACT_ADDRESS
        };

        if (!Object.values(supportedTokens).includes(params.paymentToken)) {
            throw new Error(`Unsupported payment token. Must be one of: ${Object.keys(supportedTokens).join(', ')}`);
        }

        // Check if token is supported by contract
        const isSupported = await wavexNFT.supportedTokens(params.paymentToken);
        if (!isSupported) {
            throw new Error(`Token ${params.paymentToken} is not supported by the contract`);
        }

        // Get initial balance
        const initialBalance = await checkBalance(params.tokenId);

        // Handle token approval
        const signer = wavexNFT.signer;
        const signerAddress = await signer.getAddress();
        const amount = params.amount; // Amount in USD (USDT/USDC have 6 decimals)
        
        const allowance = await token.allowance(signerAddress, process.env.WAVEX_NFT_V2_ADDRESS);
        if (allowance < amount) {
            const approveTx = await token.approve(process.env.WAVEX_NFT_V2_ADDRESS, amount);
            await approveTx.wait();
        }

        // Execute top-up transaction
        const tx = await wavexNFT.topUpBalance(
            params.tokenId,
            amount,
            params.paymentToken,
            {
                gasLimit: process.env.GAS_LIMIT,
                gasPrice: process.env.GAS_PRICE
            }
        );

        const receipt = await tx.wait();

        // Get updated balance
        const updatedBalance = await checkBalance(params.tokenId);

        // Parse BalanceUpdated event
        const balanceUpdatedLog = receipt.logs.find(
            log => log.topics[0] === wavexNFT.interface.getEventTopic('BalanceUpdated')
        );

        let eventData = {};
        if (balanceUpdatedLog) {
            const parsedLog = wavexNFT.interface.parseLog(balanceUpdatedLog);
            eventData = {
                tokenId: parsedLog.args.tokenId.toString(),
                newBalance: parsedLog.args.newBalance.toString(),
                updateType: parsedLog.args.updateType
            };
        }

        return {
            tokenId: params.tokenId,
            amount: params.amount,
            paymentToken: params.paymentToken,
            initialBalance: initialBalance.balance,
            newBalance: updatedBalance.balance,
            transactionHash: receipt.transactionHash,
            network: process.env.NETWORK_NAME,
            timestamp: new Date().toISOString(),
            event: eventData
        };

    } catch (error) {
        console.error("Error topping up balance:", error);
        throw error;
    }
}

module.exports = {
    topUpBalance
};