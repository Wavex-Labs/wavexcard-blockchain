require('dotenv').config();
const hre = require("hardhat");
const { isAddress } = require('ethers');
const path = require('path');
const fs = require('fs');
const { gasManager } = require('../utils/gasUtils');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

function validateEnvVariables() {
    const required = [
        'WAVEX_NFT_V3_ADDRESS',
        'VALIDATE_TOKEN_ID'
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

async function validateMint() {
    try {
        validateEnvVariables();

        const tokenId = process.env.VALIDATE_TOKEN_ID;
        const validationResults = {
            tokenId,
            valid: true,
            onChainData: {},
            errors: [],
            metadata: {
                onChain: null,
                local: null,
                comparison: {
                    matches: false,
                    differences: []
                }
            }
        };

        // Get contract instance
        const contractAddress = process.env.WAVEX_NFT_V3_ADDRESS;
        if (!isAddress(contractAddress)) {
            throw new Error('Invalid contract address in environment variables');
        }

        const WaveXNFT = await hre.ethers.getContractFactory("WaveXNFTV3");
        const wavexNFT = WaveXNFT.attach(contractAddress);

        // Get token data
        try {
            const [owner, balance, uri] = await Promise.all([
                wavexNFT.ownerOf(tokenId).catch(() => null),
                wavexNFT.tokenBalance(tokenId),
                wavexNFT.tokenURI(tokenId)
            ]);

            validationResults.onChainData.token = {
                exists: owner !== null,
                owner: owner || null,
                balance: balance ? balance.toString() : null,
                uri
            };

            if (!owner) {
                validationResults.valid = false;
                validationResults.errors.push(`Token ${tokenId} does not exist`);
                return validationResults;
            }

            // Get template information
            try {
                const templateCount = await wavexNFT.getTemplateCount();
                let templateFound = false;
                
                for (let i = 1; i <= templateCount; i++) {
                    const template = await wavexNFT.getTemplate(i);
                    if (template && template[6] !== undefined) { // Check if active exists
                        validationResults.onChainData.template = {
                            id: i.toString(),
                            name: template[0],
                            baseBalance: template[1].toString(),
                            price: template[2].toString(),
                            discount: template[3].toString(),
                            isVIP: template[4],
                            metadataURI: template[5],
                            active: template[6]
                        };
                        templateFound = true;
                        break;
                    }
                }

                if (!templateFound) {
                    validationResults.errors.push("Template not found");
                }
            } catch (error) {
                console.error("Error fetching template:", error);
                validationResults.errors.push("Could not fetch template information");
            }

        } catch (error) {
            validationResults.valid = false;
            validationResults.errors.push(`Error fetching token data: ${error.message}`);
            return validationResults;
        }

        // Get contract status
        try {
            const [paused, owner] = await Promise.all([
                wavexNFT.paused(),
                wavexNFT.owner()
            ]);

            validationResults.onChainData.contract = {
                address: contractAddress,
                paused,
                owner
            };

            if (paused) {
                validationResults.valid = false;
                validationResults.errors.push("Contract is paused");
            }
        } catch (error) {
            validationResults.errors.push("Could not fetch contract status");
            console.error("Contract status error:", error);
        }

        // Get and compare metadata
        try {
            // Get on-chain metadata
            if (validationResults.onChainData.token.uri) {
                const tokenURI = validationResults.onChainData.token.uri;
                if (tokenURI.startsWith('ipfs://')) {
                    const ipfsHash = tokenURI.replace('ipfs://', '');
                    const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
                    const metadata = await response.json();
                    validationResults.metadata.onChain = metadata;
                }
            }

            // Get local metadata
            const localMetadataPath = path.join(process.cwd(), "metadata", "nfts", `${tokenId}.json`);
            if (fs.existsSync(localMetadataPath)) {
                const localMetadata = JSON.parse(fs.readFileSync(localMetadataPath, 'utf8'));
                validationResults.metadata.local = localMetadata;

                // Compare metadata
                if (validationResults.metadata.onChain) {
                    const differences = compareMetadata(
                        validationResults.metadata.onChain,
                        validationResults.metadata.local
                    );

                    validationResults.metadata.comparison = {
                        matches: differences.length === 0,
                        differences
                    };

                    if (differences.length > 0) {
                        validationResults.valid = false;
                        validationResults.errors.push("Metadata mismatch between on-chain and local");
                    }
                }
            }
        } catch (error) {
            validationResults.errors.push("Error comparing metadata");
            console.error("Metadata comparison error:", error);
        }

        return validationResults;
    } catch (error) {
        console.error("Error validating token:", error);
        throw error;
    }
}

function compareMetadata(onChain, local) {
    const differences = [];

    // Compare basic fields
    const fieldsToCompare = ['name', 'description', 'image'];
    fieldsToCompare.forEach(field => {
        if (onChain[field] !== local[field]) {
            differences.push({
                field,
                onChain: onChain[field],
                local: local[field]
            });
        }
    });

    // Compare attributes
    if (onChain.attributes && local.attributes) {
        onChain.attributes.forEach((attr, index) => {
            const localAttr = local.attributes.find(a => a.trait_type === attr.trait_type);
            if (!localAttr || localAttr.value !== attr.value) {
                differences.push({
                    field: `attributes[${index}]`,
                    trait: attr.trait_type,
                    onChain: attr.value,
                    local: localAttr ? localAttr.value : 'missing'
                });
            }
        });
    }

    return differences;
}

async function main() {
    try {
        const results = await validateMint();
        // Pretty print the results with proper formatting
        console.log(JSON.stringify(results, null, 2));
        
        // If there are differences, highlight them specifically
        if (results.metadata.comparison && results.metadata.comparison.differences.length > 0) {
            console.log('\nMetadata Differences Found:');
            results.metadata.comparison.differences.forEach(diff => {
                console.log(`\nField: ${diff.field}`);
                console.log(`On-chain: ${diff.onChain}`);
                console.log(`Local   : ${diff.local}`);
            });
        }
    } catch (error) {
        console.error("Validation failed:", error);
        process.exit(1);
    }
}

// Execute the script
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    validateMint,
    compareMetadata
};