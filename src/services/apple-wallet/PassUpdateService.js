const PassKit = require('passkit-generator');
const DeviceRegistration = require('./models/DeviceRegistration');
const PassUpdate = require('./models/PassUpdate');
const passKitConfig = require('../../config/passkit');
const { ethers } = require('ethers');

class PassUpdateService {
    constructor(contract) {
        this.contract = contract;
        this.initialize();
    }

    async initialize() {
        // Initialize event listeners
        this.contract.on("BalanceUpdated", this.handleBalanceUpdate.bind(this));
        this.contract.on("TransactionRecorded", this.handleTransactionUpdate.bind(this));
        this.contract.on("EventPurchased", this.handleEventUpdate.bind(this));
    }

    async handleBalanceUpdate(tokenId, newBalance, updateType) {
        try {
            const serialNumber = `TOKEN-${tokenId}`;
            const formattedBalance = ethers.utils.formatEther(newBalance);
            
            await this.updatePass(serialNumber, {
                balance: {
                    value: formattedBalance,
                    changeMessage: `Balance ${updateType}: %@`
                }
            });
        } catch (error) {
            console.error('Error handling balance update:', error);
        }
    }

    async handleTransactionUpdate(tokenId, transactionType, amount) {
        try {
            const serialNumber = `TOKEN-${tokenId}`;
            const formattedAmount = ethers.utils.formatEther(amount);

            await this.updatePass(serialNumber, {
                lastTransaction: {
                    value: formattedAmount,
                    changeMessage: `${transactionType}: %@`
                }
            });
        } catch (error) {
            console.error('Error handling transaction update:', error);
        }
    }

    async handleEventUpdate(tokenId, eventId) {
        try {
            const serialNumber = `TOKEN-${tokenId}`;
            const eventDetails = await this.contract.events(eventId);

            await this.updatePass(serialNumber, {
                nextEvent: {
                    value: eventDetails.name,
                    dateStyle: "PKDateStyleFull"
                }
            });
        } catch (error) {
            console.error('Error handling event update:', error);
        }
    }

    async updatePass(serialNumber, updates) {
        try {
            // Get registered devices for this pass
            const devices = await DeviceRegistration.find({ serialNumber });
            
            // Create pass update
            const passUpdate = new PassUpdate({
                serialNumber,
                ...updates,
                updatedAt: new Date()
            });
            await passUpdate.save();

            // Push updates to all registered devices
            for (const device of devices) {
                await this.pushUpdate(device, updates);
            }
        } catch (error) {
            console.error('Error updating pass:', error);
            throw error;
        }
    }

    async pushUpdate(device, updates) {
        try {
            const pass = await PassKit.from({
                templatePath: `./certificates/${device.passTypeIdentifier}`,
                certificates: {
                    wwdr: passKitConfig.certificates.wwdr,
                    signerCert: passKitConfig.certificates.signerCert,
                    signerKey: passKitConfig.certificates.signerKey,
                    signerKeyPassphrase: passKitConfig.certificates.signerKeyPassphrase
                }
            });

            // Apply updates
            Object.entries(updates).forEach(([key, value]) => {
                pass.primaryFields.push({ key, ...value });
            });

            // Push to device
            await pass.push(device.pushToken);
        } catch (error) {
            console.error('Error pushing update:', error);
            throw error;
        }
    }
}

module.exports = PassUpdateService;