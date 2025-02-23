// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IWaveXNFTV2.sol";

library WaveXLib {
    // Events
    event TransactionProcessed(uint256 indexed tokenId, string transactionType, uint256 amount);
    event EventCreated(uint256 indexed eventId, string name, uint256 capacity);

    // Transaction handling
    function recordTransaction(
        mapping(uint256 => IWaveXNFTV2.Transaction[]) storage transactions,
        uint256 tokenId,
        address merchant,
        uint256 amount,
        string memory transactionType,
        string memory metadata
    ) internal {
        transactions[tokenId].push(
            IWaveXNFTV2.Transaction({
                timestamp: block.timestamp,
                merchant: merchant,
                amount: amount,
                transactionType: transactionType,
                metadata: metadata
            })
        );

        emit TransactionProcessed(tokenId, transactionType, amount);
    }

    // Event handling
    function createNewEvent(
        mapping(uint256 => IWaveXNFTV2.Event) storage events,
        string memory name,
        uint256 price,
        uint256 capacity,
        uint256 eventType
    ) internal returns (uint256) {
        uint256 eventId = uint256(keccak256(abi.encodePacked(name, block.timestamp)));
        
        events[eventId] = IWaveXNFTV2.Event({
            name: name,
            price: price,
            capacity: capacity,
            soldCount: 0,
            active: true,
            eventType: eventType
        });

        emit EventCreated(eventId, name, capacity);
        return eventId;
    }

    // Template validation
    function validateTemplate(
        string memory name,
        uint256 discount,
        uint256 templateId
    ) internal pure {
        require(templateId > 0, "Invalid template ID");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(discount <= 100, "Invalid discount percentage");
    }

    // Balance operations
    function validateAndUpdateBalance(
        mapping(uint256 => uint256) storage tokenBalance,
        uint256 tokenId,
        uint256 amount,
        bool isDeduction
    ) internal {
        if (isDeduction) {
            require(tokenBalance[tokenId] >= amount, "Insufficient balance");
            tokenBalance[tokenId] -= amount;
        } else {
            tokenBalance[tokenId] += amount;
        }
    }

    // Event validation
    function validateEventPurchase(
        IWaveXNFTV2.Event storage event_,
        uint256 tokenBalance
    ) internal view {
        require(event_.active, "Event not active");
        require(event_.soldCount < event_.capacity, "Event full");
        require(tokenBalance >= event_.price, "Insufficient balance");
    }
}