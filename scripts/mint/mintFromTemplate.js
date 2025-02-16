// Terminal Command: npx hardhat run scripts/mint/mintFromTemplate.js --network polygonAmoy
require('dotenv').config();
const { ethers } = require("hardhat");
const { gasManager } = require('../utils/gasUtils');
const { PinataManager } = require('../utils/pinataUtils');

// Error handling class
class MintError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'MintError';
        this.code = code;
        this.details = details;
    }
}

// Validation functions
async function validateTokenBalancesAndAllowances(signer, templateId, paymentTokenContract) { // Renamed paymentToken to paymentTokenContract
    const template = await contract.getTemplate(templateId);
    const templatePrice = template[2];

    // Check USDT balance
    const balance = await paymentTokenContract.balanceOf(signer.address); // Use paymentTokenContract
    if (balance.lt(templatePrice)) {
        throw new MintError(
            'Insufficient token balance',
            'INSUFFICIENT_BALANCE',
            {
                required: templatePrice.toString(),
                available: balance.toString()
            }
        );
    }

    // Check allowance
    const allowance = await paymentTokenContract.allowance(signer.address, contract.address); // Use paymentTokenContract
    if (allowance.lt(templatePrice)) {
        throw new MintError(
            'Insufficient token allowance',
            'INSUFFICIENT_ALLOWANCE',
            {
                required: templatePrice.toString(),
                available: allowance.toString()
            }
        );
    }
}

async function validateTemplate(contract, templateId) {
    const template = await contract.getTemplate(templateId);
    if (!template || !template.active) {
        throw new MintError(
            'Template is not active or does not exist',
            'INVALID_TEMPLATE',
            { templateId }
        );
    }
    return template;
}

async function validateRecipient(recipientAddress) {
    if (!ethers.isAddress(recipientAddress)) {
        throw new MintError(
            'Invalid recipient address',
            'INVALID_RECIPIENT',
            { address: recipientAddress }
        );
    }

    // Check if address is a contract
    const code = await ethers.provider.getCode(recipientAddress);
    if (code !== '0x') {
        throw new MintError(
            'Recipient cannot be a contract',
            'INVALID_RECIPIENT_TYPE',
            { address: recipientAddress }
        );
    }
}

async function validateEnvironment(templateId) {
    const requiredVars = [
        'MINT_FROM_TEMPLATE_ID',
        'MINT_RECIPIENT_ADDRESS',
        'USDT_CONTRACT_ADDRESS',
        `TEMPLATE_${templateId}_NAME`,
        `TEMPLATE_${templateId}_IMAGE`,
        `TEMPLATE_${templateId}_PRICE`,
        'WAVEX_NFT_V3_ADDRESS'
    ];

    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            throw new MintError(
                `Missing required environment variable: ${varName}`,
                'INVALID_ENVIRONMENT'
            );
        }
    }
}

async function mint() {
    try {
        const templateId = process.env.MINT_FROM_TEMPLATE_ID;
        await validateEnvironment(templateId);

        const [signer] = await ethers.getSigners();
        console.log(`Using signer: ${signer.address}`);

        // Initialize contracts
        const WaveXNFTV3 = await ethers.getContractFactory("WaveXNFTV3");
        const contract = WaveXNFTV3.attach(process.env.WAVEX_NFT_V3_ADDRESS);

        // Initialize USDT contract
        const USDT = await ethers.getContractAt(
            "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
            process.env.USDT_CONTRACT_ADDRESS
        );

        

        // Get template details and convert price
        const template = await contract.getTemplate(templateId);
        const templatePriceInWei = template[2];
        const templatePrice = ethers.parseUnits(
            ethers.formatUnits(templatePriceInWei, 18),
            6 // USDT decimals
        );

        console.log(`Template price: ${ethers.formatUnits(templatePrice, 6)} USDT`);
        console.log(`Raw price from template: ${templatePriceInWei.toString()}`);

        // Check USDT balance
        const usdtBalance = await USDT.balanceOf(signer.address);
        console.log(`USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);

        // Compare balances using BigInt
        const usdtBalanceBN = ethers.getBigInt(usdtBalance.toString());
        const templatePriceBN = ethers.getBigInt(templatePrice.toString());

        if (usdtBalanceBN < templatePriceBN) {
            throw new MintError(
                'Insufficient USDT balance',
                'INSUFFICIENT_BALANCE',
                {
                    required: ethers.formatUnits(templatePrice, 6),
                    available: ethers.formatUnits(usdtBalance, 6),
                    rawPrice: templatePriceInWei.toString()
                }
            );
        }

        // Transfer USDT to contract
        console.log('Approving USDT transfer...');
        const gasConfig = await gasManager.getGasConfig();

        const approveTx = await USDT.approve(
            contract.address,
            templatePrice,
            {
                maxFeePerGas: gasConfig.maxFeePerGas,
                maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas
            }
        );
        await approveTx.wait();
        console.log('USDT approved');

        // Transfer USDT to contract
        const transferTx = await USDT.transferFrom(
            signer.address,
            contract.address,
            templatePrice,
            {
                maxFeePerGas: gasConfig.maxFeePerGas,
                maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas
            }
        );
        await transferTx.wait();
        console.log('USDT transferred to contract');

        const recipientAddress = process.env.MINT_RECIPIENT_ADDRESS;
        console.log(`Minting to recipient address: ${recipientAddress}`);

        // Create and upload metadata
        const metadata = {
            name: `WaveX ${process.env[`TEMPLATE_${templateId}_NAME`]} NFT`,
            description: `WaveX ${process.env[`TEMPLATE_${templateId}_NAME`]} Access NFT`,
            image: process.env[`TEMPLATE_${templateId}_IMAGE`],
            attributes: [
                {
                    trait_type: "Template",
                    value: process.env[`TEMPLATE_${templateId}_NAME`]
                },
                {
                    trait_type: "Mint Date",
                    value: new Date().toISOString()
                }
            ]
        };

        // Upload to IPFS
        const pinata = new PinataManager();
        await pinata.testAuthentication();
        console.log('Uploading metadata to IPFS...');
        const metadataURI = await pinata.uploadJSON(metadata, `token-${Date.now()}`);
        console.log('Metadata uploaded:', metadataURI);

        // Mint NFT
        console.log('Submitting mint transaction...');
        const mintTx = await contract.mintFromTemplate(
            templateId,
            recipientAddress,
            `ipfs://${metadataURI}`,
            process.env.USDT_CONTRACT_ADDRESS,
            templateId,
            recipientAddress,
            `ipfs://${metadataURI}`,
            process.env.USDT_CONTRACT_ADDRESS, // Added paymentToken parameter here
            {
                maxFeePerGas: gasConfig.maxFeePerGas,
                maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas,
                value: 0 // No native token needed
            }
        );

        console.log('Transaction submitted:', mintTx.hash);
        const receipt = await mintTx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        return {
            success: true,
            transactionHash: mintTx.hash,
            blockNumber: receipt.blockNumber,
            recipient: recipientAddress,
            metadataURI: `ipfs://${metadataURI}`,
            templateId,
            price: ethers.formatUnits(templatePrice, 6),
            paymentToken: process.env.USDT_CONTRACT_ADDRESS
        };

    } catch (error) {
        if (error instanceof MintError) {
            console.error('Minting failed:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
        } else {
            console.error('Unexpected error during minting:', error);
        }

        return {
            success: false,
            error: error instanceof MintError ? error : new MintError(
                'Unexpected error during minting',
                'UNKNOWN_ERROR',
                { originalError: error.message }
            )
        };
    }
}

// Script execution
if (require.main === module) {
    mint()
        .then(result => {
            console.log('Mint result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { mint };