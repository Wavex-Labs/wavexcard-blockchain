// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IWaveXNFTV2.sol";
import "../libraries/WaveXLib.sol";

contract WaveXNFTV2 is IWaveXNFTV2, ERC721URIStorage, Pausable, Ownable {
    using WaveXLib for *;

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
        WaveXLib.validateTemplate(name, discount, templateId);
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
        WaveXLib.validateTemplate(name, discount, templateId);

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

    // Token Management
    function mintFromTemplate(
        uint256 templateId,
        address to,
        string memory uri
    ) external payable whenNotPaused returns (uint256) {
        require(templates[templateId].active, "Template not active");
        require(msg.value >= templates[templateId].price, "Insufficient payment");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);

        tokenBalance[newTokenId] = templates[templateId].baseBalance;
        emit BalanceUpdated(newTokenId, templates[templateId].baseBalance, "MINT");

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

        WaveXLib.validateAndUpdateBalance(tokenBalance, tokenId, amount, false);
        WaveXLib.recordTransaction(
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

        WaveXLib.validateAndUpdateBalance(tokenBalance, tokenId, amount, true);
        WaveXLib.recordTransaction(
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
        return WaveXLib.createNewEvent(events, name, price, capacity, eventType);
    }

    function purchaseEventEntrance(
        uint256 tokenId,
        uint256 eventId
    ) external whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        WaveXLib.validateEventPurchase(events[eventId], tokenBalance[tokenId]);
        WaveXLib.validateAndUpdateBalance(tokenBalance, tokenId, events[eventId].price, true);

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

    function addSupportedToken(address tokenAddress) external onlyOwner {
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