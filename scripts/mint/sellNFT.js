const { ethers } = require("hardhat");
const { getGasPrice } = require("../utils/gasUtils");
const fs = require("fs");
const path = require("path");

/**
 * Handles the NFT sale process including payment validation and minting
 * @param {Object} params Sale parameters
 * @param {string} params.templateId Template ID to mint from
 * @param {string} params.buyerAddress Buyer's wallet address
 * @param {string} params.paymentTokenAddress ERC20 token address for payment
 * @param {string} params.paymentAmount Amount to be paid in payment token
 * @param {Object} params.metadata NFT metadata object
 */
async function sellNFT({
    templateId,
    buyerAddress,
    paymentTokenAddress,
    paymentAmount,
    metadata
}) {
    try {
        console.log("Starting NFT sale process...");

        // Get contract instances
        const nftContract = await ethers.getContractAt(
            "WaveXNFTV2Updated",
            process.env.NFT_CONTRACT_ADDRESS
        );
        const paymentToken = await ethers.getContractAt(
            "IERC20",
            paymentTokenAddress
        );

        // Get template details
        const template = await nftContract.getTemplate(templateId);
        console.log(`Using template: ${template.name}`);

        // Validate buyer address
        if (!ethers.isAddress(buyerAddress)) {
            throw new Error("Invalid buyer address");
        }

        // Check if template is active
        if (!template.active) {
            throw new Error("Template is not active");
        }

        // Validate payment amount matches template price
        if (paymentAmount.toString() !== template.price.toString()) {
            throw new Error("Payment amount doesn't match template price");
        }

        // Check buyer's payment token balance
        const buyerBalance = await paymentToken.balanceOf(buyerAddress);
        if (buyerBalance.lt(paymentAmount)) {
            throw new Error("Insufficient payment token balance");
        }

        // Check payment token allowance
        const allowance = await paymentToken.allowance(
            buyerAddress,
            process.env.NFT_CONTRACT_ADDRESS
        );
        if (allowance.lt(paymentAmount)) {
            throw new Error("Insufficient payment token allowance");
        }

        // Format metadata
        const formattedMetadata = formatMetadata(metadata, template);

        // Upload metadata to IPFS or your preferred storage
        const metadataURI = await uploadMetadata(formattedMetadata);

        // Process payment
        console.log("Processing payment...");
        const paymentTx = await paymentToken.transferFrom(
            buyerAddress,
            process.env.TREASURY_ADDRESS, // Treasury wallet to receive payments
            paymentAmount,
            {
                gasPrice: await getGasPrice()
            }
        );
        await paymentTx.wait();
        console.log("Payment processed successfully");

        // Mint NFT
        console.log("Minting NFT...");
        const mintTx = await nftContract.mintFromTemplate(
            templateId,
            buyerAddress,
            metadataURI,
            {
                gasPrice: await getGasPrice()
            }
        );
        const receipt = await mintTx.wait();

        // Get token ID from mint event
        const mintEvent = receipt.events.find(event => event.event === "Transfer");
        const tokenId = mintEvent.args.tokenId;

        // Record sale in database or logs
        await recordSale({
            tokenId,
            templateId,
            buyerAddress,
            paymentAmount,
            metadataURI,
            txHash: receipt.transactionHash
        });

        console.log(`NFT minted successfully! Token ID: ${tokenId}`);
        return {
            success: true,
            tokenId,
            txHash: receipt.transactionHash
        };

    } catch (error) {
        console.error("Error in sellNFT:", error);
        throw error;
    }
}

/**
 * Formats metadata according to template requirements
 * @param {Object} metadata Raw metadata object
 * @param {Object} template Template details
 * @returns {Object} Formatted metadata
 */
function formatMetadata(metadata, template) {
    // Add template-specific formatting
    const formatted = {
        name: `${template.name} Pass`,
        description: metadata.description || `WaveX ${template.name} Pass`,
        image: metadata.image,
        attributes: [
            {
                trait_type: "Template",
                value: template.name
            },
            {
                trait_type: "Base Balance",
                value: ethers.formatEther(template.baseBalance)
            },
            {
                trait_type: "VIP Status",
                value: template.isVIP ? "Yes" : "No"
            },
            ...Object.entries(metadata.attributes || {}).map(([key, value]) => ({
                trait_type: key,
                value: value
            }))
        ],
        properties: {
            template_id: template.templateId,
            creation_date: new Date().toISOString(),
            ...metadata.properties
        }
    };

    return formatted;
}

/**
 * Records the sale details for tracking
 * @param {Object} saleDetails Sale transaction details
 */
async function recordSale(saleDetails) {
    const salesLog = path.join(__dirname, "../../data/sales/sales_log.json");
    
    // Create sales directory if it doesn't exist
    const salesDir = path.dirname(salesLog);
    if (!fs.existsSync(salesDir)) {
        fs.mkdirSync(salesDir, { recursive: true });
    }

    // Read existing sales log
    let sales = [];
    if (fs.existsSync(salesLog)) {
        sales = JSON.parse(fs.readFileSync(salesLog));
    }

    // Add new sale
    sales.push({
        ...saleDetails,
        timestamp: new Date().toISOString()
    });

    // Write updated sales log
    fs.writeFileSync(salesLog, JSON.stringify(sales, null, 2));
}

/**
 * Uploads metadata to storage (IPFS or other)
 * @param {Object} metadata Formatted metadata object
 * @returns {string} Metadata URI
 */
async function uploadMetadata(metadata) {
    // Implementation depends on your storage solution
    // This is a placeholder that saves locally
    const filename = `metadata_${Date.now()}.json`;
    const filepath = path.join(__dirname, "../../data/metadata", filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Save metadata
    fs.writeFileSync(filepath, JSON.stringify(metadata, null, 2));
    
    // Return local URI (replace with your storage solution)
    return `metadata/${filename}`;
}

module.exports = {
    sellNFT
};