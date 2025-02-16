// Terminal Command: npx hardhat run scripts/balance/topUpBalance.js --network polygonAmoy
require('dotenv').config();
const { gasManager } = require('../utils/gasUtils');
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
        'TOPUP_TOKEN_ID',
        'TOPUP_AMOUNT',
        'TOPUP_PAYMENT_TOKEN',
        'MIN_TOPUP_AMOUNT',
        'MAX_TOPUP_AMOUNT',
        'MERCHANT_ADDRESS'
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

/**
 * Tops up a token's balance and transfers funds to merchant wallet
 * @returns {Promise<Object>} Top-up result
 */
async function topUpBalance() {
    try {
        validateEnvVariables();
        console.log("Validating parameters...");
        
        const params = {
            tokenId: process.env.TOPUP_TOKEN_ID,
            amount: process.env.TOPUP_AMOUNT,
            paymentToken: process.env.TOPUP_PAYMENT_TOKEN,
            merchantWallet: process.env.MERCHANT_ADDRESS
        };
        
        validateTopUpAmount(params.amount);

        console.log("Getting contract instances and signer...");
        const [signer] = await hre.ethers.getSigners();
        const provider = signer.provider;

        // Verify merchant wallet
        if (!hre.ethers.isAddress(params.merchantWallet)) {
            throw new Error("Invalid merchant wallet address");
        }
        console.log("Merchant wallet:", params.merchantWallet);

        // Get WaveXNFT contract
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(process.env.WAVEX_NFT_V2_ADDRESS).connect(signer);

        // Verify contract addresses
        console.log("Verifying contract addresses...");
        console.log("WaveX NFT address:", process.env.WAVEX_NFT_V2_ADDRESS);
        console.log("Payment token address:", params.paymentToken);

        // Verify merchant authorization
        console.log("Verifying merchant authorization...");
        const isMerchantAuthorized = await wavexNFT.authorizedMerchants(params.merchantWallet);
        if (!isMerchantAuthorized) {
            throw new Error("Merchant wallet is not authorized");
        }
        console.log("Merchant wallet is authorized");

        // Try to get contract code to verify contract exists
        const code = await provider.getCode(params.paymentToken);
        if (code === "0x") {
            throw new Error(`No contract found at address ${params.paymentToken}`);
        }

        try {
            console.log("Checking token support...");
            const isSupported = await wavexNFT.supportedTokens(params.paymentToken);
            if (!isSupported) {
                throw new Error(`Token ${params.paymentToken} is not supported by the contract`);
            }
            console.log("Token is supported");

            // Create token contract instance
            const IERC20_ABI = [
                "function decimals() external view returns (uint8)",
                "function balanceOf(address account) external view returns (uint256)",
                "function approve(address spender, uint256 value) external returns (bool)",
                "function allowance(address owner, address spender) external view returns (uint256)",
                "function transfer(address to, uint256 value) external returns (bool)",
                "function transferFrom(address from, address to, uint256 value) external returns (bool)"
            ];
            const token = new hre.ethers.Contract(
                params.paymentToken,
                IERC20_ABI,
                signer
            );

            // Check decimals
            console.log("Checking token decimals...");
            let decimals;
            try {
                decimals = await token.decimals();
                console.log("Token decimals:", decimals);
            } catch (error) {
                console.log("Could not get decimals, defaulting to 6");
                decimals = 6;
            }

            // Handle amount conversion
            const amount = hre.ethers.parseUnits(params.amount, decimals);
            console.log(`Parsed amount: ${amount.toString()}`);

            // Check balance
            console.log("Checking token balance...");
            const balance = await token.balanceOf(signer.address);
            console.log(`Token balance: ${hre.ethers.formatUnits(balance, decimals)}`);
            
            if (balance < amount) {
                throw new Error(`Insufficient token balance. Required: ${params.amount}, Available: ${hre.ethers.formatUnits(balance, decimals)}`);
            }

            // Get gas price
            const feeData = await provider.getFeeData();
            const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice;
            const maxPriorityFeePerGas = hre.ethers.parseUnits("30", "gwei");

            // First approve the contract
            console.log("Approving token spend...");
            const approveTx = await token.approve(
                process.env.WAVEX_NFT_V2_ADDRESS,
                amount,
                {
                    maxFeePerGas,
                    maxPriorityFeePerGas,
                    gasLimit: await gasManager.estimateGasWithMargin(token, 'approve', [process.env.WAVEX_NFT_V2_ADDRESS, amount])
                }
            );
            console.log("Waiting for approval transaction...");
            await approveTx.wait();
            console.log("Token spend approved");

            // Execute the top-up
            console.log("Executing top-up transaction...");
            const topUpTx = await wavexNFT.topUpBalance(
                params.tokenId,
                amount,
                params.paymentToken,
                {
                    maxFeePerGas,
                    maxPriorityFeePerGas,
                    gasLimit: await gasManager.estimateGasWithMargin(token, 'approve', [process.env.WAVEX_NFT_V2_ADDRESS, amount])
                }
            );
            console.log("Waiting for top-up confirmation...");
            const topUpReceipt = await topUpTx.wait();

            // Transfer to merchant wallet
            console.log("Transferring tokens to merchant wallet...");
            const transferTx = await token.transfer(
                params.merchantWallet,
                amount,
                {
                    maxFeePerGas,
                    maxPriorityFeePerGas,
                    gasLimit: await gasManager.estimateGasWithMargin(token, 'approve', [process.env.WAVEX_NFT_V2_ADDRESS, amount])
                }
            );
            console.log("Waiting for transfer confirmation...");
            const transferReceipt = await transferTx.wait();

            // Verify merchant received the tokens
            const merchantBalance = await token.balanceOf(params.merchantWallet);
            console.log(`Merchant wallet balance: ${hre.ethers.formatUnits(merchantBalance, decimals)}`);

            console.log("All transactions completed successfully!");
            
            return {
                tokenId: params.tokenId,
                amount: params.amount,
                paymentToken: params.paymentToken,
                merchantWallet: params.merchantWallet,
                topUpHash: topUpReceipt.hash,
                
                network: hre.network.name,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Contract interaction failed: ${error.message}`);
        }
    } catch (error) {
        console.error("Error topping up balance:", error);
        throw error;
    }
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

module.exports = {
    topUpBalance
};