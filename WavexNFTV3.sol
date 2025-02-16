// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract WaveXNFTV3 is ERC721URIStorage, Pausable, Ownable {
    using Counters for Counters.Counter;

    // Counter for token IDs
    Counters.Counter private _tokenIds;
    // Counter for template IDs
    Counters.Counter private _templateIds;

    // Template system
    struct Template {
        string name;
        uint256 baseBalance;
        uint256 price;
        uint256 discount;      // Added for discount percentages
        bool isVIP;           // Added for VIP access
        string metadataURI;   // Added for template-specific metadata
        bool active;
    }

    // Event structure
    struct Event {
        string name;
        uint256 price;
        uint256 capacity;
        uint256 soldCount;
        bool active;
        uint256 eventType;
    }
    // Event Ticket structure V3
    struct EventTicket {
    uint256 eventId;
    bool used;
    uint256 usedTimestamp;
    address checkedBy;
}
    // Transaction structure
    struct Transaction {
        uint256 timestamp;
        address merchant;
        uint256 amount;
        string transactionType; // "PAYMENT" or "TOPUP"
        string metadata;
    }

    // Mapping for templates
    mapping(uint256 => Template) public templates;
    mapping(uint256 => Event) public events;
    mapping(uint256 => uint256) public tokenBalance;
    mapping(uint256 => Transaction[]) public transactions;
    mapping(uint256 => uint256[]) public tokenEvents; // Stores Event IDs per token
    mapping(address => bool) public authorizedMerchants;

    // Add new mappings V3
    mapping(uint256 => EventTicket[]) private tokenEventTickets;
    mapping(address => bool) public ticketValidators;
    mapping(uint256 => address) public templatePaymentTokens;
    mapping(uint256 => uint256) public tokenTemplateIds; // tokenId => templateId
    // Supported payment tokens (USDT/USDC)
    mapping(address => bool) public supportedTokens;

    // Events
    event BalanceUpdated(uint256 indexed tokenId, uint256 newBalance, string updateType);
    event EventPurchased(uint256 indexed tokenId, uint256 indexed eventId);
    event TransactionRecorded(uint256 indexed tokenId, string transactionType, uint256 amount);
    event SupportedTokenAdded(address indexed tokenAddress);
    // These functions should be added to WaveXNFTV3.sol
    // Add at the events section of the first WaveXNFTV3.sol
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

    constructor() ERC721("WaveX NFT V3", "WAVEX3") Ownable() {
        // Contract starts unpaused
        // Templates will be initialized later
    }

    // Initialize default templates (to be called after deployment)
    function initializeDefaultTemplates() external onlyOwner {
        require(templates[1].baseBalance == 0, "Templates already initialized");
        
        // Add default templates
        _addTemplate(1, "Gold", 1 ether, 1 ether, 0, false, "", true);
        _addTemplate(2, "Platinum", 2 ether, 2 ether, 0, false, "", true);
    }

    // Add a supported token
    function addSupportedToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        supportedTokens[tokenAddress] = true;
        emit SupportedTokenAdded(tokenAddress);
    }
   

    function getTicketStatus(uint256 tokenId, uint256 eventId) 
    external 
    view 
    returns (bool exists, bool used, uint256 usedTimestamp, address checkedBy) 
{
    EventTicket[] storage tickets = tokenEventTickets[tokenId];
    for (uint i = 0; i < tickets.length; i++) {
        if (tickets[i].eventId == eventId) {
            return (true, tickets[i].used, tickets[i].usedTimestamp, tickets[i].checkedBy);
        }
    }
    return (false, false, 0, address(0));
}

function setTicketValidator(address validator, bool status) external onlyOwner {
    require(validator != address(0), "Invalid validator address");
    ticketValidators[validator] = status;
}

function setTemplatePaymentToken(uint256 templateId, address tokenAddress) external onlyOwner {
    require(templateId > 0, "Invalid template ID");
    require(tokenAddress != address(0), "Invalid token address");
    require(supportedTokens[tokenAddress], "Token not supported");
    templatePaymentTokens[templateId] = tokenAddress;
    emit PaymentTokenSet(templateId, tokenAddress);
}
    // Add a new template
    function addTemplate(
        uint256 templateId,
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    ) external onlyOwner {
        _addTemplate(templateId, name, baseBalance, price, discount, isVIP, metadataURI, active);
    }

    // Internal function to add a template
    function _addTemplate(
        uint256 templateId,
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    ) internal {
        require(templateId > 0, "Invalid template ID");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(discount <= 100, "Invalid discount percentage");
        require(templates[templateId].baseBalance == 0, "Template already exists");

        templates[templateId] = Template(
            name,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI,
            active
        );

        // Update template counter if needed
        if (templateId > _templateIds.current()) {
            _templateIds.increment();
        }

        emit TemplateCreated(
            templateId,
            name,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI,
            active
        );
    }

    // Get template count
    function getTemplateCount() external view returns (uint256) {
        return _templateIds.current();
    }

    // Modify an existing template
    function modifyTemplate(
        uint256 templateId,
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    ) external onlyOwner {
        require(templateId > 0, "Invalid template ID");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(discount <= 100, "Invalid discount percentage");

        templates[templateId] = Template(
            name,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI,
            active
        );

        emit TemplateUpdated(
            templateId,
            name,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI,
            active
        );
    }

    // Get template details
    function getTemplate(uint256 templateId) external view returns (
        string memory name,
        uint256 baseBalance,
        uint256 price,
        uint256 discount,
        bool isVIP,
        string memory metadataURI,
        bool active
    ) {
        Template memory template = templates[templateId];
        require(bytes(template.name).length > 0, "Template does not exist");
        return (
            template.name,
            template.baseBalance,
            template.price,
            template.discount,
            template.isVIP,
            template.metadataURI,
            template.active
        );
    }
    // Get mintFromTemplate V3
    function mintFromTemplate(
    uint256 templateId,
    address to,
    string memory uri,
    address paymentToken
    ) external whenNotPaused returns (uint256) {
    require(templates[templateId].active, "Template not active");
    require(supportedTokens[paymentToken], "Token not supported");
    
    Template memory template = templates[templateId];
    IERC20 token = IERC20(paymentToken);
    
    require(
        token.transferFrom(msg.sender, address(this), template.price),
        "Payment failed"
    );

    _tokenIds.increment();
    uint256 newTokenId = _tokenIds.current();
    
    _safeMint(to, newTokenId);
    _setTokenURI(newTokenId, uri);
    
    // Store template ID with token
    tokenTemplateIds[newTokenId] = templateId;
    
    tokenBalance[newTokenId] = template.baseBalance;
    emit BalanceUpdated(newTokenId, template.baseBalance, "MINT");
    
    return newTokenId;
    }
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
    ) 
    {
    require(_exists(tokenId), "Token does not exist");
    templateId = tokenTemplateIds[tokenId];
    Template memory template = templates[templateId];
    return (
        templateId,
        template.name,
        template.baseBalance,
        template.price,
        template.discount,
        template.isVIP,
        template.metadataURI,
        template.active
    );
    }
    // Top up the balance of a token
    function topUpBalance(uint256 tokenId, uint256 amount, address paymentToken) external whenNotPaused {
        require(_exists(tokenId), "Token does not exist");
        require(supportedTokens[paymentToken], "Token not supported");

        IERC20 token = IERC20(paymentToken);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        tokenBalance[tokenId] += amount;

        // Record transaction
        transactions[tokenId].push(Transaction({
            timestamp: block.timestamp,
            merchant: address(0), // No merchant for top-ups
            amount: amount,
            transactionType: "TOPUP",
            metadata: ""
        }));

        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "TOPUP");
        emit TransactionRecorded(tokenId, "TOPUP", amount);
    }

    // Process a payment from a token
    function processPayment(
        uint256 tokenId,
        uint256 amount,
        string memory metadata
    ) external whenNotPaused {
        require(_exists(tokenId), "Token does not exist");
        require(authorizedMerchants[msg.sender], "Not authorized merchant");
        require(tokenBalance[tokenId] >= amount, "Insufficient balance");

        tokenBalance[tokenId] -= amount;

        // Record transaction
        transactions[tokenId].push(Transaction({
            timestamp: block.timestamp,
            merchant: msg.sender,
            amount: amount,
            transactionType: "PAYMENT",
            metadata: metadata
        }));

        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "PAYMENT");
        emit TransactionRecorded(tokenId, "PAYMENT", amount);
    }
    // Add new functions V3
    function updateTokenURI(uint256 tokenId, string memory newUri) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _setTokenURI(tokenId, newUri);
        emit TokenURIUpdated(tokenId, newUri);
    }

    function validateTicket(uint256 tokenId, uint256 eventId) 
        external 
        whenNotPaused 
        returns (bool) 
    {
        require(ticketValidators[msg.sender], "Not authorized validator");
        bool result = WaveXLibV3.validateAndRecordTicketUsage(
            tokenEventTickets,
            tokenId,
            eventId,
            msg.sender
        );
        if (result) {
            emit TicketUsed(tokenId, eventId, msg.sender);
        }
        return result;
    }
    // Create a new event
    function createEvent(
        string memory name,
        uint256 price,
        uint256 capacity,
        uint256 eventType
    ) external onlyOwner whenNotPaused returns (uint256) {
        uint256 eventId = uint256(keccak256(abi.encodePacked(name, block.timestamp)));
        events[eventId] = Event(name, price, capacity, 0, true, eventType);
        return eventId;
    }

    // Purchase entrance to an event
    function purchaseEventEntrance(uint256 tokenId, uint256 eventId) external whenNotPaused {
        require(_exists(tokenId), "Token does not exist");
        require(events[eventId].active, "Event not active");
        require(events[eventId].soldCount < events[eventId].capacity, "Event full");
        require(tokenBalance[tokenId] >= events[eventId].price, "Insufficient balance");

        tokenBalance[tokenId] -= events[eventId].price;
        events[eventId].soldCount++;
        tokenEvents[tokenId].push(eventId);

        emit EventPurchased(tokenId, eventId);
        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "EVENT_PURCHASE");
    }

    // Authorize a merchant
    function authorizeMerchant(address merchant) external onlyOwner {
        authorizedMerchants[merchant] = true;
    }

    // Revoke a merchant's authorization
    function revokeMerchant(address merchant) external onlyOwner {
        authorizedMerchants[merchant] = false;
    }

    // Pause contract
    function pause() external onlyOwner {
        _pause();
    }

    // Unpause contract
    function unpause() external onlyOwner {
        _unpause();
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // Add the supportsInterface override
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Utility functions
    function getTransactionCount(uint256 tokenId) external view returns (uint256) {
        return transactions[tokenId].length;
    }

    function getTransaction(uint256 tokenId, uint256 index) external view returns (
        uint256 timestamp,
        address merchant,
        uint256 amount,
        string memory transactionType,
        string memory metadata
    ) {
        Transaction memory txn = transactions[tokenId][index];
        return (txn.timestamp, txn.merchant, txn.amount, txn.transactionType, txn.metadata);
    }

    function getTokenEvents(uint256 tokenId) external view returns (uint256[] memory) {
        return tokenEvents[tokenId];
    }
}
