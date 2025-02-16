// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IWaveXNFTV3.sol";
import "../libraries/WaveXLibV3.sol";

contract WaveXNFTV3 is IWaveXNFTV3, ERC721URIStorage, Pausable, Ownable {
    using WaveXLibV3 for *;

    // State variables
    uint256 private _tokenIds;
    uint256 private _templateIds;

    // Mappings
    mapping(uint256 => Template) public templates;
    mapping(uint256 => Event) public events;
    mapping(uint256 => uint256) public tokenBalance;
    mapping(uint256 => Transaction[]) public transactions;
    mapping(uint256 => uint256[]) public tokenEvents;
    mapping(address => bool) public authorizedMerchants;
    mapping(address => bool) public supportedTokens;
    // Add new mappings V3
    mapping(uint256 => EventTicket[]) private tokenEventTickets;
    mapping(address => bool) public ticketValidators;
    mapping(uint256 => address) public templatePaymentTokens;
    mapping(uint256 => uint256) public tokenTemplateIds; // tokenId => templateId

    constructor() ERC721("WaveX NFT V3", "WAVEX3") Ownable(msg.sender) {}

    // Template Management
    function initializeDefaultTemplates() external override onlyOwner {
        require(templates[1].baseBalance == 0, "Templates already initialized");
        
        _addTemplate(1, "Gold", 1000 * 10**18, 1000 * 10**18, 0, false, "", true);
        _addTemplate(2, "Platinum", 3000 * 10**18, 3000 * 10**18, 0, false, "", true);
    }

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
        WaveXLibV3.validateTemplate(name, discount, templateId);
        require(templates[templateId].baseBalance == 0, "Template already exists");

        templates[templateId] = Template({
            name: name,
            baseBalance: baseBalance,
            price: price,
            discount: discount,
            isVIP: isVIP,
            metadataURI: metadataURI,
            active: active
        });

        if (templateId > _templateIds) {
            _templateIds = templateId;
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
    // In getTokenTemplate function
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
    require(_ownerOf(tokenId) != address(0), "Token does not exist");
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
    // In updateTokenURI function
function updateTokenURI(uint256 tokenId, string memory newUri) external onlyOwner {
    require(_ownerOf(tokenId) != address(0), "Token does not exist");
    _setTokenURI(tokenId, newUri);
    emit TokenURIUpdated(tokenId, newUri);
}
    // valitationTickets V3
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
        WaveXLibV3.validateTemplate(name, discount, templateId);

        templates[templateId] = Template({
            name: name,
            baseBalance: baseBalance,
            price: price,
            discount: discount,
            isVIP: isVIP,
            metadataURI: metadataURI,
            active: active
        });

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

    // Token Management V3
    function mintFromTemplate(
    uint256 templateId,
    address to,
    string memory uri,
    address paymentToken
) external override whenNotPaused returns (uint256) {
    require(templates[templateId].active, "Template not active");
    require(supportedTokens[paymentToken], "Token not supported");

    Template memory template = templates[templateId];
    IERC20 token = IERC20(paymentToken);

    require(
        token.transferFrom(msg.sender, address(this), template.price),
        "Payment failed"
    );
    _tokenIds++;
    uint256 newTokenId = _tokenIds;

    _safeMint(to, newTokenId);
    _setTokenURI(newTokenId, uri);

    tokenTemplateIds[newTokenId] = templateId;
    tokenBalance[newTokenId] = template.baseBalance;
    emit BalanceUpdated(newTokenId, template.baseBalance, "MINT");

    return newTokenId;
}

    // Balance Management
    function topUpBalance(
        uint256 tokenId,
        uint256 amount,
        address paymentToken
    ) external whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(supportedTokens[paymentToken], "Token not supported");

        IERC20 token = IERC20(paymentToken);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        WaveXLibV3.validateAndUpdateBalance(tokenBalance, tokenId, amount, false);
        WaveXLibV3.recordTransaction(
            transactions,
            tokenId,
            address(0),
            amount,
            "TOPUP",
            ""
        );

        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "TOPUP");
    }

    function processPayment(
        uint256 tokenId,
        uint256 amount,
        string memory metadata
    ) external whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(authorizedMerchants[msg.sender], "Not authorized merchant");

        WaveXLibV3.validateAndUpdateBalance(tokenBalance, tokenId, amount, true);
        WaveXLibV3.recordTransaction(
            transactions,
            tokenId,
            msg.sender,
            amount,
            "PAYMENT",
            metadata
        );

        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "PAYMENT");
    }

    // Event Management
    function createEvent(
        string memory name,
        uint256 price,
        uint256 capacity,
        uint256 eventType
    ) external onlyOwner whenNotPaused returns (uint256) {
        return WaveXLibV3.createNewEvent(events, name, price, capacity, eventType);
    }

    function purchaseEventEntrance(
        uint256 tokenId,
        uint256 eventId
    ) external whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        WaveXLibV3.validateEventPurchase(events[eventId], tokenBalance[tokenId]);
        WaveXLibV3.validateAndUpdateBalance(tokenBalance, tokenId, events[eventId].price, true);

        events[eventId].soldCount++;
        tokenEvents[tokenId].push(eventId);

        emit EventPurchased(tokenId, eventId);
        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "EVENT_PURCHASE");
    }

    // Merchant Management
    function authorizeMerchant(address merchant) external onlyOwner {
        authorizedMerchants[merchant] = true;
    }

    function revokeMerchant(address merchant) external onlyOwner {
        authorizedMerchants[merchant] = false;
    }

    function addSupportedToken(address tokenAddress) external override onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        supportedTokens[tokenAddress] = true;
        emit SupportedTokenAdded(tokenAddress);
    }

    // Contract Management
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View Functions
    function getTemplateCount() external view returns (uint256) {
        return _templateIds;
    }

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

    function getTransactionCount(uint256 tokenId) external view returns (uint256) {
        return transactions[tokenId].length;
    }

    function getTransaction(
        uint256 tokenId,
        uint256 index
    ) external view returns (
        uint256 timestamp,
        address merchant,
        uint256 amount,
        string memory transactionType,
        string memory metadata
    ) {
        Transaction memory txn = transactions[tokenId][index];
        return (
            txn.timestamp,
            txn.merchant,
            txn.amount,
            txn.transactionType,
            txn.metadata
        );
    }

    function getTokenEvents(uint256 tokenId) external view returns (uint256[] memory) {
        return tokenEvents[tokenId];
    }

    // Override Functions
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}