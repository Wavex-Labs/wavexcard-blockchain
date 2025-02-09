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
│   ├── deploy/
│   │   ├── deployV2.js          # Main deployment script
│   │   ├── setupMerchants.js    # Merchant configuration
│   │   └── setupTokens.js       # Token setup
│   ├── templates/              # Template management scripts
│   ├── events/                 # Event management scripts
│   ├── mint/                  # NFT minting scripts
│   ├── balance/               # Balance management scripts
│   └── metadata/              # Metadata management scripts
├── test/
│   └── v2/
│       └── WaveXNFTV2.test.js   # Contract tests
├── config/
│   └── contract.config.js       # Contract configuration
└── deployments/                 # Deployment artifacts
```

## Features

- **WaveX Balance System**
  - Built-in balance for each NFT
  - Top-up capability using USDT/USDC
  - Direct payment processing through authorized merchants
  - Transaction history tracking

- **Template-Based NFT System**
  - Pre-defined templates (Gold, Platinum)
  - Customizable template properties
  - Template-specific initial balances and prices
  - VIP status management

- **Event Management**
  - Event creation and management
  - Capacity tracking
  - Multiple event types
  - Event access validation

- **Merchant Integration**
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

The project includes comprehensive tests for all major functionality:

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