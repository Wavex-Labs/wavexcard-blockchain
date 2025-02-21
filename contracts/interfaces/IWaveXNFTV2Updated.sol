// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWaveXNFTV2Updated {
    // Structs
    struct Template {
        string name;
        uint256 baseBalance;
        uint256 price;
        uint256 discount;
        bool isVIP;
        string metadataURI;
        bool active;
    }

    struct Event {
        string name;
        uint256 price;
        uint256 capacity;
        uint256 soldCount;
        bool active;
        uint256 eventType;
    }

    struct Transaction {
        uint256 timestamp;
        address merchant;
        uint256 amount;
        string transactionType;
        string metadata;
    }

    // Events
    event BalanceUpdated(uint256 indexed tokenId, uint256 newBalance, string updateType);
    event EventPurchased(uint256 indexed tokenId, uint256 indexed eventId);
    event EventCheckedIn(uint256 indexed eventId, uint256 indexed tokenId);
    event TransactionRecorded(uint256 indexed tokenId, string transactionType, uint256 amount);
    event SupportedTokenAdded(address indexed tokenAddress);
    event TemplateUpdated(
        uint256 indexed templateId,
        string name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string metadataURI,
        bool active
    );
    event TemplateCreated(
        uint256 indexed templateId,
        string name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string metadataURI,
        bool active
    );

    // Core functions
    function initializeDefaultTemplates() external;
    function addTemplate(
        uint256 templateId,
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    ) external;
    function mintFromTemplate(
        uint256 templateId,
        address to,
        string memory uri
    ) external returns (uint256);
    function createEvent(
        string memory name,
        uint256 price,
        uint256 capacity,
        uint256 eventType
    ) external returns (uint256);
    function purchaseEventEntrance(uint256 tokenId, uint256 eventId) external;
    
    // Event check-in functions
    function checkInEvent(uint256 tokenId, uint256 eventId) external;
    function isCheckedIn(uint256 eventId, uint256 tokenId) external view returns (bool);

    // View functions
    function getTemplate(uint256 templateId) external view returns (
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    );
    function getTemplateCount() external view returns (uint256);
    function getTokenEvents(uint256 tokenId) external view returns (uint256[] memory);
}