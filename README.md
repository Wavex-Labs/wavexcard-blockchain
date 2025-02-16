# WaveX NFT V2

A comprehensive NFT system built on the Polygon network that introduces a balance-based membership system. The system enables seamless transactions and event access management through WaveX Balance.

## Project Structure

```
wavex-nft/
├── contracts/
│   ├── v2/
│   │   └── WaveXNFTV2.sol       # Main contract implementation
│   ├── interfaces/
│   │   └── IWaveXNFTV2.sol      # Contract interfaces
│   ├── libraries/
│   │   └── WaveXLib.sol         # Shared libraries
│   └── test/
│       └── MockERC20.sol        # Test helper contracts
├── scripts/
│   ├── balance/                 # Balance management scripts
│   │   ├── checkBalance.js      # Balance checking utilities
│   │   ├── processPayment.js    # Payment processing
│   │   ├── topUpBalance.js      # Balance top-up functionality
│   │   └── validateBalance.js   # Balance validation
│   ├── config/                  # Configuration scripts
│   │   ├── configValidator.js   # Configuration validation
│   │   └── metadataConfig.js    # Metadata configuration
│   ├── deploy/                  # Deployment scripts
│   │   ├── deployV2.js         # Main deployment script
│   │   ├── setupMerchants.js   # Merchant configuration
│   │   └── setupTokens.js      # Token setup
│   ├── events/                  # Event management scripts
│   │   ├── createEvent.js      # Event creation
│   │   ├── eventConfig.js      # Event configuration
│   │   ├── getEventDetails.js  # Event details retrieval
│   │   ├── listEvents.js       # Event listing
│   │   └── updateEvent.js      # Event updates
│   ├── merchants/              # Merchant management scripts
│   │   ├── addMerchant.js     # Merchant addition
│   │   ├── authorizeMerchants.js # Merchant authorization
│   │   └── manageMerchants.js  # Merchant management
│   ├── metadata/               # Metadata management scripts
│   │   ├── generateMetadata.js # Metadata generation
│   │   ├── updateMetadata.js   # Metadata updates
│   │   └── validateMetadata.js # Metadata validation
│   ├── mint/                   # NFT minting scripts
│   │   ├── batchMint.js       # Batch minting
│   │   ├── mintFromTemplate.js # Template-based minting
│   │   └── validateMint.js    # Minting validation
│   ├── templates/              # Template management scripts
│   │   ├── createTemplate.js   # Template creation
│   │   ├── getTemplate.js     # Template retrieval
│   │   ├── listTemplates.js   # Template listing
│   │   └── updateTemplate.js  # Template updates
│   ├── testing/               # Test utilities
│   │   ├── runTests.js       # Test runner
│   │   └── testConfig.js     # Test configuration
│   └── utils/                 # Utility scripts
│       ├── uploadToIPFS.js    # IPFS upload utilities
│       └── verifyContract.js  # Contract verification
├── test/
│   └── v2/
│       └── WaveXNFTV2.test.js   # Contract tests
├── config/
│   └── contract.config.js       # Contract configuration
└── deployments/                 # Deployment artifacts
```

## Features

- **WaveX Balance System** - **Implemented and Tested**
  - Built-in balance for each NFT
  - Top-up capability using USDT/USDC
  - Direct payment processing through authorized merchants
  - Transaction history tracking

- **Template-Based NFT System** - **Implemented and Tested**
  - Pre-defined templates (Gold, Platinum)
  - Customizable template properties
  - Template-specific initial balances and prices
  - VIP status management

- **Event Management** - **Implemented and Tested**
  - Event creation and management
  - Capacity tracking
  - Multiple event types
  - Event access validation

- **Merchant Integration** - **Implemented and Tested**
  - Authorized merchant system
  - Payment processing capabilities
  - Transaction history tracking
  - Merchant-specific metadata storage

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
npm test
```

## Deployment

1. Deploy to testnet (Polygon Amoy):
```bash
npm run deploy:testnet
```

2. Deploy to mainnet:
```bash
npm run deploy:mainnet
```

3. Verify contract:
```bash
npm run verify
```

4. Setup tokens and merchants:
```bash
npm run setup:tokens
npm run setup:merchants
```

### Deployment Workflow

The deployment process follows this sequence:

1. **Initial Deployment** (`scripts/deploy/deployV2.js`):
   - Validates deployment network and account
   - Creates contract factory
   - Deploys WaveXNFTV2 contract
   - Initializes default templates
   - Saves deployment information to `deployments/{network}_deployment.json`
   - Automatically verifies contract on block explorer
   - Outputs deployment summary including:
     - Network
     - Contract address
     - Token support status

2. **Token Setup** (`scripts/deploy/setupTokens.js`):
   - Configures supported tokens (USDT/USDC)
   - Sets up token addresses and parameters
   - Validates token contracts

3. **Merchant Setup** (`scripts/deploy/setupMerchants.js`):
   - Configures authorized merchants
   - Sets merchant permissions
   - Initializes merchant metadata

Each step creates its own logs and saves relevant information to the deployments directory for future reference.

## Development

### Available Scripts

- `npm run test` - Run all tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run compile` - Compile contracts
- `npm run deploy:testnet` - Deploy to Polygon Amoy testnet
- `npm run deploy:mainnet` - Deploy to Polygon mainnet
- `npm run verify` - Verify contract on Polygonscan
- `npm run setup:tokens` - Configure supported tokens
- `npm run setup:merchants` - Set up authorized merchants
- `npm run lint` - Run Solidity linter
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier

### Testing

The project includes **comprehensive tests for all major functionality**:

- Contract deployment
- Template management
- Token minting
- Balance operations
- Event management
- Merchant operations

Run specific test suites:
```bash
npx hardhat test test/v2/WaveXNFTV2.test.js
```

### Gas Optimization

The contract includes several gas optimization features:

- Efficient storage layout
- Batch operations where possible
- Library usage for common operations
- Optimized event emission

## Security Considerations

1. **Access Control**
   - Only authorized merchants can process payments
   - Only contract owner can create/modify templates
   - Event access is strictly validated

2. **Balance Management**
   - Double-spending prevention
   - Safe math operations
   - Balance validation before transactions

3. **Metadata Security**
   - IPFS integration for decentralized storage
   - Metadata validation and sanitization
   - Proper URI handling

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT

## Support

For technical support:
1. Check the documentation
2. Review test cases
3. Contact system administrators