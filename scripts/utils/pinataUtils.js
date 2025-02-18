// scripts/utils/pinataUtils.js
require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const { EVENT_TYPES } = require('../../config/eventConfig');

class PinataManager {
    constructor() {
        this.apiKey = process.env.PINATA_API_KEY;
        this.apiSecret = process.env.PINATA_API_SECRET;
        this.jwt = process.env.PINATA_JWT;
        this.baseURL = 'https://api.pinata.cloud';
    }

    async testAuthentication() {
        try {
            const response = await axios.get(`${this.baseURL}/data/testAuthentication`, {
                headers: {
                    'Authorization': `Bearer ${this.jwt}`
                }
            });
            console.log('Pinata authentication successful');
            return true;
        } catch (error) {
            console.error('Pinata authentication failed:', error.message);
            throw new Error('Pinata authentication failed');
        }
    }

    async uploadJSON(jsonData, name) {
        try {
            // Ensure the data is properly formatted
            const processedData = typeof jsonData === 'string' 
                ? JSON.parse(jsonData) 
                : jsonData;

            const payload = {
                pinataContent: processedData,
                pinataMetadata: {
                    name: `wavex-${name}`
                },
                pinataOptions: {
                    cidVersion: 1
                }
            };

            console.log('Uploading to Pinata:', {
                name: payload.pinataMetadata.name,
                contentType: typeof processedData
            });

            const response = await axios.post(
                `${this.baseURL}/pinning/pinJSONToIPFS`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.jwt}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Upload successful:', response.data.IpfsHash);
            return response.data.IpfsHash;
        } catch (error) {
            console.error('Upload failed:', error.message);
            throw new Error(`Failed to upload to IPFS: ${error.message}`);
        }
    }

    getIPFSUrl(hash) {
        return `ipfs://${hash}`;
    }

    getGatewayUrl(hash) {
        return `https://gateway.pinata.cloud/ipfs/${hash}`;
    }
}

async function uploadToIPFS(data, filename = `event-${Date.now()}`) {
    try {
        const pinata = new PinataManager();
        await pinata.testAuthentication();

        // Handle the data appropriately based on its type
        const processedData = typeof data === 'string' 
            ? JSON.parse(data) 
            : data;

        console.log('Preparing to upload:', {
            filename,
            dataType: typeof processedData
        });

        const hash = await pinata.uploadJSON(processedData, filename);
        
        console.log('IPFS upload complete:', {
            hash,
            filename
        });

        return hash;
    } catch (error) {
        console.error('IPFS upload failed:', error.message);
        throw new Error(`IPFS upload failed: ${error.message}`);
    }
}

// Helper function to validate JSON
function validateJSON(data) {
    try {
        return typeof data === 'string' 
            ? JSON.parse(data) 
            : JSON.parse(JSON.stringify(data));
    } catch (error) {
        throw new Error(`Invalid JSON format: ${error.message}`);
    }
}

module.exports = {
    PinataManager,
    uploadToIPFS,
    validateJSON
};