const mongoose = require('mongoose');

const passUpdateSchema = new mongoose.Schema({
    serialNumber: {
        type: String,
        required: true,
        index: true
    },
    balance: {
        type: String,
        required: true
    },
    lastTransaction: {
        amount: String,
        type: String,
        timestamp: Date
    },
    events: [{
        eventId: String,
        name: String,
        date: Date,
        venue: String
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PassUpdate', passUpdateSchema);