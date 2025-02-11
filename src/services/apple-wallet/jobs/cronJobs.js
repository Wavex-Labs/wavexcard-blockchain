const cron = require('node-cron');
const PassUpdateService = require('../PassUpdateService');
const DeviceRegistration = require('../models/DeviceRegistration');

class PassUpdateJobs {
    constructor(contract) {
        this.passUpdateService = new PassUpdateService(contract);
    }

    // Run daily cleanup of expired registrations
    startCleanupJob() {
        cron.schedule('0 0 * * *', async () => {
            try {
                console.log('Running daily cleanup of expired registrations...');
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const result = await DeviceRegistration.deleteMany({
                    lastUpdated: { $lt: thirtyDaysAgo }
                });

                console.log(`Cleaned up ${result.deletedCount} expired registrations`);
            } catch (error) {
                console.error('Error in cleanup job:', error);
            }
        });
    }

    // Run hourly balance sync
    startBalanceUpdateJob() {
        cron.schedule('0 * * * *', async () => {
            try {
                console.log('Running hourly balance sync...');
                const registrations = await DeviceRegistration.find({});

                for (const registration of registrations) {
                    try {
                        const tokenId = registration.serialNumber.replace('TOKEN-', '');
                        await this.passUpdateService.syncPassBalance(tokenId);
                    } catch (error) {
                        console.error(`Error syncing balance for token ${registration.serialNumber}:`, error);
                    }
                }

                console.log('Balance sync completed');
            } catch (error) {
                console.error('Error in balance update job:', error);
            }
        });
    }

    // Initialize all cron jobs
    initializeJobs() {
        this.startCleanupJob();
        this.startBalanceUpdateJob();
        console.log('Cron jobs initialized');
    }
}

module.exports = PassUpdateJobs;