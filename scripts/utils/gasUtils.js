// scripts/utils/gasUtils.js
const hre = require("hardhat");

class GasManager {
    constructor() {
        this.provider = hre.ethers.provider;
    }

    async getFeeData() {
        try {
            const feeData = await this.provider.getFeeData();
            const networkName = await this.getNetworkName();
            
            // Log current gas prices
            console.log(`\nCurrent gas prices for ${networkName}:`);
            console.log("⛽ Base fee:", hre.ethers.formatUnits(feeData.lastBaseFeePerGas || 0, "gwei"), "gwei");
            console.log("🏷️ Max priority fee:", hre.ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, "gwei"), "gwei");
            console.log("💰 Max fee:", hre.ethers.formatUnits(feeData.maxFeePerGas || 0, "gwei"), "gwei");

            return feeData;
        } catch (error) {
            console.error("Error getting fee data:", error);
            throw error;
        }
    }

    async getNetworkName() {
        const network = await this.provider.getNetwork();
        return network.name;
    }

    async getGasConfig(customConfig = {}) {
        const feeData = await this.getFeeData();
        const networkName = await this.getNetworkName();

        // Network-specific configurations
        const networkConfigs = {
            polygonAmoy: {
                minPriorityFeePerGas: hre.ethers.parseUnits("30", "gwei"),
                multiplier: 1.2
            },
            polygon: {
                minPriorityFeePerGas: hre.ethers.parseUnits("50", "gwei"),
                multiplier: 1.5
            },
            // Add other networks as needed
            default: {
                minPriorityFeePerGas: hre.ethers.parseUnits("1", "gwei"),
                multiplier: 1.1
            }
        };

        const config = networkConfigs[networkName] || networkConfigs.default;

        // Calculate gas parameters
        const maxPriorityFeePerGas = BigInt(Math.max(
            Number(config.minPriorityFeePerGas),
            Number(feeData.maxPriorityFeePerGas || 0)
        ));

        const baseFee = feeData.lastBaseFeePerGas || hre.ethers.parseUnits("1", "gwei");
        const maxFeePerGas = baseFee * BigInt(Math.floor(config.multiplier * 100)) / 100n + maxPriorityFeePerGas;

        return {
            maxFeePerGas,
            maxPriorityFeePerGas,
            baseFee,
            ...customConfig
        };
    }

    async estimateGasWithMargin(contract, methodName, args = [], margin = 1.1) {
        try {
            const gasEstimate = await contract[methodName].estimateGas(...args);
            return BigInt(Math.ceil(Number(gasEstimate) * margin));
        } catch (error) {
            console.error(`Error estimating gas for ${methodName}:`, error);
            throw error;
        }
    }
}

// Singleton instance
const gasManager = new GasManager();

module.exports = {
    gasManager,
    GasManager
};