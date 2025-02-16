// scripts/events/checkInEventEntrance.js
require('dotenv').config();
const hre = require("hardhat");
const { getEventDetails } = require('./getEventDetails');
const { gasManager } = require('../utils/gasUtils');

class CheckInError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'CheckInError';
        this.code = code;
        this.details = details;
    }
}

async function getEventAccessDetails(contract, tokenId, eventId) {
    try {
        // Get purchased tickets count
        const gasLimit = await gasManager.estimateGasWithMargin(contract, 'getTokenEvents', [tokenId]);
        const tokenEvents = await contract.getTokenEvents(tokenId, { ...gasConfig, gasLimit });
        const purchasedTickets = tokenEvents.filter(e => e.toString() === eventId.toString()).length;

        // Get used tickets count (0 USD payments for this specific event)
        const txCount = await contract.getTransactionCount(tokenId, { ...gasConfig, gasLimit });
        let usedTickets = 0;
        
        for (let i = 0; i < txCount; i++) {
            const tx = await contract.getTransaction(tokenId, i, { ...gasConfig, gasLimit });
            if (tx.amount.toString() === "0" && 
                tx.transactionType === "PAYMENT" && 
                tx.metadata.includes(`EVENT_${eventId}`)) {
                usedTickets++;
            }
        }

        return {
            purchasedTickets,
            usedTickets,
            remainingTickets: purchasedTickets - usedTickets,
            hasAccess: purchasedTickets > 0,
            canCheckIn: purchasedTickets > usedTickets
        };
    } catch (error) {
        throw new CheckInError(
            "Failed to get access details",
            "ACCESS_CHECK_ERROR",
            { tokenId, eventId, error: error.message }
        );
    }
}

async function checkInEventEntrance({
    tokenId,
    eventId,
    location = "MAIN_ENTRANCE",
    validatorId = "VALIDATOR_001"
}) {
    if (!process.env.WAVEX_NFT_V2_ADDRESS) {
        throw new CheckInError("Contract address not configured", "CONFIG_ERROR");
    }

    try {
        // Initialize contract and signer
        const [signer] = await hre.ethers.getSigners();
        console.log(`Using signer address: ${signer.address} on network: ${hre.network.name}`);

        const contract = await hre.ethers.getContractAt(
            "WaveXNFTV2",
            process.env.WAVEX_NFT_V2_ADDRESS,
            signer
        );

        // Verify merchant authorization
        const isAuthorized = await contract.authorizedMerchants(signer.address);
        if (!isAuthorized) {
            throw new CheckInError("Unauthorized validator", "UNAUTHORIZED");
        }

        console.log(`Validating check-in for Token ${tokenId} at ${location}`);

        // Get and verify event
        console.log(`Fetching details for event ID: ${eventId}`);
        const event = await getEventDetails(eventId);
        if (!event || !event.active) {
            throw new CheckInError("Event not found or inactive", "EVENT_ERROR");
        }

        console.log("\nEvent Details:");
        console.log(JSON.stringify(event, null, 2));

        // Get access details
        const access = await getEventAccessDetails(contract, tokenId, eventId);
        
        if (!access.hasAccess) {
            throw new CheckInError(
                "Token does not have access to this event",
                "NO_ACCESS"
            );
        }

        if (!access.canCheckIn) {
            throw new CheckInError(
                `All tickets used (${access.usedTickets}/${access.purchasedTickets})`,
                "NO_REMAINING_TICKETS",
                access
            );
        }

        // Get gas parameters
        const gasConfig = await gasManager.getGasConfig();
        const gasLimit = await gasManager.estimateGasWithMargin(
            contract,
            'processPayment',
            [tokenId, 0, `EVENT_${eventId}_CHECKIN_${access.usedTickets + 1}`]
        );

        // Execute check-in
        const tx = await contract.processPayment(
            tokenId,
            0,
            `EVENT_${eventId}_CHECKIN_${access.usedTickets + 1}`,
            {
                maxFeePerGas: gasConfig.maxFeePerGas,
                maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas,
                gasLimit
            }
        );

        const receipt = await tx.wait(Number(process.env.CONFIRMATIONS || "2"));

        return {
            success: true,
            checkIn: {
                tokenId: tokenId.toString(),
                eventId: eventId.toString(),
                location,
                validatorId,
                ticketNumber: access.usedTickets + 1,
                totalTickets: access.purchasedTickets,
                remainingTickets: access.remainingTickets - 1,
                timestamp: new Date().toISOString()
            },
            transaction: {
                hash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            }
        };

    } catch (error) {
        const details = {
            tokenId,
            eventId,
            location,
            validatorId,
            timestamp: new Date().toISOString()
        };

        if (error instanceof CheckInError) {
            throw new CheckInError(error.message, error.code, {
                ...error.details,
                ...details
            });
        }

        throw new CheckInError(
            error.message,
            "EXECUTION_ERROR",
            details
        );
    }
}

// Execute when run directly
if (require.main === module) {
    const params = {
        tokenId: process.env.VALIDATE_TOKEN_ID,
        eventId: process.env.VALIDATE_EVENT_ID,
        location: process.env.CHECK_IN_LOCATION || "MAIN_ENTRANCE",
        validatorId: process.env.VALIDATOR_ID || "VALIDATOR_001"
    };

    checkInEventEntrance(params)
        .then(result => console.log(JSON.stringify(result, null, 2)))
        .catch(error => {
            console.error("Check-in failed:", {
                code: error.code || "UNKNOWN_ERROR",
                message: error.message,
                details: error.details
            });
            process.exit(1);
        });
}

module.exports = {
    checkInEventEntrance,
    getEventAccessDetails,
    CheckInError
};