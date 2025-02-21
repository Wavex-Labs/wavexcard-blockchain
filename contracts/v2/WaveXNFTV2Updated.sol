// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IWaveXNFTV2Updated.sol";
import "../libraries/WaveXLibUpdated.sol";

contract WaveXNFTV2Updated is IWaveXNFTV2Updated, ERC721URIStorage, Pausable, Ownable {
    using WaveXLibUpdated for *;

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
    // New mapping for event check-ins
    mapping(uint256 => mapping(uint256 => bool)) public eventCheckIns; // eventId => tokenId => isCheckedIn

    constructor() ERC721("WaveX NFT V2", "WAVEX2") Ownable(msg.sender) {}

    // Template Management
    function initializeDefaultTemplates() external onlyOwner {
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
        WaveXLibUpdated.validateTemplate(name, discount, templateId);
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

    // Token Management - Simplified minting without payment validation
    function mintFromTemplate(
        uint256 templateId,
        address to,
        string memory uri
    ) external whenNotPaused returns (uint256) {
        require(templates[templateId].active, "Template not active");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);

        tokenBalance[newTokenId] = templates[templateId].baseBalance;
        emit BalanceUpdated(newTokenId, templates[templateId].baseBalance, "MINT");

        return newTokenId;
    }

    // Event Management
    function createEvent(
        string memory name,
        uint256 price,
        uint256 capacity,
        uint256 eventType
    ) external onlyOwner whenNotPaused returns (uint256) {
        return WaveXLibUpdated.createNewEvent(events, name, price, capacity, eventType);
    }

    function purchaseEventEntrance(
        uint256 tokenId,
        uint256 eventId
    ) external whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        WaveXLibUpdated.validateEventPurchase(events[eventId], tokenBalance[tokenId]);
        WaveXLibUpdated.validateAndUpdateBalance(tokenBalance, tokenId, events[eventId].price, true);

        events[eventId].soldCount++;
        tokenEvents[tokenId].push(eventId);

        emit EventPurchased(tokenId, eventId);
        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "EVENT_PURCHASE");
    }

    function processPayment(
        uint256 tokenId,
        uint256 amount,
        string memory metadata
    ) external whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(authorizedMerchants[msg.sender], "Not authorized merchant");
        require(tokenBalance[tokenId] >= amount, "Insufficient balance");

        tokenBalance[tokenId] -= amount;
        
        WaveXLibUpdated.recordTransaction(
            transactions,
            tokenId,
            msg.sender,
            amount,
            "PAYMENT",
            metadata
        );

        emit BalanceUpdated(tokenId, tokenBalance[tokenId], "PAYMENT");
    }

    // Event check-in function
    function checkInEvent(
        uint256 tokenId,
        uint256 eventId
    ) external whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        WaveXLibUpdated.validateEventCheckIn(events[eventId], eventCheckIns, eventId, tokenId);
        
        // Verify token has purchased this event
        bool hasTicket = false;
        uint256[] memory tickets = tokenEvents[tokenId];
        for (uint256 i = 0; i < tickets.length; i++) {
            if (tickets[i] == eventId) {
                hasTicket = true;
                break;
            }
        }
        require(hasTicket, "No ticket for this event");

        // Mark as checked in
        eventCheckIns[eventId][tokenId] = true;
        
        emit EventCheckedIn(eventId, tokenId);
    }

    // View function for check-in status
    function isCheckedIn(
        uint256 eventId,
        uint256 tokenId
    ) external view returns (bool) {
        return eventCheckIns[eventId][tokenId];
    }

    // Admin functions
    function authorizeMerchant(address merchant) external onlyOwner {
        authorizedMerchants[merchant] = true;
    }

    function revokeMerchant(address merchant) external onlyOwner {
        authorizedMerchants[merchant] = false;
    }

    function addSupportedToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        supportedTokens[tokenAddress] = true;
        emit SupportedTokenAdded(tokenAddress);
    }

    // View functions
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

    function getTemplateCount() external view returns (uint256) {
        return _templateIds;
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