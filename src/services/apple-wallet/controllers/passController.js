const PassUpdateService = require('../PassUpdateService');
const DeviceRegistration = require('../models/DeviceRegistration');
const PassKit = require('passkit-generator');
const passKitConfig = require('../../../config/passkit');

class PassController {
    constructor(contract) {
        this.passUpdateService = new PassUpdateService(contract);
    }

    async registerDevice(req, res) {
        try {
            const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;
            const { pushToken } = req.body;

            const registration = new DeviceRegistration({
                deviceLibraryIdentifier,
                passTypeIdentifier,
                serialNumber,
                pushToken
            });

            await registration.save();
            res.sendStatus(201);
        } catch (error) {
            console.error('Error registering device:', error);
            res.status(500).json({ error: 'Failed to register device' });
        }
    }

    async unregisterDevice(req, res) {
        try {
            const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;

            await DeviceRegistration.findOneAndDelete({
                deviceLibraryIdentifier,
                passTypeIdentifier,
                serialNumber
            });

            res.sendStatus(200);
        } catch (error) {
            console.error('Error unregistering device:', error);
            res.status(500).json({ error: 'Failed to unregister device' });
        }
    }

    async getSerialNumbers(req, res) {
        try {
            const { deviceLibraryIdentifier, passTypeIdentifier } = req.params;
            const { passesUpdatedSince } = req.query;

            const query = {
                deviceLibraryIdentifier,
                passTypeIdentifier
            };

            if (passesUpdatedSince) {
                query.updatedAt = { $gt: new Date(passesUpdatedSince) };
            }

            const registrations = await DeviceRegistration.find(query);
            const serialNumbers = registrations.map(reg => reg.serialNumber);

            res.json({ serialNumbers, lastUpdated: new Date().toISOString() });
        } catch (error) {
            console.error('Error getting serial numbers:', error);
            res.status(500).json({ error: 'Failed to get serial numbers' });
        }
    }

    async getLatestPass(req, res) {
        try {
            const { passTypeIdentifier, serialNumber } = req.params;
            
            // Create new pass instance
            const pass = await PassKit.from({
                templatePath: `./certificates/${passTypeIdentifier}`,
                certificates: passKitConfig.certificates
            });

            // Get latest pass data
            const passData = await this.passUpdateService.getPassData(serialNumber);
            
            // Update pass with latest data
            Object.entries(passData).forEach(([key, value]) => {
                pass.primaryFields.push({ key, ...value });
            });

            // Send pass file
            const passBuffer = await pass.generate();
            res.type('application/vnd.apple.pkpass');
            res.send(passBuffer);
        } catch (error) {
            console.error('Error getting latest pass:', error);
            res.status(500).json({ error: 'Failed to get latest pass' });
        }
    }
}

module.exports = PassController;