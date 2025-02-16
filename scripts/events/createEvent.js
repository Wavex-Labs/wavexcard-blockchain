// scripts/events/createEvent.js
require('dotenv').config();
const hre = require("hardhat");
const { EVENT_TYPES, EVENT_METADATA } = require('../../config/eventConfig');
const { PinataManager } = require('../utils/pinataUtils');
const { gasManager } = require('../utils/gasUtils');

// Constants from environment
const USDT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS;
const USDC_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;
const CONFIRMATIONS = 2;

/**
 * Converts USD amount to token amount (considering 6 decimals for USDC/USDT)
 * @param {string} usdAmount Amount in USD
 * @returns {BigInt} Amount in token decimals
 */
function convertUSDToTokenAmount(usdAmount) {
    return hre.ethers.parseUnits(usdAmount, 6);
}

/**
 * Validates environment variables
 */
function validateEnvVariables() {
    const required = [
        'WAVEX_NFT_V2_ADDRESS',
        'PRIVATE_KEY',
        'RPC_URL',
        'CREATE_EVENT_NAME',
        'CREATE_EVENT_PRICE',
        'CREATE_EVENT_CAPACITY',
        'CREATE_EVENT_TYPE',
        'USDT_CONTRACT_ADDRESS',
        'USDC_CONTRACT_ADDRESS',
        'PINATA_API_KEY',
        'PINATA_API_SECRET',
        'PINATA_JWT'
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (isNaN(parseFloat(process.env.CREATE_EVENT_PRICE))) {
        throw new Error('CREATE_EVENT_PRICE must be a valid USD amount');
    }

    if (isNaN(parseInt(process.env.CREATE_EVENT_CAPACITY)) || parseInt(process.env.CREATE_EVENT_CAPACITY) <= 0) {
        throw new Error('CREATE_EVENT_CAPACITY must be a positive integer');
    }

    const eventType = parseInt(process.env.CREATE_EVENT_TYPE);
    if (isNaN(eventType) || !Object.values(EVENT_TYPES).includes(eventType)) {
        throw new Error('CREATE_EVENT_TYPE must be a valid event type');
    }
}

/**
 * Creates a new event on the WaveX platform
 */
async function createEvent() {
    try {
        validateEnvVariables();

        // Initialize Pinata
        const pinata = new PinataManager();
        await pinata.testAuthentication();

        // Setup provider and wallet
        const [signer] = await hre.ethers.getSigners();
        console.log("Creating event with address:", signer.address);

        // Convert USD price to token amount
        const priceInTokens = convertUSDToTokenAmount(process.env.CREATE_EVENT_PRICE);
        console.log(`Event price: $${process.env.CREATE_EVENT_PRICE} USD (${priceInTokens.toString()} tokens)`);

        // Generate metadata
        console.log("Generating event metadata...");
        const eventTypeKey = Object.keys(EVENT_TYPES).find(
            key => EVENT_TYPES[key] === parseInt(process.env.CREATE_EVENT_TYPE)
        );

        const metadata = {
            name: process.env.CREATE_EVENT_NAME,
            description: process.env.CREATE_EVENT_DESCRIPTION || `Event: ${process.env.CREATE_EVENT_NAME}`,
            image: process.env.CREATE_EVENT_IMAGE || EVENT_METADATA.defaultImage,
            attributes: [
                {
                    trait_type: "Type",
                    value: eventTypeKey
                },
                {
                    trait_type: "Capacity",
                    value: process.env.CREATE_EVENT_CAPACITY
                },
                {
                    trait_type: "Price",
                    value: `$${process.env.CREATE_EVENT_PRICE} USD`
                },
                {
                    trait_type: "Payment Tokens",
                    value: "USDC, USDT"
                }
            ]
        };

        // Upload metadata to IPFS
        console.log("Uploading metadata to IPFS...");
        const metadataURI = await pinata.uploadJSON(
            metadata,
            `event-${Date.now()}-${process.env.CREATE_EVENT_NAME.replace(/\s+/g, '-').toLowerCase()}`
        );
        console.log("Metadata uploaded:", metadataURI);

        // Get contract instance
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const contract = WaveXNFT.attach(process.env.WAVEX_NFT_V2_ADDRESS);

        const gasConfig = await gasManager.getGasConfig();
        const gasLimit = await gasManager.estimateGasWithMargin(contract, 'createEvent', [
            process.env.CREATE_EVENT_NAME,
            priceInTokens,
            parseInt(process.env.CREATE_EVENT_CAPACITY),
            parseInt(process.env.CREATE_EVENT_TYPE)
        ]);

        // Create event transaction
        console.log(`Creating event: ${process.env.CREATE_EVENT_NAME}...`);
        const tx = await contract.createEvent(
            process.env.CREATE_EVENT_NAME,
            priceInTokens,
            parseInt(process.env.CREATE_EVENT_CAPACITY),
            parseInt(process.env.CREATE_EVENT_TYPE),
            {
                ...gasConfig,
                gasLimit
            }
        );

        console.log(`Transaction submitted: ${tx.hash}`);
        const receipt = await tx.wait(CONFIRMATIONS);
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

        // Parse event from logs
        let eventId = null;
        for (const log of receipt.logs) {
            try {
                const parsedLog = contract.interface.parseLog({
                    topics: log.topics,
                    data: log.data
                });

                if (parsedLog.name === 'EventCreated') {
                    eventId = parsedLog.args.eventId;
                    break;
                }
            } catch (e) {
                continue; // Skip logs that can't be parsed
            }
        }

        if (!eventId) {
            console.warn("Warning: EventCreated event not found in logs");
        }

        // Create response object
        const eventDetails = {
            success: true,
            id: eventId ? eventId.toString() : null,
            name: process.env.CREATE_EVENT_NAME,
            priceUSD: process.env.CREATE_EVENT_PRICE,
            priceTokens: priceInTokens.toString(),
            capacity: process.env.CREATE_EVENT_CAPACITY,
            eventType: eventTypeKey,
            metadataURI: `ipfs://${metadataURI}`,
            gatewayURL: `https://gateway.pinata.cloud/ipfs/${metadataURI}`,
            supportedTokens: {
                USDC: USDC_ADDRESS,
                USDT: USDT_ADDRESS
            },
            createdAt: new Date().toISOString(),
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            gasConfig: {
                maxFeePerGas: gasConfig.maxFeePerGas.toString(),
                maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas.toString(),
                gasLimit: gasLimit.toString()
            }
        };

        console.log("Event created successfully:", eventDetails);
        return eventDetails;

    } catch (error) {
        console.error("Error creating event:", error);
        return {
            success: false,
            error: error.message,
            details: error.stack
        };
    }
}

// Execute if called directly
if (require.main === module) {
    createEvent()
        .then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    createEvent
};