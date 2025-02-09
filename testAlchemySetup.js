const ethers = require('ethers');
const { alchemy, provider, wallet, testConnection } = require('../utils/alchemy_utils');

async function testAlchemySetup() {
    try {
        console.log('\n=== Testing Alchemy Setup ===\n');

        // Test 1: Check provider connection
        console.log('1. Testing provider connection...');
        try {
            const network = await provider.getNetwork();
            console.log('✓ Successfully connected to network');
            console.log('Network details:', {
                name: network.name,
                chainId: network.chainId
            });

            const blockNumber = await provider.getBlockNumber();
            console.log('Current block number:', blockNumber);
        } catch (error) {
            console.error('✗ Provider connection failed:', error.message);
            if (error.code === 'NETWORK_ERROR') {
                console.log('\nTroubleshooting steps:');
                console.log('1. Verify your internet connection');
                console.log('2. Check if the Alchemy API key is correct');
                console.log('3. Ensure the Mumbai testnet is available');
            }
            throw error;
        }

        // Test 2: Check Alchemy SDK
        console.log('\n2. Testing Alchemy SDK...');
        try {
            const blockNumber = await alchemy.core.getBlockNumber();
            console.log('✓ Successfully connected to Alchemy SDK');
            console.log(`Current block number: ${blockNumber}`);
        } catch (error) {
            console.error('✗ Failed to connect to Alchemy SDK:', error.message);
            throw error;
        }

        // Test 3: Check wallet setup
        console.log('\n3. Testing wallet setup...');
        try {
            console.log('Wallet address:', wallet.address);
            if (!process.env.PRIVATE_KEY) {
                console.log('⚠ No private key found in .env file');
                console.log('Only read operations will be available');
            } else {
                console.log('✓ Wallet configured with private key');
                const balance = await provider.getBalance(wallet.address);
                console.log(`Balance: ${ethers.utils.formatEther(balance)} MATIC`);
            }
        } catch (error) {
            console.error('✗ Failed to setup wallet:', error.message);
            throw error;
        }

        // Test 4: Check network details
        console.log('\n4. Testing network details...');
        try {
            const network = await provider.getNetwork();
            console.log('✓ Successfully retrieved network details');
            console.log('Network:', {
                name: network.name,
                chainId: network.chainId
            });

            // Verify we're on Mumbai testnet
            if (network.chainId !== 80001) {
                console.warn('⚠ Warning: Not connected to Mumbai testnet');
                console.warn('Expected chainId: 80001, Got:', network.chainId);
            } else {
                console.log('✓ Confirmed Mumbai testnet connection');
            }
        } catch (error) {
            console.error('✗ Failed to get network details:', error.message);
            throw error;
        }

        // Test 5: Check gas price
        console.log('\n5. Testing gas price retrieval...');
        try {
            const gasPrice = await provider.getGasPrice();
            console.log('✓ Successfully retrieved gas price');
            console.log(`Current gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
        } catch (error) {
            console.error('✗ Failed to get gas price:', error.message);
            throw error;
        }

        console.log('\n=== Test Summary ===');
        console.log('✓ Provider connection: OK');
        console.log('✓ Alchemy SDK: OK');
        console.log(`${process.env.PRIVATE_KEY ? '✓' : '⚠'} Wallet setup: ${process.env.PRIVATE_KEY ? 'OK' : 'Read-only'}`);
        console.log('✓ Network details: OK');
        console.log('✓ Gas price: OK');

        if (!process.env.PRIVATE_KEY) {
            console.log('\n⚠ Action Required:');
            console.log('To enable full functionality, please add your private key to the .env file:');
            console.log('PRIVATE_KEY=your_private_key_here\n');
        }

    } catch (error) {
        console.error('\n=== Test Failed ===');
        console.error('Error details:');
        console.error('- Message:', error.message);
        if (error.code) console.error('- Code:', error.code);
        if (error.reason) console.error('- Reason:', error.reason);
        if (error.stack) console.error('- Stack:', error.stack);

        console.log('\nTroubleshooting steps:');
        console.log('1. Check your internet connection');
        console.log('2. Verify your Alchemy API key');
        console.log('3. Ensure the Mumbai testnet is accessible');
        console.log('4. Check the RPC endpoint URL');
        throw error;
    }
}

// Run test if called directly
if (require.main === module) {
    console.log('Starting Alchemy setup test...');
    testAlchemySetup()
        .then(() => {
            console.log('\nTest completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\nTest failed:', error);
            process.exit(1);
        });
}

module.exports = { testAlchemySetup };