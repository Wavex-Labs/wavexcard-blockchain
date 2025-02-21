const { ethers } = require("hardhat");

/**
 * Gets the current gas price with a safety multiplier
 * @param {number} multiplier Optional gas price multiplier (default: 1.5)
 * @returns {Promise<BigInt>} Gas price in wei
 */
async function getGasPrice(multiplier = 1.5) {
    try {
        // Get provider's gas price
        const gasPrice = await ethers.provider.getFeeData();
        
        // Use maxFeePerGas if available (EIP-1559), otherwise use gasPrice
        const baseGasPrice = gasPrice.maxFeePerGas || gasPrice.gasPrice;
        
        // Ensure we meet the minimum gas price for Polygon Amoy (25 gwei)
        const minGasPrice = ethers.parseUnits("25", "gwei");
        
        // Calculate gas price with multiplier
        const calculatedGasPrice = (baseGasPrice * BigInt(Math.floor(multiplier * 100))) / BigInt(100);
        
        // Return the higher of calculated price or minimum required
        return calculatedGasPrice > minGasPrice ? calculatedGasPrice : minGasPrice;
    } catch (error) {
        console.error("Error getting gas price:", error);
        // Fallback to minimum gas price
        return ethers.parseUnits("25", "gwei");
    }
}

/**
 * Gets deployment transaction options with appropriate gas settings
 * @param {Object} options Additional transaction options
 * @returns {Promise<Object>} Transaction options with gas settings
 */
async function getDeploymentGasOptions(options = {}) {
    try {
        const gasPrice = await getGasPrice(1.5);
        const network = await ethers.provider.getNetwork();
        
        // Base gas limit - can be overridden by options
        const baseGasLimit = BigInt(2500000);

        // Combine with any provided options
        return {
            gasPrice: gasPrice,
            gasLimit: options.gasLimit || baseGasLimit,
            ...options
        };
    } catch (error) {
        console.error("Error getting deployment options:", error);
        throw error;
    }
}

/**
 * Estimates gas for a contract deployment
 * @param {Object} contractFactory Contract factory instance
 * @param {Array} args Constructor arguments
 * @param {number} multiplier Gas limit multiplier for safety (default: 1.2)
 * @returns {Promise<BigInt>} Estimated gas limit
 */
async function estimateDeploymentGas(contractFactory, args = [], multiplier = 1.2) {
    try {
        // Get deployment bytecode
        const deploymentData = contractFactory.getDeployTransaction(...args).data;
        
        // Estimate gas
        const estimatedGas = await ethers.provider.estimateGas({
            data: deploymentData
        });

        // Add safety margin
        return (estimatedGas * BigInt(Math.floor(multiplier * 100))) / BigInt(100);
    } catch (error) {
        console.error("Error estimating deployment gas:", error);
        // Fallback to default gas limit
        return BigInt(2500000);
    }
}

/**
 * Validates and processes transaction options
 * @param {Object} options Transaction options
 * @returns {Promise<Object>} Processed transaction options
 */
async function validateTxOptions(options = {}) {
    const gasPrice = await getGasPrice();
    
    // Ensure gas price meets minimum requirement
    if (options.gasPrice) {
        const minGasPrice = ethers.parseUnits("25", "gwei");
        options.gasPrice = BigInt(options.gasPrice) > minGasPrice ? 
            BigInt(options.gasPrice) : minGasPrice;
    } else {
        options.gasPrice = gasPrice;
    }

    return options;
}

/**
 * Waits for a transaction with appropriate confirmation count
 * @param {Object} tx Transaction object
 * @param {number} confirmations Number of confirmations to wait for
 * @returns {Promise<Object>} Transaction receipt
 */
async function waitForTransaction(tx, confirmations = 2) {
    try {
        const receipt = await tx.wait(confirmations);
        return receipt;
    } catch (error) {
        console.error("Error waiting for transaction:", error);
        throw error;
    }
}

module.exports = {
    getGasPrice,
    getDeploymentGasOptions,
    estimateDeploymentGas,
    validateTxOptions,
    waitForTransaction
};