🤖 I'll create a comprehensive debugging guide based on our chat history. Here's a structured document outlining common errors and solutions:

# Ethereum/Polygon Smart Contract Interaction Debugging Guide

## 1. Number Format Issues

### Common Errors:
```javascript
"TypeError: invalid BigNumberish value"
"Cannot mix BigInt and other types, use explicit conversions"
```

### Solutions:
```javascript
// Correct way to handle token amounts
const tokenAmount = ethers.parseUnits(amount.toString(), 6);  // For USDT (6 decimals)
const balance = ethers.formatUnits(rawBalance, 6);  // Converting back to human-readable

// Handling BigNumbers
const balanceComparison = BigNumber.from(balance).gte(BigNumber.from(amount));
```

## 2. Gas Estimation Issues

### Common Errors:
```javascript
"transaction underpriced: gas tip cap 2500000000, minimum needed 25000000000"
"insufficient funds for gas"
```

### Best Practices:
```javascript
// Dynamic gas estimation
const gasLimit = await contract.estimateGas.methodName(...params);
const gasBuffer = Math.floor(gasLimit * 1.2); // Add 20% buffer

// EIP-1559 gas pricing
const feeData = await provider.getFeeData();
const txOptions = {
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    gasLimit: gasBuffer
};
```

## 3. Transaction Handling

### Error Prevention:
```javascript
// Wait for confirmations
const CONFIRMATIONS = 2;
const receipt = await tx.wait(CONFIRMATIONS);

// Transaction monitoring
provider.on(tx.hash, (transaction) => {
    console.log(`Current status: ${transaction.status}`);
});
```

## 4. Common Contract Interaction Issues

### Error Checks:
```javascript
// Balance checks
if (balance.lt(amount)) {
    throw new Error("Insufficient balance");
}

// Authorization checks
const isAuthorized = await contract.authorizedMerchants(address);
if (!isAuthorized) {
    throw new Error("Unauthorized merchant");
}
```

## 5. Environmental Setup

### Required Environment Variables:
```javascript
const required = [
    'WAVEX_NFT_V2_ADDRESS',
    'PRIVATE_KEY',
    'RPC_URL',
    'GAS_LIMIT',
    'GAS_PRICE'
];
```

## 6. Debug Logging Best Practices

```javascript
// Transaction logging
console.log({
    event: "Transaction Submitted",
    hash: tx.hash,
    gasLimit: tx.gasLimit.toString(),
    maxFeePerGas: ethers.formatUnits(tx.maxFeePerGas, 'gwei'),
    nonce: tx.nonce
});

// Balance logging
console.log({
    currentBalance: formattedBalance,
    requiredAmount: amount,
    difference: formattedBalance - amount
});
```

## 7. Error Recovery Strategies

```javascript
// Retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

async function withRetry(operation, retries = 0) {
    try {
        return await operation();
    } catch (error) {
        if (retries < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, RETRY_DELAY));
            return withRetry(operation, retries + 1);
        }
        throw error;
    }
}
```

## 8. Network-Specific Considerations

### Polygon Mumbai/Amoy:
- Minimum gas price: 30 gwei
- Recommended confirmations: 2-3 blocks
- Transaction timeout: ~5 minutes

BREAKING CHANGE: Refactored event creation and metadata handling

Key Changes:
- Implemented environment-driven parameter approach
- Enhanced gas optimization with dynamic estimation
- Added robust error handling and validation
- Integrated IPFS metadata management
- Added transaction monitoring and retry logic

Technical Details:
1. Gas Optimization:
- Dynamic fee calculation with safety margins
- EIP-1559 compatible gas strategies
- Configurable confirmation blocks

2. Error Handling:
- Validated environment variables
- Enhanced metadata validation
- Transaction monitoring with retries
- Detailed error logging

3. IPFS Integration:
- Metadata structure standardization
- Pinata integration for persistent storage
- Local backup of metadata

Common Issues & Solutions:
1. Gas Errors:
- "insufficient funds": Check gas estimation
- "underpriced": Use dynamic gas calculation

2. Transaction Failures:
- "pending too long": Implement retry logic
- "nonce mismatch": Reset account nonce

3. Metadata Issues:
- "invalid IPFS hash": Verify Pinata upload
- "missing fields": Check metadata validation

Environment Variables Required:
WAVEX_NFT_V2_ADDRESS=
PRIVATE_KEY=
RPC_URL=
CREATE_EVENT_NAME=
CREATE_EVENT_PRICE=
CREATE_EVENT_CAPACITY=
CREATE_EVENT_TYPE=
USDT_CONTRACT_ADDRESS=
USDC_CONTRACT_ADDRESS=
PINATA_API_KEY=
PINATA_API_SECRET=
PINATA_JWT=

Testing:
1. Run validation: npm run validate
2. Test creation: npm run create-event
3. Verify metadata: npm run verify-metadata

Related: #123 #456
Closes: #789