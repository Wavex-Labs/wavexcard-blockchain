// scripts/events/listEvents.js terminal command: npx hardhat run scripts/events/listEvents.js --network polygonAmoy
require('dotenv').config();
const hre = require("hardhat"); // Import hre explicitly
const fs = require('fs').promises;
const path = require('path');
const { gasManager } = require('../utils/gasUtils');
const { getEventDetails } = require('./getEventDetails');

/**
 * Discover events from the contract by querying EventPurchased events
 */
async function discoverEvents(contract) {
    try {
        console.log("Discovering events from contract...");
        
        // Query EventPurchased events to discover event IDs
        const filter = contract.filters.EventPurchased();
        const events = await contract.queryFilter(filter);
        
        // Extract unique event IDs
        const eventIds = [...new Set(events.map(e => e.args.eventId.toString()))];
        console.log(`Discovered ${eventIds.length} events from contract history`);

        // Add manually configured event from .env if it exists
        if (process.env.GET_EVENT_ID) {
            const envEventId = process.env.GET_EVENT_ID;
            if (!eventIds.includes(envEventId)) {
                eventIds.push(envEventId);
                console.log(`Added configured event ID from .env: ${envEventId}`);
            }
        }

        return eventIds;
    } catch (error) {
        console.error("Error discovering events:", error);
        throw error;
    }
}

/**
 * Initialize or load tracking data with event discovery
 */
async function initializeTracking() {
    try {
        const eventsDir = path.join(process.cwd(), 'data/events');
        await fs.mkdir(eventsDir, { recursive: true });
        
        const trackingFile = path.join(eventsDir, 'events_tracking.json');
        let tracking;
        
        // Get contract instance
        const contract = await hre.ethers.getContractAt(
            "WaveXNFTV2",
            process.env.WAVEX_NFT_V2_ADDRESS
        );

        // Discover events from contract
        const discoveredEventIds = await discoverEvents(contract);
        
        try {
            const data = await fs.readFile(trackingFile, 'utf8');
            tracking = JSON.parse(data);
            // Merge discovered events with tracked events
            tracking.eventIds = [...new Set([...tracking.eventIds, ...discoveredEventIds])];
        } catch (error) {
            // Initialize new tracking with discovered events
            tracking = {
                lastUpdate: new Date().toISOString(),
                eventIds: discoveredEventIds,
                network: hre.network.name
            };
        }

        // Save updated tracking
        await fs.writeFile(trackingFile, JSON.stringify(tracking, null, 2));
        
        return tracking;
    } catch (error) {
        console.error("Error initializing tracking:", error);
        throw error;
    }
}

/**
 * Get detailed check-in analytics for an event
 */
async function getEventCheckInAnalytics(contract, eventId) {
    try {
        const filter = contract.filters.TransactionRecorded();
        const events = await contract.queryFilter(filter);
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

        const checkIns = events.filter(e => {
            try {
                const metadata = e.args.metadata || "";
                return metadata.includes(`EVENT_${eventId}_CHECKIN`);
            } catch {
                return false;
            }
        });

        const checkInsByTime = {};
        let lastCheckInTime = null;

        checkIns.forEach(event => {
            try {
                const timestamp = event.args.timestamp || currentTime;
                const hour = new Date(timestamp * 1000).getHours();
                checkInsByTime[hour] = (checkInsByTime[hour] || 0) + 1;
                
                if (!lastCheckInTime || timestamp > lastCheckInTime) {
                    lastCheckInTime = timestamp;
                }
            } catch (error) {
                console.warn(`Warning: Could not process check-in timestamp for event ${eventId}`);
            }
        });

        return {
            totalCheckIns: checkIns.length,
            checkInsByTime,
            lastCheckIn: lastCheckInTime ? new Date(lastCheckInTime * 1000).toISOString() : null
        };
    } catch (error) {
        console.warn(`Warning: Error getting check-in analytics for event ${eventId}:`, error.message);
        return {
            totalCheckIns: 0,
            checkInsByTime: {},
            lastCheckIn: null
        };
    }
}

/**
 * Get purchase analytics for an event
 */
async function getEventPurchaseAnalytics(contract, eventId) {
    try {
        const filter = contract.filters.EventPurchased(null, eventId);
        const purchases = await contract.queryFilter(filter);
        const currentTime = Math.floor(Date.now() / 1000);

        const purchasesByDate = {};
        const buyerSet = new Set();

        purchases.forEach(event => {
            try {
                const timestamp = event.args.timestamp || currentTime;
                const date = new Date(timestamp * 1000).toISOString().split('T')[0];
                purchasesByDate[date] = (purchasesByDate[date] || 0) + 1;
                
                if (event.args.tokenId) {
                    buyerSet.add(event.args.tokenId.toString());
                }
            } catch (error) {
                console.warn(`Warning: Could not process purchase timestamp for event ${eventId}`);
            }
        });

        return {
            totalPurchases: purchases.length,
            purchasesByDate,
            uniqueBuyers: buyerSet.size
        };
    } catch (error) {
        console.warn(`Warning: Error getting purchase analytics for event ${eventId}:`, error.message);
        return {
            totalPurchases: 0,
            purchasesByDate: {},
            uniqueBuyers: 0
        };
    }
}

async function listEvents(options = {}) {
    try {
        const contractAddress = process.env.WAVEX_NFT_V2_ADDRESS;
        if (!contractAddress) {
            throw new Error("Contract address not configured in .env");
        }

        console.log("Initializing contract and discovering events...");
        const contract = await hre.ethers.getContractAt("WaveXNFTV2", contractAddress);

        // Initialize tracking with event discovery
        const tracking = await initializeTracking();
        console.log(`Found ${tracking.eventIds.length} events to analyze`);

        // Get events
        const eventPromises = tracking.eventIds
            .filter(id => id) // Filter out null/undefined
            .map(async (id) => {
                try {
                    const eventDetails = await getEventDetails(id);
                    if (!eventDetails) return null;

                    // Get check-in and purchase analytics
                    const [checkInAnalytics, purchaseAnalytics] = await Promise.all([
                        getEventCheckInAnalytics(contract, id),
                        getEventPurchaseAnalytics(contract, id)
                    ]);

                    // Calculate event statistics
                    const capacity = parseInt(eventDetails.capacity);
                    const soldCount = parseInt(eventDetails.soldCount);
                    const checkInCount = checkInAnalytics.totalCheckIns;

                    return {
                        ...eventDetails,
                        analytics: {
                            capacity,
                            soldCount,
                            remainingCapacity: capacity - soldCount,
                            occupancyRate: ((soldCount / capacity) * 100).toFixed(2) + '%',
                            revenue: (soldCount * parseFloat(eventDetails.priceRaw)).toFixed(2),
                            checkIns: {
                                ...checkInAnalytics,
                                checkInRate: ((checkInCount / soldCount) * 100).toFixed(2) + '%',
                                noShows: soldCount - checkInCount
                            },
                            purchases: {
                                ...purchaseAnalytics,
                                averagePurchasePerBuyer: (soldCount / purchaseAnalytics.uniqueBuyers).toFixed(2)
                            },
                            status: {
                                isSoldOut: soldCount >= capacity,
                                isOngoing: checkInCount > 0 && checkInCount < soldCount,
                                isComplete: checkInCount >= soldCount
                            },
                            performance: {
                                saleVelocity: (soldCount / (Date.now() - new Date(tracking.lastUpdate).getTime())).toFixed(4),
                                expectedOccupancy: ((checkInCount / soldCount) * 100).toFixed(2) + '%'
                            }
                        }
                    };
                } catch (error) {
                    console.warn(`Failed to fetch details for event ${id}:`, error.message);
                    return null;
                }
            });

        let events = (await Promise.all(eventPromises)).filter(e => e !== null);

        // Apply filters
        if (options.activeOnly) {
            events = events.filter(e => e.active);
        }

        if (options.availableOnly) {
            events = events.filter(e => parseInt(e.remainingCapacity) > 0);
        }

        if (options.eventType) {
            events = events.filter(e => parseInt(e.eventType) === parseInt(options.eventType));
        }

        // Calculate aggregate statistics
        const aggregateStats = events.reduce((acc, event) => {
            acc.totalCapacity += event.analytics.capacity;
            acc.totalSold += event.analytics.soldCount;
            acc.totalRevenue += parseFloat(event.analytics.revenue);
            acc.totalCheckIns += event.analytics.checkIns.totalCheckIns;
            acc.totalNoShows += event.analytics.checkIns.noShows;
            return acc;
        }, {
            totalCapacity: 0,
            totalSold: 0,
            totalRevenue: 0,
            totalCheckIns: 0,
            totalNoShows: 0
        });

        // Sort and paginate
        events.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        const page = options.page || 1;
        const pageSize = options.pageSize || parseInt(process.env.DEFAULT_BATCH_SIZE) || 10;
        const paginatedEvents = events.slice((page - 1) * pageSize, page * pageSize);

        return {
            network: hre.network.name,
            contractAddress,
            events: paginatedEvents,
            pagination: {
                total: events.length,
                page,
                pageSize,
                totalPages: Math.ceil(events.length / pageSize)
            },
            aggregateStats: {
                ...aggregateStats,
                averageOccupancyRate: ((aggregateStats.totalSold / aggregateStats.totalCapacity) * 100).toFixed(2) + '%',
                averageCheckInRate: ((aggregateStats.totalCheckIns / aggregateStats.totalSold) * 100).toFixed(2) + '%',
                averageNoShowRate: ((aggregateStats.totalNoShows / aggregateStats.totalSold) * 100).toFixed(2) + '%'
            },
            lastUpdate: new Date().toISOString()
        };

    } catch (error) {
        console.error("Error listing events:", error);
        throw error;
    }
}

// Add this at the end of the file
if (require.main === module) {
    // Default options with values from .env
    const options = {
        activeOnly: true,
        availableOnly: true,
        eventType: process.env.EVENT_TYPE_BRUNCH ? parseInt(process.env.EVENT_TYPE_BRUNCH) : undefined,
        page: 1,
        pageSize: parseInt(process.env.DEFAULT_BATCH_SIZE) || 10
    };

    console.log("Starting event listing with options:", options);

    listEvents(options)
        .then(result => {
            console.log("\n=== Event Listing Summary ===");
            console.log(`Network: ${result.network}`);
            console.log(`Contract: ${result.contractAddress}`);
            console.log(`Total Events: ${result.pagination.total}`);
            console.log("\n=== Aggregate Statistics ===");
            console.log(JSON.stringify(result.aggregateStats, null, 2));

            console.log("\n=== Events Detail ===");
            result.events.forEach((event, index) => {
                console.log(`\nEvent ${index + 1}: ${event.name}`);
                console.log("Basic Info:");
                console.log(`- ID: ${event.id}`);
                console.log(`- Type: ${event.typeLabel}`);
                console.log(`- Price: ${event.price}`);
                console.log(`- Status: ${event.status}`);

                console.log("\nAnalytics:");
                console.log(`- Capacity: ${event.analytics.capacity}`);
                console.log(`- Sold: ${event.analytics.soldCount}`);
                console.log(`- Remaining: ${event.analytics.remainingCapacity}`);
                console.log(`- Occupancy Rate: ${event.analytics.occupancyRate}`);
                console.log(`- Revenue: $${event.analytics.revenue}`);

                console.log("\nCheck-ins:");
                console.log(`- Total Check-ins: ${event.analytics.checkIns.totalCheckIns}`);
                console.log(`- Check-in Rate: ${event.analytics.checkIns.checkInRate}`);
                console.log(`- No Shows: ${event.analytics.checkIns.noShows}`);

                console.log("\nPurchases:");
                console.log(`- Unique Buyers: ${event.analytics.purchases.uniqueBuyers}`);
                console.log(`- Avg per Buyer: ${event.analytics.purchases.averagePurchasePerBuyer}`);

                if (event.analytics.purchases.purchasesByDate) {
                    console.log("\nPurchase Timeline:");
                    Object.entries(event.analytics.purchases.purchasesByDate)
                        .forEach(([date, count]) => {
                            console.log(`  ${date}: ${count} tickets`);
                        });
                }
            });

            console.log("\n=== Pagination Info ===");
            console.log(`Page ${result.pagination.page} of ${result.pagination.totalPages}`);
            console.log(`Showing ${result.events.length} of ${result.pagination.total} events`);
            console.log(`Last Updated: ${result.lastUpdate}`);
        })
        .catch(error => {
            console.error("Failed to list events:", error);
            process.exit(1);
        });
}

module.exports = { listEvents };