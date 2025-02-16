// scripts/utils/networkUtils.js
const hre = require("hardhat");
const { gasManager } = require('./gasUtils');
const config = require('../../hardhat.config');

class NetworkManager {
    constructor() {
        this.provider = hre.ethers.provider;
        this.hardhatConfig = config.networks;
    }

    async getNetworkName() {
        const network = await this.provider.getNetwork();
        return network.name;
    }

    getNetworkConfig() {
        const networkName = hre.network.name;
        const networkConfig = this.hardhatConfig[networkName];

        if (!networkConfig) {
            throw new Error('Network configuration not found for: ' + networkName);
        }

        const defaultConfigs = {
            currencySymbol: "ETH",
            blockExplorerUrl: ""
        };

        const configs = {
            polygonAmoy: {
                currencySymbol: "MATIC",
                blockExplorerUrl: "https://amoy.polygonscan.com/"
            },
            polygon: {
                currencySymbol: "MATIC",
                blockExplorerUrl: "https://polygonscan.com/"
            },
            ...defaultConfigs,
            ...networkConfig // Override with network-specific configs from hardhat.config.js
        };


        return configs[networkName] || defaultConfigs;
    }

    async verifyNetworkConnection() {
        try {
            await this.provider.getBlockNumber();
            return true;
        } catch (error) {
            console.error("Error verifying network connection:", error);
            return false;
        }
    }
}

// Singleton instance
const networkManager = new NetworkManager();

module.exports = {
    networkManager,
    NetworkManager
};