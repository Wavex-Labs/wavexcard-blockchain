# WaveX NFT V3 Implementation Options

## Overview
This document outlines three strategic options to address the current hardcoded minting process where template ID's on-chain metadata requires specific formatting for characteristics.

## Option 1: Enhanced Template System with Dynamic Metadata

### Problem Statement
The current implementation relies on hardcoded template metadata, requiring manual formatting of characteristics like prices, base balance, and other attributes.

### Solution Components

1. **Enhanced Template Struct**
```solidity
struct EnhancedTemplate {
    string name;
    uint256 baseBalance;
    uint256 price;
    uint256 discount;
    bool isVIP;
    string metadataURI;
    bool active;
    uint256 version;
    mapping(string => string) attributes;
    MetadataFormat format;
}

struct MetadataFormat {
    string[] requiredFields;
    mapping(string => string) validationRules;
    bool dynamicPricing;
}
```

2. **Metadata Validation System**
- Pre-minting validation of metadata format
- Runtime attribute verification
- Dynamic price calculation based on attributes
- Automatic metadata formatting according to template rules

3. **Implementation Changes**
```solidity
// New functions to add
function validateMetadataFormat(uint256 templateId, string memory metadata) public view returns (bool);
function updateTemplateFormat(uint256 templateId, MetadataFormat memory format) external onlyOwner;
function getTemplateAttributes(uint256 templateId) external view returns (string[] memory);
```

4. **Benefits**
- Flexible metadata structure
- Automated validation
- Version control for metadata formats
- Reduced manual intervention

### Migration Strategy
1. Deploy new contract preserving existing template IDs
2. Add metadata migration function
3. Implement format validator
4. Update minting process

---

## Option 2: Metadata Proxy Pattern

### Problem Statement
Direct coupling between template and token metadata creates inflexibility and requires manual formatting.

### Solution Components

1. **Proxy Contract Structure**
```solidity
contract MetadataProxy {
    mapping(uint256 => address) private _implementations;
    mapping(uint256 => MetadataResolver) private _resolvers;
    
    struct MetadataResolver {
        address resolver;
        string format;
        bool active;
    }
}
```

2. **Resolver Interface**
```solidity
interface IMetadataResolver {
    function resolveMetadata(uint256 templateId, string memory baseMetadata) 
        external view returns (string memory);
    function validateFormat(string memory metadata) 
        external pure returns (bool);
}
```

3. **Implementation Changes**
- Add proxy contract deployment
- Implement metadata resolvers
- Add resolver registry
- Create caching mechanism

4. **Benefits**
- Decoupled metadata handling
- Upgradeable metadata logic
- Flexible format validation
- Efficient caching

### Migration Strategy
1. Deploy proxy contract
2. Register existing templates
3. Implement default resolver
4. Update minting flow

---

## Option 3: Minimal V3 Implementation

### Problem Statement
Complex template-token relationship makes metadata management difficult and error-prone.

### Solution Components

1. **Simplified Template Structure**
```solidity
struct SimpleTemplate {
    string name;
    uint256 baseBalance;
    uint256 basePrice;
    PriceModifier[] modifiers;
    MetadataValidator validator;
    bool active;
}

struct PriceModifier {
    string attribute;
    uint256 multiplier;
    bool active;
}

struct MetadataValidator {
    string[] required;
    string format;
}
```

2. **Core Functions**
```solidity
function addPriceModifier(uint256 templateId, string memory attribute, uint256 multiplier);
function calculatePrice(uint256 templateId, string memory metadata) public view returns (uint256);
function validateMetadata(uint256 templateId, string memory metadata) public view returns (bool);
```

3. **Implementation Changes**
- Remove complex metadata handling
- Add price calculation logic
- Implement basic metadata validation
- Add transformation hooks

4. **Benefits**
- Simplified codebase
- Clear separation of concerns
- Predictable pricing
- Easier maintenance

### Migration Strategy
1. Create new contract
2. Implement basic template system
3. Add validation logic
4. Update minting process

## Recommendation

Based on the analysis, **Option 3 (Minimal V3 Implementation)** is recommended for the following reasons:

1. **Simplicity**: Reduces complexity while maintaining core functionality
2. **Maintainability**: Easier to understand and modify
3. **Migration**: Straightforward migration path from V2
4. **Flexibility**: Provides foundation for future enhancements

### Implementation Steps

1. Create new V3 contract with simplified template structure
2. Implement basic metadata validation
3. Add dynamic price calculation
4. Create migration utilities
5. Update minting scripts
6. Add documentation

### Risks and Mitigation

1. **Data Migration**: 
   - Risk: Loss of template data during migration
   - Mitigation: Create comprehensive migration scripts and testing

2. **Backward Compatibility**: 
   - Risk: Breaking changes for existing integrations
   - Mitigation: Maintain V2 contract during transition

3. **Price Calculation**: 
   - Risk: Incorrect price computation
   - Mitigation: Extensive testing of price modifiers

### Timeline Estimate

1. Development: 2-3 weeks
2. Testing: 1-2 weeks
3. Migration: 1 week
4. Documentation: 1 week

Total: 5-7 weeks