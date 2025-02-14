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
            await axios.get(`${this.baseURL}/data/testAuthentication`, {
                headers: {
                    'Authorization': `Bearer ${this.jwt}`
                }
            });
            return true;
        } catch (error) {
            throw new Error('Pinata authentication failed');
        }
    }

    async uploadJSON(jsonData, name) {
        try {
            const response = await axios.post(
                `${this.baseURL}/pinning/pinJSONToIPFS`,
                {
                    pinataContent: jsonData,
                    pinataMetadata: {
                        name: `wavex-${name}`
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.jwt}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data.IpfsHash;
        } catch (error) {
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

async function uploadToIPFS(data) {
    const pinata = new PinataManager();
    await pinata.testAuthentication();
    return await pinata.uploadJSON(JSON.parse(data), `event-${Date.now()}`);
}

module.exports = {
    PinataManager,
    uploadToIPFS
};