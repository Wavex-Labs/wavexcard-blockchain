// scripts/events/getEventDetails.js
require('dotenv').config();
const hre = require("hardhat");
const { EVENT_TYPES } = require('../../config/eventConfig');

// Simplified constants
const CONSTANTS = {
    CONFIRMATIONS: 2,
    PRICE_DECIMALS: 6, // Updated for USDC/USDT decimals
    CURRENCY: 'USD'
};

/**
 * Formats price to USD string
 * @param {string} price - The raw price value
 * @returns {string} Formatted price in USD
 */
function formatPriceToUSD(price) {
    const numericPrice = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericPrice);
}

async function getEventDetails() {
    if (!process.env.WAVEX_NFT_V2_ADDRESS) {
        throw new Error("WAVEX_NFT_V2_ADDRESS not configured in environment");
    }

    try {
        console.log(`Fetching details for event ID: ${process.env.GET_EVENT_ID}`);
        
        const wavexNFT = await hre.ethers.getContractAt(
            "WaveXNFTV2",
            process.env.WAVEX_NFT_V2_ADDRESS
        );

        const event = await wavexNFT.events(process.env.GET_EVENT_ID);

        // Format event details
        const rawPrice = hre.ethers.formatUnits(event.price, CONSTANTS.PRICE_DECIMALS);
        const formattedEvent = {
            id: process.env.GET_EVENT_ID,
            name: event.name,
            price: formatPriceToUSD(rawPrice),
            priceRaw: rawPrice,
            capacity: event.capacity.toString(),
            soldCount: event.soldCount.toString(),
            active: event.active,
            eventType: event.eventType.toString(),
            typeLabel: Object.keys(EVENT_TYPES).find(
                key => EVENT_TYPES[key] === Number(event.eventType)
            ) || 'UNKNOWN',
            contractAddress: process.env.WAVEX_NFT_V2_ADDRESS
        };

        // Calculate additional fields
        formattedEvent.remainingCapacity = (
            parseInt(formattedEvent.capacity) - 
            parseInt(formattedEvent.soldCount)
        ).toString();

        formattedEvent.status = formattedEvent.active ? 
            (parseInt(formattedEvent.remainingCapacity) > 0 ? 'AVAILABLE' : 'SOLD_OUT') : 
            'INACTIVE';

        console.log(`\nEvent Details:`);
        console.log(JSON.stringify(formattedEvent, null, 2));

        return formattedEvent;

    } catch (error) {
        if (error.message.includes("Event not found")) {
            console.warn(`Event with ID ${process.env.GET_EVENT_ID} does not exist`);
            return null;
        }
        console.error("Error fetching event details:", error.message);
        throw error;
    }
}

if (require.main === module) {
    getEventDetails()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    getEventDetails
};