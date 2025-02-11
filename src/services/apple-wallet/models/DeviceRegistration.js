const mongoose = require('mongoose');

const deviceRegistrationSchema = new mongoose.Schema({
    deviceLibraryIdentifier: {
        type: String,
        required: true,
        index: true
    },
    passTypeIdentifier: {
        type: String,
        required: true,
        index: true
    },
    serialNumber: {
        type: String,
        required: true,
        index: true
    },
    pushToken: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Compound index for faster queries
deviceRegistrationSchema.index({
    deviceLibraryIdentifier: 1,
    passTypeIdentifier: 1,
    serialNumber: 1
}, { unique: true });

module.exports = mongoose.model('DeviceRegistration', deviceRegistrationSchema);