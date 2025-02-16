# WaveX NFT V2 Events Documentation

This document describes the events emitted by the WaveX NFT V2 smart contract and its associated library. Events provide a way to track important state changes and activities within the contract.

## 1. TemplateCreated

- **Event Name**: `TemplateCreated`
- **Parameters**:
    - `templateId` (uint256): ID of the created template.
    - `name` (string): Name of the template.
    - `baseBalance` (uint256): Initial balance for NFTs minted from this template.
    - `price` (uint256): Minting price for this template.
    - `discount` (uint256): Discount percentage for this template.
    - `isVIP` (bool): VIP status for this template.
    - `metadataURI` (string): URI for template metadata.
    - `active` (bool): Active status of the template.
- **Emitting Function**: `WaveXNFTV2._addTemplate()`
- **Purpose**: Emitted when a new template is created in the contract.

## 2. TemplateUpdated

- **Event Name**: `TemplateUpdated`
- **Parameters**: Same as `TemplateCreated`
- **Emitting Function**: `WaveXNFTV2.modifyTemplate()`
- **Purpose**: Emitted when an existing template is updated in the contract.

## 3. EventCreated

- **Event Name**: `EventCreated`
- **Parameters**:
    - `eventId` (uint256): ID of the created event.
    - `name` (string): Name of the event.
    - `capacity` (uint256): Maximum capacity of the event.
- **Emitting Function**: `WaveXLib.createNewEvent()`
- **Purpose**: Emitted when a new event is created in the contract.

## 4. EventPurchased

- **Event Name**: `EventPurchased`
- **Parameters**:
    - `tokenId` (uint256): ID of the NFT that purchased the event entrance.
    - `eventId` (uint256): ID of the purchased event.
- **Emitting Function**: `WaveXNFTV2.purchaseEventEntrance()`
- **Purpose**: Emitted when an NFT successfully purchases entrance to an event.

## 5. BalanceUpdated

- **Event Name**: `BalanceUpdated`
- **Parameters**:
    - `tokenId` (uint256): ID of the NFT whose balance was updated.
    - `newBalance` (uint256): New balance of the NFT.
    - `updateType` (string): Type of balance update (e.g., "MINT", "TOPUP", "PAYMENT", "EVENT_PURCHASE").
- **Emitting Functions**: 
    - `WaveXNFTV2.mintFromTemplate()`
    - `WaveXNFTV2.topUpBalance()`
    - `WaveXNFTV2.processPayment()`
    - `WaveXNFTV2.purchaseEventEntrance()`
- **Purpose**: Emitted whenever the balance of an NFT is updated.

## 6. TransactionProcessed

- **Event Name**: `TransactionProcessed`
- **Parameters**:
    - `tokenId` (uint256): ID of the NFT involved in the transaction.
    - `transactionType` (string): Type of transaction (e.g., "TOPUP", "PAYMENT").
    - `amount` (uint256): Amount of the transaction.
- **Emitting Function**: `WaveXLib.recordTransaction()`
- **Purpose**: Emitted when a transaction is recorded for an NFT.

## 7. SupportedTokenAdded

- **Event Name**: `SupportedTokenAdded`
- **Parameters**:
    - `tokenAddress` (address): Address of the newly supported token.
- **Emitting Function**: `WaveXNFTV2.addSupportedToken()`
- **Purpose**: Emitted when a new supported payment token is added to the contract.