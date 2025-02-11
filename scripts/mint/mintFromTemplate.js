require('dotenv').config();
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { uploadToIPFS } = require('../utils/pinataUtils');

async function mint() {
    try {
        const [signer] = await ethers.getSigners();
        console.log(`Using signer: ${signer.address}`);

        const WaveXNFTV2 = await ethers.getContractFactory("WaveXNFTV2");
        const contract = WaveXNFTV2.attach(process.env.WAVEX_NFT_V2_ADDRESS);

        const balance = await ethers.provider.getBalance(signer.address);
        console.log(`Wallet balance: ${ethers.formatEther(balance)} MATIC`);

        // Recipient wallet address
        const recipientAddress = "0x04F670221569C5D5E324A135C620A0FdA4d361d7";
        console.log(`Minting to recipient address: ${recipientAddress}`);

        const templateId = "4";
        console.log(`Using template ID: ${templateId} (EventBrite - Free template)`);

        const metadata = {
            name: "WaveX EventBrite NFT",
            description: "WaveX EventBrite Access NFT",
            image: process.env.TEMPLATE_4_IMAGE,
            attributes: [
                {
                    trait_type: "Template",
                    value: process.env.TEMPLATE_4_NAME
                },
                {
                    trait_type: "Mint Date",
                    value: new Date().toISOString()
                }
            ]
        };

        console.log('Uploading metadata to IPFS...');
        const metadataURI = await uploadToIPFS(metadata, `token-${Date.now()}`);
        console.log('Metadata uploaded:', metadataURI);

        const maxFeePerGas = ethers.parseUnits("30", "gwei");
        const maxPriorityFeePerGas = ethers.parseUnits("25", "gwei");
        const gasLimit = BigInt(2500000);

        console.log(`Gas settings:`);
        console.log(`- Max Fee Per Gas: ${ethers.formatUnits(maxFeePerGas, "gwei")} gwei`);
        console.log(`- Max Priority Fee: ${ethers.formatUnits(maxPriorityFeePerGas, "gwei")} gwei`);
        console.log(`- Gas Limit: ${gasLimit}`);

        const mintValue = ethers.parseEther("0");
        console.log(`Mint price: ${ethers.formatEther(mintValue)} MATIC`);

        const estimatedGasCost = maxFeePerGas * gasLimit;
        console.log(`Estimated max gas cost: ${ethers.formatEther(estimatedGasCost.toString())} MATIC`);

        console.log('Submitting mint transaction...');
        const tx = await contract.mintFromTemplate(
            templateId,
            recipientAddress, // Use recipient address instead of signer
            `ipfs://${metadataURI}`,
            {
                maxFeePerGas,
                maxPriorityFeePerGas,
                gasLimit,
                value: mintValue,
                type: 2
            }
        );

        console.log('Transaction submitted:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        return {
            success: true,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            recipient: recipientAddress
        };

    } catch (error) {
        console.error('Minting failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

if (require.main === module) {
    mint()
        .then(result => {
            console.log('Mint result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { mint };