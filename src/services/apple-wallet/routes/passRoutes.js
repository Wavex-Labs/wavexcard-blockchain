const express = require('express');
const router = express.Router();
const PassController = require('../controllers/passController');

module.exports = (contract) => {
    const passController = new PassController(contract);

    // Register a device to receive push notifications for a pass
    router.post('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
        (req, res) => passController.registerDevice(req, res));

    // Unregister a device
    router.delete('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
        (req, res) => passController.unregisterDevice(req, res));

    // Get serial numbers of passes that need update
    router.get('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier',
        (req, res) => passController.getSerialNumbers(req, res));

    // Get latest version of a pass
    router.get('/v1/passes/:passTypeIdentifier/:serialNumber',
        (req, res) => passController.getLatestPass(req, res));

    return router;
};