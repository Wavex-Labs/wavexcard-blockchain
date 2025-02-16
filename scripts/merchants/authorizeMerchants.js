const { gasManager } = require('../utils/gasUtils');
const hre = require("hardhat");

async function authorizeMerchant(merchantAddress) {
    try {
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        const gasLimit = await gasManager.estimateGasWithMargin(wavexNFT, 'authorizeMerchant', [merchantAddress]);
        const tx = await wavexNFT.authorizeMerchant(merchantAddress, { ...gasConfig, gasLimit });
        const receipt = await tx.wait();

        console.log(`Merchant ${merchantAddress} authorized successfully. Transaction: ${receipt.transactionHash}`);
        return receipt.transactionHash;
    } catch (error) {
        console.error(`Error authorizing merchant ${merchantAddress}:`, error);
        throw error;
    }
}

async function revokeMerchant(merchantAddress) {
    try {
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        const gasLimit = await gasManager.estimateGasWithMargin(wavexNFT, 'revokeMerchant', [merchantAddress]);
        const tx = await wavexNFT.revokeMerchant(merchantAddress, { ...gasConfig, gasLimit });
        const receipt = await tx.wait();

        console.log(`Merchant ${merchantAddress} revoked successfully. Transaction: ${receipt.transactionHash}`);
        return receipt.transactionHash;
    } catch (error) {
        console.error(`Error revoking merchant ${merchantAddress}:`, error);
        throw error;
    }
}

async function isMerchantAuthorized(merchantAddress) {
    try {
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        const gasLimit = await gasManager.estimateGasWithMargin(wavexNFT, 'authorizedMerchants', [merchantAddress]);
        const authorized = await wavexNFT.authorizedMerchants(merchantAddress, { ...gasConfig, gasLimit });
        return authorized;
    } catch (error) {
        console.error(`Error checking merchant authorization for ${merchantAddress}:`, error);
        throw error;
    }
}

module.exports = {
    authorizeMerchant,
    revokeMerchant,
    isMerchantAuthorized
};