const { ethers } = require("hardhat");
const { getGasPrice } = require("../utils/gasUtils");
const fs = require("fs");
const path = require("path");

/**
 * Checks in a token to an event
 * @param {Object} params Check-in parameters
 * @param {string} params.tokenId Token ID to check in
 * @param {string} params.eventId Event ID to check in to
 * @param {string} params.operatorAddress Address performing the check-in
 */
async function checkInToEvent({
    tokenId,
    eventId,
    operatorAddress
}) {
    try {
        console.log(`Processing check-in for Token ID ${tokenId} at Event ID ${eventId}...`);

        // Get contract instance
        const nftContract = await ethers.getContractAt(
            "WaveXNFTV2Updated",
            process.env.NFT_CONTRACT_ADDRESS
        );

        // Verify operator is authorized
        const isAuthorized = await nftContract.authorizedMerchants(operatorAddress);
        if (!isAuthorized) {
            throw new Error("Operator not authorized to perform check-ins");
        }

        // Check if already checked in
        const alreadyCheckedIn = await nftContract.isCheckedIn(eventId, tokenId);
        if (alreadyCheckedIn) {
            throw new Error("Token already checked in to this event");
        }

        // Perform check-in
        const tx = await nftContract.checkInEvent(tokenId, eventId, {
            from: operatorAddress,
            gasPrice: await getGasPrice()
        });

        // Wait for transaction confirmation
        const receipt = await tx.wait();

        // Log check-in
        await recordCheckIn({
            tokenId,
            eventId,
            operatorAddress,
            timestamp: new Date().toISOString(),
            txHash: receipt.transactionHash
        });

        console.log(`Check-in successful! Transaction Hash: ${receipt.transactionHash}`);
        return {
            success: true,
            txHash: receipt.transactionHash
        };

    } catch (error) {
        console.error("Error in checkInToEvent:", error);
        throw error;
    }
}

/**
 * Records the check-in details
 * @param {Object} checkInDetails Check-in transaction details
 */
async function recordCheckIn(checkInDetails) {
    const checkInLog = path.join(__dirname, "../../data/events/checkins.json");
    
    // Create events directory if it doesn't exist
    const eventsDir = path.dirname(checkInLog);
    if (!fs.existsSync(eventsDir)) {
        fs.mkdirSync(eventsDir, { recursive: true });
    }

    // Read existing check-in log
    let checkIns = [];
    if (fs.existsSync(checkInLog)) {
        checkIns = JSON.parse(fs.readFileSync(checkInLog));
    }

    // Add new check-in
    checkIns.push(checkInDetails);

    // Write updated check-in log
    fs.writeFileSync(checkInLog, JSON.stringify(checkIns, null, 2));
}

/**
 * Gets check-in status and history for a token at an event
 * @param {string} tokenId Token ID to check
 * @param {string} eventId Event ID to check
 * @returns {Object} Check-in status and history
 */
async function getCheckInStatus(tokenId, eventId) {
    try {
        const nftContract = await ethers.getContractAt(
            "WaveXNFTV2Updated",
            process.env.NFT_CONTRACT_ADDRESS
        );

        // Get on-chain check-in status
        const isCheckedIn = await nftContract.isCheckedIn(eventId, tokenId);

        // Get event details
        const eventsList = await nftContract.getTokenEvents(tokenId);
        const hasTicket = eventsList.some(id => id.toString() === eventId.toString());

        // Get check-in history from logs
        const history = await getCheckInHistory(tokenId, eventId);

        return {
            tokenId: tokenId.toString(),
            eventId: eventId.toString(),
            hasTicket,
            isCheckedIn,
            history
        };
    } catch (error) {
        console.error("Error in getCheckInStatus:", error);
        throw error;
    }
}

/**
 * Gets check-in history from local logs
 * @param {string} tokenId Token ID to check
 * @param {string} eventId Event ID to check
 * @returns {Array} Check-in history
 */
function getCheckInHistory(tokenId, eventId) {
    const checkInLog = path.join(__dirname, "../../data/events/checkins.json");
    
    if (!fs.existsSync(checkInLog)) {
        return [];
    }

    const checkIns = JSON.parse(fs.readFileSync(checkInLog));
    return checkIns.filter(
        checkIn => 
            checkIn.tokenId.toString() === tokenId.toString() && 
            checkIn.eventId.toString() === eventId.toString()
    );
}

// Example usage
async function main() {
    const tokenId = "1";
    const eventId = "1";
    const operatorAddress = process.env.OPERATOR_ADDRESS;

    try {
        // Check status before check-in
        console.log("Status before check-in:");
        const beforeStatus = await getCheckInStatus(tokenId, eventId);
        console.log(beforeStatus);

        // Perform check-in if not already checked in
        if (!beforeStatus.isCheckedIn && beforeStatus.hasTicket) {
            await checkInToEvent({
                tokenId,
                eventId,
                operatorAddress
            });
        }

        // Check status after check-in
        console.log("\nStatus after check-in:");
        const afterStatus = await getCheckInStatus(tokenId, eventId);
        console.log(afterStatus);

    } catch (error) {
        console.error("Error in main:", error);
    }
}

// Execute if running directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    checkInToEvent,
    getCheckInStatus,
    getCheckInHistory
};