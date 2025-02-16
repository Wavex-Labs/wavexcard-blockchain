# WaveX NFT V2 Deployment Guide

## Prerequisites

1. **Hardhat Setup**: Ensure you have Hardhat development environment set up. Follow the [Hardhat documentation](https://hardhat.org/hardhat-runner/docs/getting-started) for installation and setup instructions.
2. **Node.js and npm**: Make sure you have Node.js and npm installed.
3. **Environment Variables**: Set the following environment variables in a `.env` file in the project root:
    - `PRIVATE_KEY`: Private key of the deployer account.
    - `ALCHEMY_API_KEY`: Alchemy API key for Polygon networks.
    - `POLYGONSCAN_API_KEY`: Polygonscan API key for contract verification.

## Deployment Steps

1. **Clone the repository**: 
   ```bash
   git clone <repository-url>
   cd wavex-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Network**: 
   - Edit `hardhat.config.js` to configure network settings (RPC URLs, accounts, chain IDs) for желаемый deployment network (e.g., Polygon Amoy, Polygon Mainnet).
   - Ensure the correct network configuration is selected in the deployment script.

4. **Run Deployment Script**:
   - Use the `deployV2.js` script to deploy the `WaveXNFTV2` contract.
   - For Polygon Amoy testnet:
     ```bash
     npx hardhat run scripts/deploy/deployV2.js --network polygonAmoy
     ```
   - For Polygon Mainnet:
     ```bash
     npx hardhat run scripts/deploy/deployV2.js --network polygon
     ```
   - The script will output the deployed contract address and deployment details.

## Contract Verification

1. **Verify Contract on Polygonscan**:
   - Use the `verifyContract.js` script to verify the deployed contract on Polygonscan.
   - Replace `<contract-address>` with the deployed contract address from the previous step.
   - For Polygon Amoy testnet:
     ```bash
     npx hardhat run scripts/deploy/verifyContract.js --network polygonAmoy --contract <contract-address>
     ```
   - For Polygon Mainnet:
     ```bash
     npx hardhat run scripts/deploy/verifyContract.js --network polygon --contract <contract-address>
     ```
   - Ensure `POLYGONSCAN_API_KEY` is correctly set in environment variables.

## Post-Deployment Setup

1. **Initialize Default Templates**:
   - After deployment, call the `initializeDefaultTemplates()` function of the deployed contract using the owner account to initialize the default templates (Gold and Platinum).
   - This can be done using a script or directly interacting with the contract on Polygonscan or using Hardhat console.

2. **Setup Supported Tokens and Merchants**:
   - Use scripts in `scripts/deploy/` directory (`setupTokens.js`, `setupMerchants.js`) to setup supported tokens (USDT, USDC) and authorize merchants as needed.
   - Example:
     ```bash
     npx hardhat run scripts/deploy/setupTokens.js --network polygonAmoy
     npx hardhat run scripts/deploy/setupMerchants.js --network polygonAmoy
     ```

## Network Configurations

- **Polygon Amoy Testnet**:
    - Network Name: `polygonAmoy`
    - RPC URL: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}` (or other RPC provider)
    - Chain ID: `80002`
    - Block Explorer: `https://amoy.polygonscan.com/`

- **Polygon Mainnet**:
    - Network Name: `polygon`
    - RPC URL: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}` (or other RPC provider)
    - Chain ID: `137`
    - Block Explorer: `https://polygonscan.com/`

**Note**: Replace placeholders like `<repository-url>` and `<contract-address>` with actual values.