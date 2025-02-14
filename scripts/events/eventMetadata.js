// scripts/events/eventMetadata.js
require('dotenv').config();
const { EVENT_TYPES, EVENT_CONFIG } = require('../../config/eventConfig');
const { PinataManager } = require('../utils/pinataUtils');
const { gasManager } = require('../utils/gasUtils');
const path = require('path');
const fs = require('fs').promises;

// Environment-driven configuration
const METADATA_CONFIG = {
    basePath: process.env.METADATA_BASE_PATH || 'data/metadata',
    defaultImage: process.env.DEFAULT_EVENT_IMAGE || "ipfs://QmDefaultEventImageHash",
    defaultDescription: process.env.DEFAULT_EVENT_DESCRIPTION || "A WaveX Event",
    requiredFields: ['name', 'description', 'image'],
    requiredAttributes: ['Type', 'Capacity', 'Price']
};

/**
 * Validates event metadata structure
 * @param {Object} metadata The metadata object to validate
 * @throws {Error} If metadata is invalid
 */
function validateEventMetadata(metadata) {
    const missingFields = METADATA_CONFIG.requiredFields.filter(field => !metadata[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required metadata fields: ${missingFields.join(', ')}`);
    }

    if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
        throw new Error('Metadata must include attributes array');
    }

    const attributeTypes = metadata.attributes.map(attr => attr.trait_type);
    const missingAttributes = METADATA_CONFIG.requiredAttributes.filter(
        attr => !attributeTypes.includes(attr)
    );

    if (missingAttributes.length > 0) {
        throw new Error(`Missing required attributes: ${missingAttributes.join(', ')}`);
    }
}

/**
 * Generates metadata for an event
 * @param {Object} event Event details
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Generated metadata
 */
async function generateEventMetadata(event, options = {}) {
    const metadata = {
        name: event.name,
        description: options.description || `${event.name} - ${METADATA_CONFIG.defaultDescription}`,
        image: options.image || METADATA_CONFIG.defaultImage,
        attributes: [
            {
                trait_type: "Type",
                value: Object.keys(EVENT_TYPES)[event.eventType] || 'STANDARD'
            },
            {
                trait_type: "Capacity",
                value: event.capacity.toString()
            },
            {
                trait_type: "Price",
                value: `$${event.price.toString()} USD`
            },
            {
                trait_type: "Status",
                value: event.active ? "Active" : "Inactive"
            },
            ...(options.attributes || [])
        ],
        properties: {
            eventId: event.id,
            createdAt: new Date().toISOString(),
            network: process.env.NETWORK || 'polygonAmoy',
            contractAddress: process.env.WAVEX_NFT_V2_ADDRESS,
            ...(options.properties || {})
        }
    };

    validateEventMetadata(metadata);
    return metadata;
}

/**
 * Saves event metadata to local storage and IPFS
 * @param {string|number} eventId Event ID
 * @param {Object} metadata Event metadata
 * @returns {Promise<string>} IPFS URI of uploaded metadata
 */
async function saveEventMetadata(eventId, metadata) {
    try {
        validateEventMetadata(metadata);

        // Initialize Pinata
        const pinata = new PinataManager();
        await pinata.testAuthentication();

        // Ensure metadata directory exists
        const metadataDir = path.join(process.cwd(), METADATA_CONFIG.basePath);
        await fs.mkdir(metadataDir, { recursive: true });

        // Save metadata locally
        const localPath = path.join(metadataDir, `${eventId}.json`);
        await fs.writeFile(localPath, JSON.stringify(metadata, null, 2));

        // Upload to IPFS with retry logic
        const fileName = `event-${eventId}-${Date.now()}`;
        const ipfsHash = await pinata.uploadJSON(metadata, fileName);

        console.log(`Metadata saved for event ${eventId}:
        Local: ${localPath}
        IPFS: ${ipfsHash}
        Gateway: ${pinata.getGatewayUrl(ipfsHash)}`);

        return ipfsHash;
    } catch (error) {
        console.error("Error saving event metadata:", error);
        throw error;
    }
}

/**
 * Updates existing event metadata
 * @param {string|number} eventId Event ID
 * @param {Object} updates Metadata updates
 * @returns {Promise<string>} New IPFS URI
 */
async function updateEventMetadata(eventId, updates) {
    try {
        const metadataPath = path.join(
            process.cwd(),
            METADATA_CONFIG.basePath,
            `${eventId}.json`
        );
        
        let existingMetadata;
        try {
            const data = await fs.readFile(metadataPath, 'utf8');
            existingMetadata = JSON.parse(data);
        } catch (error) {
            console.warn(`No existing metadata found for event ${eventId}, creating new`);
            existingMetadata = {};
        }

        const updatedMetadata = {
            ...existingMetadata,
            ...updates,
            attributes: [
                ...(existingMetadata.attributes || []).filter(
                    attr => !updates.attributes?.some(
                        newAttr => newAttr.trait_type === attr.trait_type
                    )
                ),
                ...(updates.attributes || [])
            ],
            properties: {
                ...existingMetadata.properties,
                ...updates.properties,
                updatedAt: new Date().toISOString(),
                lastUpdateTx: process.env.LAST_TRANSACTION_HASH
            }
        };

        return await saveEventMetadata(eventId, updatedMetadata);
    } catch (error) {
        console.error("Error updating event metadata:", error);
        throw error;
    }
}

// Add main execution for CLI usage
if (require.main === module) {
    const command = process.argv[2];
    const eventId = process.argv[3];
    
    if (!command || !eventId) {
        console.log(`
Usage: 
  node eventMetadata.js generate <eventId> [options]
  node eventMetadata.js update <eventId> [updates]
        `);
        process.exit(1);
    }

    const actions = {
        generate: generateEventMetadata,
        update: updateEventMetadata
    };

    if (actions[command]) {
        actions[command](eventId, JSON.parse(process.argv[4] || '{}'))
            .then(result => {
                console.log(JSON.stringify(result, null, 2));
                process.exit(0);
            })
            .catch(error => {
                console.error(error);
                process.exit(1);
            });
    }
}

module.exports = {
    generateEventMetadata,
    validateEventMetadata,
    saveEventMetadata,
    updateEventMetadata,
    METADATA_CONFIG
};