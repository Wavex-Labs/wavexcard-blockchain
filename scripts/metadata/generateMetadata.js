// Terminal Command: npx hardhat run scripts/metadata/generateMetadata.js --network polygonAmoy
require('dotenv').config();
const fs = require("fs");
const path = require("path");
const { uploadToIPFS } = require('../utils/pinataUtils');
const hre = require("hardhat");

// Fetch template data from the blockchain for a specific token
async function getTokenTemplate(tokenId) {
    try {
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get template count
        const templateCount = await wavexNFT.getTemplateCount();
        
        // Get token balance
        const tokenBalance = await wavexNFT.tokenBalance(tokenId);

        // Iterate through templates to find the matching one
        for (let i = 1; i <= templateCount; i++) {
            const template = await wavexNFT.getTemplate(i);
            
            // Check if this template's baseBalance matches the token's initial balance
            if (template && template[6] && // active
                template[1].toString() === tokenBalance.toString()) { // baseBalance matches
                return {
                    id: i.toString(),
                    name: template[0],
                    baseBalance: template[1].toString(),
                    price: template[2].toString(),
                    discount: template[3].toString(),
                    isVIP: template[4],
                    metadataURI: template[5],
                    active: template[6]
                };
            }
        }
        
        // If no template is found, use a default template (1 for Gold)
        const defaultTemplate = await wavexNFT.getTemplate(1);
        return {
            id: "1",
            name: defaultTemplate[0],
            baseBalance: defaultTemplate[1].toString(),
            price: defaultTemplate[2].toString(),
            discount: defaultTemplate[3].toString(),
            isVIP: defaultTemplate[4],
            metadataURI: defaultTemplate[5],
            active: defaultTemplate[6]
        };
    } catch (error) {
        console.error(`Error fetching template for token ${tokenId}:`, error);
        throw error;
    }
}

// Template configurations
const templateConfigs = {
    "1": { // Gold
        name: "Gold",
        baseBalance: "3000",
        price: "3000",
        discount: 6,
        isVIP: true,
        image: "ipfs://QmZ8u69Hjwuxe7XSB4p344DaCtPoHAu9D6v3QE6cnggLRD",
        validity: 24, // 2 years
        benefits: [
            "6% Discount on all purchases",
            "Priority Support",
            "Member Events Access"
        ],
        cardDesign: {
            primaryColor: "#FFD700",
            textColor: "#000000"
        }
    },
    "2": { // Platinum
        name: "Platinum",
        baseBalance: "5000",
        price: "5000",
        discount: 9,
        isVIP: true,
        image: "ipfs://QmVSqUndoMDubugAGMUtyzXyxNH8TjT9w5PAWWCHnjmQnj",
        validity: 24, // 2 years
        benefits: [
            "9% Discount on all purchases",
            "Priority Support",
            "Member Events Access"
        ],
        cardDesign: {
            primaryColor: "#FFD700",
            textColor: "#000000"
        }
    },
    "3": { // Black
        name: "Black",
        baseBalance: "1000",
        price: "1000",
        discount: 0,
        isVIP: false,
        image: "ipfs://QmY6qhAMnc2USJB6b3QxL3sYLnofoyXdr8aN3KAqDkvpms",
        validity: 24, // 2 years
        benefits: [
            "0% Discount on all purchases",
            "24/7 Support",
            "Member Events Access"
        ],
        cardDesign: {
            primaryColor: "#FFD700",
            textColor: "#000000"
        }
    },
    "4": { // Eventbrite
        name: "Eventbrite",
        baseBalance: "0",
        price: "0",
        discount: 0,
        isVIP: false,
        image: "ipfs://QmY328jAjbgFvQLD1yuauCUAxyiQT8kEdtZzde1Xy2QkPb", // Update with correct Eventbrite image
        validity: 24,
        benefits: [
            "Event Access",
            "24/7 Support"
        ],
        cardDesign: {
            primaryColor: "#4A90E2",
            textColor: "#FFFFFF"
        }
    }
};

// Helper function to format date
function formatDate(months) {
    const date = new Date();
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString();
}

// Helper function to get pass type identifier
function getPassTypeIdentifier(templateId) {
    const prefixes = {
        "1": "pass.com.wavex.gold",
        "2": "pass.com.wavex.platinum",
        "3": "pass.com.wavex.black",
        "4": "pass.com.wavex.eventbrite"
    };
    return prefixes[templateId] || "pass.com.wavex.default";
}

// Generate complete metadata for an NFT
async function generateCompleteMetadata(tokenId, owner) {
    try {
        // Fetch the template from the blockchain
        const onChainTemplate = await getTokenTemplate(tokenId);
        const templateId = onChainTemplate.id;
        
        // Get the configuration for this template
        const config = templateConfigs[templateId];
        if (!config) {
            throw new Error(`Template configuration not found for template ID ${templateId}`);
        }

        // Merge on-chain data with local config
        const mergedConfig = {
            ...config,
            baseBalance: hre.ethers.formatEther(onChainTemplate.baseBalance),
            price: hre.ethers.formatEther(onChainTemplate.price),
            discount: onChainTemplate.discount,
            isVIP: onChainTemplate.isVIP,
            name: onChainTemplate.name
        };

        const validUntil = formatDate(mergedConfig.validity);
        const createdAt = new Date().toISOString();

        // Generate metadata using merged configuration
        const metadata = {
            name: `WaveX ${mergedConfig.name} Card #${tokenId}`,
            description: `WaveX ${mergedConfig.name} membership card with ${mergedConfig.discount}% discount`,
            image: mergedConfig.image,
            attributes: [
                {
                    trait_type: "Token ID",
                    value: tokenId.toString()
                },
                {
                    trait_type: "Template",
                    value: mergedConfig.name
                },
                {
                    trait_type: "Balance",
                    value: `$${mergedConfig.baseBalance} USD`
                },
                {
                    trait_type: "Discount",
                    value: `${mergedConfig.discount}%`
                },
                {
                    trait_type: "VIP Status",
                    value: mergedConfig.isVIP ? "Yes" : "No"
                },
                {
                    trait_type: "Valid Until",
                    value: validUntil
                }
            ],
            properties: {
                type: "NFT",
                createdAt: createdAt,
                tokenId: tokenId.toString(),
                templateId: templateId.toString(),
                owner: owner
            },
            platforms: {
                opensea: {
                    external_url: "https://wavexcard.com"
                },
                nftVisual: {
                    properties: {
                        tier: mergedConfig.name,
                        benefits: mergedConfig.benefits,
                        balance: mergedConfig.baseBalance,
                        cardDesign: {
                            primaryColor: mergedConfig.cardDesign.primaryColor,
                            textColor: mergedConfig.cardDesign.textColor,
                            image: mergedConfig.image
                        }
                    }
                },
                appleWallet: {
                    formatVersion: 1,
                    passTypeIdentifier: getPassTypeIdentifier(templateId),
                    serialNumber: `TOKEN-${tokenId}`,
                    teamIdentifier: "JHQFQ72XMR",
                    organizationName: "WaveX",
                    logoText: "WaveX",
                    foregroundColor: mergedConfig.cardDesign.textColor,
                    backgroundColor: mergedConfig.cardDesign.primaryColor,
                    storeCard: {
                        primaryFields: [
                            {
                                key: "balance",
                                label: "BALANCE",
                                value: mergedConfig.baseBalance,
                                currencyCode: "USD"
                            }
                        ],
                        secondaryFields: [
                            {
                                key: "tier",
                                label: "TIER",
                                value: mergedConfig.name
                            },
                            {
                                key: "discount",
                                label: "DISCOUNT",
                                value: `${mergedConfig.discount}%`
                            }
                        ],
                        backFields: [
                            {
                                key: "validUntil",
                                label: "VALID UNTIL",
                                value: validUntil
                            },
                            ...mergedConfig.benefits.map((benefit, index) => ({
                                key: `benefit${index}`,
                                label: "BENEFIT",
                                value: benefit
                            }))
                        ]
                    }
                },
                prepaidCard: {
                    baseBalance: mergedConfig.baseBalance,
                    price: mergedConfig.price,
                    discount: mergedConfig.discount,
                    isVIP: mergedConfig.isVIP,
                    validUntil: validUntil,
                    style: {
                        colors: {
                            primary: mergedConfig.cardDesign.primaryColor,
                            text: mergedConfig.cardDesign.textColor
                        },
                        image: mergedConfig.image
                    },
                    features: {
                        benefits: mergedConfig.benefits,
                        transferable: true,
                        rechargeable: true,
                        upgradeable: templateId !== "3"
                    }
                }
            }
        };

        return metadata;
    } catch (error) {
        console.error('Error generating metadata:', error);
        throw error;
    }
}

// Main function to generate and save metadata
async function main() {
    try {
        const generateMetadataTokenId = process.env.GENERATE_METADATA_TOKEN_ID; // Updated variable name
        if (!generateMetadataTokenId) {
            throw new Error("GENERATE_METADATA_TOKEN_ID environment variable is required");
        }

        const owner = process.env.MERCHANT_ADDRESS; // Using existing env variable for owner

        console.log(`Generating metadata for Token #${generateMetadataTokenId}`);
        
        const metadata = await generateCompleteMetadata(generateMetadataTokenId, owner);
        
        // Save locally
        const outputDir = path.join(process.cwd(), "V2", "metadata", "nfts");
        fs.mkdirSync(outputDir, { recursive: true });
        const filePath = path.join(outputDir, `${generateMetadataTokenId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));

        // Upload to IPFS if enabled
        if (process.env.UPLOAD_TO_IPFS === 'true') {
            console.log('Uploading to IPFS...');
            const ipfsHash = await uploadToIPFS(metadata, `token-${generateMetadataTokenId}`);
            console.log(`✅ Metadata uploaded to IPFS: ipfs://${ipfsHash}`);
            return ipfsHash;
        }

        console.log(`✅ Metadata generated and saved locally`);
        return null;

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

module.exports = {
    generateCompleteMetadata
};

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}