# WaveX NFT V2 Smart Contract API Documentation

## Contract: WaveXNFTV2.sol

### Template Management Functions

#### 1. `initializeDefaultTemplates()`
- **Description**: Initializes default templates (Gold and Platinum). Can only be called once by the contract owner.
- **Parameters**: None
- **Returns**: None
- **Access**: Owner only
- **Events**: None

#### 2. `addTemplate(templateId, name, baseBalance, price, discount, isVIP, metadataURI, active)`
- **Description**: Adds a new template. Can only be called by the contract owner.
- **Parameters**:
    - `templateId` (uint256): Unique identifier for the template.
    - `name` (string): Name of the template.
    - `baseBalance` (uint256): Initial balance for NFTs minted from this template.
    - `price` (uint256): Minting price for this template.
    - `discount` (uint256): Discount percentage for this template.
    - `isVIP` (bool): VIP status for this template.
    - `metadataURI` (string): URI for template metadata.
    - `active` (bool): Active status of the template.
- **Returns**: None
- **Access**: Owner only
- **Events**: `TemplateCreated`

#### 3. `modifyTemplate(templateId, name, baseBalance, price, discount, isVIP, metadataURI, active)`
- **Description**: Modifies an existing template. Can only be called by the contract owner.
- **Parameters**: Same as `addTemplate()`
- **Returns**: None
- **Access**: Owner only
- **Events**: `TemplateUpdated`

#### 4. `getTemplateCount()`
- **Description**: Returns the total number of templates.
- **Parameters**: None
- **Returns**: `uint256`: Template count.
- **Access**: Public view
- **Events**: None

#### 5. `getTemplate(templateId)`
- **Description**: Returns details of a specific template.
- **Parameters**:
    - `templateId` (uint256): ID of the template to retrieve.
- **Returns**: 
    - `name` (string)
    - `baseBalance` (uint256)
    - `price` (uint256)
    - `discount` (uint256)
    - `isVIP` (bool)
    - `metadataURI` (string)
    - `active` (bool)
- **Access**: Public view
- **Events**: None

### Token Management Functions

#### 1. `mintFromTemplate(templateId, to, uri)`
- **Description**: Mints a new NFT from a template.
- **Parameters**:
    - `templateId` (uint256): ID of the template to mint from.
    - `to` (address): Recipient address for the minted NFT.
    - `uri` (string): URI for NFT metadata.
- **Returns**: `uint256`: New token ID.
- **Access**: Public payable, when not paused
- **Events**: `BalanceUpdated`

### Balance Management Functions

#### 1. `topUpBalance(tokenId, amount, paymentToken)`
- **Description**: Tops up the balance of an NFT.
- **Parameters**:
    - `tokenId` (uint256): ID of the NFT to top up.
    - `amount` (uint256): Amount to top up.
    - `paymentToken` (address): Address of the payment token (e.g., USDT).
- **Returns**: None
- **Access**: Public, when not paused
- **Events**: `BalanceUpdated`

#### 2. `processPayment(tokenId, amount, metadata)`
- **Description**: Processes a payment from an NFT balance to an authorized merchant.
- **Parameters**:
    - `tokenId` (uint256): ID of the NFT to process payment from.
    - `amount` (uint256): Payment amount.
    - `metadata` (string): Metadata for the transaction.
- **Returns**: None
- **Access**: Public, when not paused, authorized merchant only
- **Events**: `BalanceUpdated`

### Event Management Functions

#### 1. `createEvent(name, price, capacity, eventType)`
- **Description**: Creates a new event.
- **Parameters**:
    - `name` (string): Name of the event.
    - `price` (uint256): Price to purchase event entrance.
    - `capacity` (uint256): Maximum capacity of the event.
    - `eventType` (uint256): Type of event.
- **Returns**: `uint256`: New event ID.
- **Access**: Owner only, when not paused
- **Events**: `EventCreated` (from WaveXLib)

#### 2. `purchaseEventEntrance(tokenId, eventId)`
- **Description**: Purchases entrance to an event using NFT balance.
- **Parameters**:
    - `tokenId` (uint256): ID of the NFT purchasing entrance.
    - `eventId` (uint256): ID of the event to purchase entrance to.
- **Returns**: None
- **Access**: Public, when not paused
- **Events**: `EventPurchased`, `BalanceUpdated`

### Merchant Management Functions

#### 1. `authorizeMerchant(merchant)`
- **Description**: Authorizes a merchant address to process payments.
- **Parameters**:
    - `merchant` (address): Address of the merchant to authorize.
- **Returns**: None
- **Access**: Owner only
- **Events**: None

#### 2. `revokeMerchant(merchant)`
- **Description**: Revokes authorization for a merchant address.
- **Parameters**:
    - `merchant` (address): Address of the merchant to revoke authorization from.
- **Returns**: None
- **Access**: Owner only
- **Events**: None

### Token Support Functions

#### 1. `addSupportedToken(tokenAddress)`
- **Description**: Adds a supported payment token.
- **Parameters**:
    - `tokenAddress` (address): Address of the supported token (e.g., USDT, USDC).
- **Returns**: None
- **Access**: Owner only
- **Events**: `SupportedTokenAdded`

### Contract Management Functions

#### 1. `pause()`
- **Description**: Pauses the contract, preventing most state-changing functions from being called.
- **Parameters**: None
- **Returns**: None
- **Access**: Owner only
- **Events**: `Paused` (from Pausable.sol)

#### 2. `unpause()`
- **Description**: Unpauses the contract, allowing state-changing functions to be called again.
- **Parameters**: None
- **Returns**: None
- **Access**: Owner only
- **Events**: `Unpaused` (from Pausable.sol)

### View Functions

#### 1. `getTemplateCount()` 
- **Description**: (Documented above in Template Management Functions)

#### 2. `getTemplate(templateId)`
- **Description**: (Documented above in Template Management Functions)

#### 3. `getTransactionCount(tokenId)`
- **Description**: Returns the number of transactions recorded for a token.
- **Parameters**:
    - `tokenId` (uint256): ID of the NFT.
- **Returns**: `uint256`: Transaction count.
- **Access**: Public view
- **Events**: None

#### 4. `getTransaction(tokenId, index)`
- **Description**: Returns details of a specific transaction for a token.
- **Parameters**:
    - `tokenId` (uint256): ID of the NFT.
    - `index` (uint256): Index of the transaction to retrieve.
- **Returns**: 
    - `timestamp` (uint256)
    - `merchant` (address)
    - `amount` (uint256)
    - `transactionType` (string)
    - `metadata` (string)
- **Access**: Public view
- **Events**: None

#### 5. `getTokenEvents(tokenId)`
- **Description**: Returns a list of event IDs purchased by a token.
- **Parameters**:
    - `tokenId` (uint256): ID of the NFT.
- **Returns**: `uint256[]`: Array of event IDs.
- **Access**: Public view
- **Events**: None

#### 6. `tokenURI(tokenId)`
- **Description**: Overrides ERC721 `tokenURI` function to return token metadata URI.
- **Parameters**:
    - `tokenId` (uint256): ID of the NFT.
- **Returns**: `string`: Token metadata URI.
- **Access**: Public view, override
- **Events**: None

#### 7. `supportsInterface(interfaceId)`
- **Description**: Overrides ERC165 `supportsInterface` function to indicate interface support.
- **Parameters**:
    - `interfaceId` (bytes4): Interface ID to check for support.
- **Returns**: `bool`: True if interface is supported, false otherwise.
- **Access**: Public view, override
- **Events**: None