require('dotenv').config();
const fs = require("fs");
const path = require("path");
const { uploadToIPFS } = require('../utils/pinataUtils');

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
    "4": { // Eventbrite
        name: "Eventbrite",
        baseBalance: "0",
        price: "0",
        discount: 0,
        isVIP: false,
        image: "ipfs://QmZ8u69Hjwuxe7XSB4p344DaCtPoHAu9D6v3QE6cnggLRD", // Update with correct Eventbrite image
        validity: 12,
        benefits: [
            "Event Access",
            "Basic Support"
        ],
        cardDesign: {
            primaryColor: "#4A90E2",
            textColor: "#FFFFFF"
        }
    }
};

function formatDate(months) {
    const date = new Date();
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString();
}

function getPassTypeIdentifier(templateId) {
    const prefixes = {
        "1": "pass.com.wavex.gold",
        "2": "pass.com.wavex.platinum",
        "3": "pass.com.wavex.black",
        "4": "pass.com.wavex.eventbrite"
    };
    return prefixes[templateId] || "pass.com.wavex.default";
}

async function generateCompleteMetadata(templateId, tokenId, owner) {
    const config = templateConfigs[templateId];
    if (!config) {
        throw new Error(`Template ID ${templateId} not found`);
    }

    const validUntil = formatDate(config.validity);
    const createdAt = new Date().toISOString();

    const metadata = {
        name: `WaveX ${config.name} Card #${tokenId}`,
        description: `WaveX ${config.name} membership card with ${config.discount}% discount`,
        image: config.image,
        attributes: [
            {
                trait_type: "Token ID",
                value: tokenId.toString()
            },
            {
                trait_type: "Template",
                value: config.name
            },
            {
                trait_type: "Balance",
                value: `$${config.baseBalance} USD`
            },
            {
                trait_type: "Discount",
                value: `${config.discount}%`
            },
            {
                trait_type: "VIP Status",
                value: config.isVIP ? "Yes" : "No"
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
                    tier: config.name,
                    benefits: config.benefits,
                    balance: config.baseBalance,
                    cardDesign: {
                        primaryColor: config.cardDesign.primaryColor,
                        textColor: config.cardDesign.textColor,
                        image: config.image
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
                foregroundColor: config.cardDesign.textColor,
                backgroundColor: config.cardDesign.primaryColor,
                storeCard: {
                    primaryFields: [
                        {
                            key: "balance",
                            label: "BALANCE",
                            value: config.baseBalance,
                            currencyCode: "USD"
                        }
                    ],
                    secondaryFields: [
                        {
                            key: "tier",
                            label: "TIER",
                            value: config.name
                        },
                        {
                            key: "discount",
                            label: "DISCOUNT",
                            value: `${config.discount}%`
                        }
                    ],
                    backFields: [
                        {
                            key: "validUntil",
                            label: "VALID UNTIL",
                            value: validUntil
                        },
                        ...config.benefits.map((benefit, index) => ({
                            key: `benefit${index}`,
                            label: "BENEFIT",
                            value: benefit
                        }))
                    ]
                }
            },
            prepaidCard: {
                baseBalance: config.baseBalance,
                price: config.price,
                discount: config.discount,
                isVIP: config.isVIP,
                validUntil: validUntil,
                style: {
                    colors: {
                        primary: config.cardDesign.primaryColor,
                        text: config.cardDesign.textColor
                    },
                    image: config.image
                },
                features: {
                    benefits: config.benefits,
                    transferable: true,
                    rechargeable: true,
                    upgradeable: templateId !== "3"
                }
            }
        }
    };

    return metadata;
}

async function main() {
    try {
        // Get the last minted token ID and template ID
        const tokenId = "1"; // Update with your token ID
        const templateId = "4"; // Your Eventbrite template
        const owner = "0xf383A56057374Ae7cb437D61cc86843855F0DdB5"; // Your wallet address

        console.log(`Generating metadata for Token #${tokenId} (Template: ${templateId})`);
        
        const metadata = await generateCompleteMetadata(templateId, tokenId, owner);
        
        // Save locally
        const outputDir = path.join(process.cwd(), "V2", "metadata", "nfts");
        fs.mkdirSync(outputDir, { recursive: true });
        const filePath = path.join(outputDir, `${tokenId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));

        // Upload to IPFS
        console.log('Uploading to IPFS...');
        const ipfsHash = await uploadToIPFS(metadata, `token-${tokenId}`);
        console.log(`✅ Metadata uploaded to IPFS: ipfs://${ipfsHash}`);
        
        return ipfsHash;
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