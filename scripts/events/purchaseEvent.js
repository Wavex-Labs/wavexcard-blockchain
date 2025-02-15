// scripts/events/purchaseEvent.js
require('dotenv').config();
const hre = require("hardhat");
const { getEventDetails } = require('./getEventDetails');
const { gasManager } = require('../utils/gasUtils');

// Constants from .env
const CONSTANTS = {
    TOKEN_ID: process.env.PURCHASE_TOKEN_ID,
    EVENT_ID: process.env.PURCHASE_EVENT_ID,
    TICKET_COUNT: parseInt(process.env.PURCHASE_TICKET_COUNT || "1"),
    CONFIRMATIONS: parseInt(process.env.TRANSACTION_CONFIRMATIONS || "2")
};

/**
 * Validate purchase parameters
 * @param {Object} event Event details
 * @param {number} ticketCount Number of tickets to purchase
 */
function validatePurchaseParams(event, ticketCount) {
    if (!event.active) {
        throw new Error(`Event ${event.id} is not active`);
    }
    
    const remainingCapacity = parseInt(event.remainingCapacity);
    if (remainingCapacity < ticketCount) {
        throw new Error(
            `Insufficient capacity. Requested: ${ticketCount}, Available: ${remainingCapacity}`
        );
    }
}

/**
 * Format transaction details for logging
 * @param {Object} receipt Transaction receipt
 * @param {Object} gasConfig Gas configuration
 * @returns {Object} Formatted transaction details
 */
function formatTransactionDetails(receipt, gasConfig) {
    return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString() || '0',
        effectiveGasPrice: receipt.effectiveGasPrice?.toString() || '0',
        gasConfig: {
            maxFeePerGas: gasConfig?.maxFeePerGas?.toString() || '0',
            maxPriorityFeePerGas: gasConfig?.maxPriorityFeePerGas?.toString() || '0',
            baseFee: gasConfig?.baseFee?.toString() || '0'
        }
    };
}

/**
 * Purchase multiple tickets for an event using a single token
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Purchase details
 */
async function purchaseEvent(options = {}) {
    try {
        const tokenId = options.tokenId || CONSTANTS.TOKEN_ID;
        const eventId = options.eventId || CONSTANTS.EVENT_ID;
        const ticketCount = options.ticketCount || CONSTANTS.TICKET_COUNT;

        if (!tokenId || !eventId) {
            throw new Error("Token ID and Event ID are required in .env or options");
        }

        console.log(`\nInitiating purchase for ${ticketCount} ticket(s)...`);

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("WAVEX_NFT_V2_ADDRESS not configured in environment");
        }

        const wavexNFT = await hre.ethers.getContractAt("WaveXNFTV2", contractAddress);

        // Get event details and validate
        const event = await getEventDetails();
        if (!event) {
            throw new Error(`Event ${eventId} not found`);
        }

        // Validate purchase parameters
        validatePurchaseParams(event, ticketCount);

        // Check token balance for multiple tickets
        const balance = await wavexNFT.tokenBalance(tokenId);
        const pricePerTicket = hre.ethers.parseUnits(event.priceRaw, 6);
        const totalPrice = pricePerTicket * BigInt(ticketCount);

        if (balance < totalPrice) {
            throw new Error(
                `Insufficient balance. Required: $${hre.ethers.formatUnits(totalPrice, 6)} USD, ` +
                `Available: $${hre.ethers.formatUnits(balance, 6)} USD`
            );
        }

        // Get gas configuration
        console.log("\nPreparing transaction...");
        const gasConfig = await gasManager.getGasConfig();

        // Purchase tickets in a loop
        const purchases = [];
        for (let i = 0; i < ticketCount; i++) {
            console.log(`\nPurchasing ticket ${i + 1} of ${ticketCount}...`);
            
            // Estimate gas for each purchase
            const gasLimit = await gasManager.estimateGasWithMargin(
                wavexNFT,
                'purchaseEventEntrance',
                [tokenId, eventId]
            );

            const tx = await wavexNFT.purchaseEventEntrance(
                tokenId,
                eventId,
                {
                    maxFeePerGas: gasConfig.maxFeePerGas,
                    maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas,
                    gasLimit
                }
            );

            console.log(`Transaction submitted: ${tx.hash}`);
            console.log(`Waiting for ${CONSTANTS.CONFIRMATIONS} confirmations...`);

            const receipt = await tx.wait(CONSTANTS.CONFIRMATIONS);
            console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

            purchases.push({
                ticketNumber: i + 1,
                transaction: formatTransactionDetails(receipt, gasConfig)
            });
        }

        // Get updated event details
        const updatedEvent = await getEventDetails();

        // Prepare purchase details
        const purchaseDetails = {
            success: true,
            tokenId: tokenId.toString(),
            eventId: eventId.toString(),
            ticketCount,
            totalPrice: `$${hre.ethers.formatUnits(totalPrice, 6)} USD`,
            pricePerTicket: event.price,
            purchases,
            purchaseDate: new Date().toISOString(),
            event: updatedEvent
        };

        console.log(`\nPurchase Details:`);
        console.log(JSON.stringify(purchaseDetails, null, 2));

        return purchaseDetails;

    } catch (error) {
        console.error("\nError purchasing event access:", error.message);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Execute when run directly
if (require.main === module) {
    purchaseEvent()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    purchaseEvent
};