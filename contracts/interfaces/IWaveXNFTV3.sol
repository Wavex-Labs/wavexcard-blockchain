// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWaveXNFTV3 {
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
    // Add new structs
    struct EventTicket {
        uint256 eventId;
        bool used;
        uint256 usedTimestamp;
        address checkedBy;
    }

    // Events
    event BalanceUpdated(uint256 indexed tokenId, uint256 newBalance, string updateType);
    event EventPurchased(uint256 indexed tokenId, uint256 indexed eventId);
    event TransactionRecorded(uint256 indexed tokenId, string transactionType, uint256 amount);
    event SupportedTokenAdded(address indexed tokenAddress);
    // Add new events V3
    event TokenURIUpdated(uint256 indexed tokenId, string newUri);
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId, address validator);
    event PaymentTokenSet(uint256 indexed templateId, address tokenAddress);

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
    // Modify existing function V3
    function mintFromTemplate(
    uint256 templateId,
    address to,
    string memory uri,
    address paymentToken
) external returns (uint256);
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
    // Add new functions V3
    function updateTokenURI(uint256 tokenId, string memory newUri) external;
    function validateTicket(uint256 tokenId, uint256 eventId) external returns (bool);
    function getTicketStatus(uint256 tokenId, uint256 eventId) 
        external 
        view 
        returns (bool exists, bool used, uint256 usedTimestamp, address checkedBy);
    function setTicketValidator(address validator, bool status) external;
    function setTemplatePaymentToken(uint256 templateId, address tokenAddress) external;
    // V3 function to fetch the template ID for the token ID
    function getTokenTemplate(uint256 tokenId)  
    external 
    view 
    returns (
        uint256 templateId,
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    );
}