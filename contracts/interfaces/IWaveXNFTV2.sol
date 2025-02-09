// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWaveXNFTV2 {
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
    function addSupportedToken(address tokenAddress) external;
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
    function getTemplateCount() external view returns (uint256);
    function modifyTemplate(
        uint256 templateId,
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    ) external;
    function getTemplate(uint256 templateId) external view returns (
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    );
    function mintFromTemplate(
        uint256 templateId,
        address to,
        string memory uri
    ) external payable returns (uint256);
    function topUpBalance(uint256 tokenId, uint256 amount, address paymentToken) external;
    function processPayment(
        uint256 tokenId,
        uint256 amount,
        string memory metadata
    ) external;
    function createEvent(
        string memory name,
        uint256 price,
        uint256 capacity,
        uint256 eventType
    ) external returns (uint256);
    function purchaseEventEntrance(uint256 tokenId, uint256 eventId) external;
    function authorizeMerchant(address merchant) external;
    function revokeMerchant(address merchant) external;
    function pause() external;
    function unpause() external;
}