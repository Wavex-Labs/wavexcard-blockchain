// scripts/merchants/removeMerchants.js
const hre = require("hardhat");
const { revokeMerchant } = require('./authorizeMerchants');
const { gasManager } = require('../utils/gasUtils');

async function removeMerchant(merchantAddress) {
    try {
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const wavexNFT = await hre.ethers.getContractFactory("WaveXNFTV2")
            .then(factory => factory.attach(contractAddress));

        // Revoke authorization
        const tx = await wavexNFT.revokeMerchant(merchantAddress);
        const receipt = await tx.wait();

        console.log(`Merchant ${merchantAddress} revoked successfully. Transaction: ${receipt.transactionHash}`);
        return receipt.transactionHash;
    } catch (error) {
        console.error(`Error removing merchant ${merchantAddress}:`, error);
        throw error;
    }
}

module.exports = { removeMerchant };
