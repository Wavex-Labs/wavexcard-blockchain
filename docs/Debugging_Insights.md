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

Would you like me to:
1. Add more specific error cases?
2. Include network-specific configurations?
3. Add transaction monitoring examples? 🔧