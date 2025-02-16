# WaveX NFT V2 Template Management Documentation

## Overview

WaveX NFT V2 introduces a template-based NFT system to streamline NFT creation and management. Templates define pre-configured settings for NFTs, such as initial balance, price, VIP status, and metadata. This allows for efficient creation of NFTs with consistent properties based on predefined templates.

## Template Properties

Each template in WaveX NFT V2 is defined by the following properties:

- **`templateId` (uint256)**: Unique identifier for the template.
- **`name` (string)**: Human-readable name of the template (e.g., "Gold", "Platinum", "Silver").
- **`baseBalance` (uint256)**: Initial balance assigned to NFTs minted from this template.
- **`price` (uint256)**: Minting price for NFTs based on this template.
- **`discount` (uint256)**: Discount percentage applicable to NFTs minted from this template (e.g., for event purchases).
- **`isVIP` (bool)**: VIP status indicator for NFTs minted from this template.
- **`metadataURI` (string)**: URI pointing to the metadata JSON file for this template.
- **`active` (bool)**: Active status of the template. Only active templates can be used for minting NFTs.

## Template Lifecycle

1. **Template Creation**: 
   - New templates are created by the contract owner using the `addTemplate()` function.
   - Default templates (Gold, Platinum) are initialized using `initializeDefaultTemplates()` function during contract setup.
   - Template creation requires specifying all template properties.
   - `TemplateCreated` event is emitted upon successful template creation.

2. **Template Modification**:
   - Existing templates can be modified by the contract owner using the `modifyTemplate()` function.
   - All template properties except `templateId` can be updated.
   - `TemplateUpdated` event is emitted upon successful template modification.

3. **Template Usage**:
   - Templates are used as blueprints for minting new NFTs using the `mintFromTemplate()` function.
   - When minting from a template, the NFT inherits the properties defined in the template (e.g., `baseBalance`, `isVIP`).
   - Only active templates can be used for minting.

## Template Management Functions

The following functions in the `WaveXNFTV2` contract are used for template management:

- **`initializeDefaultTemplates()`**: Initializes default templates (Gold, Platinum).
- **`addTemplate(templateId, name, baseBalance, price, discount, isVIP, metadataURI, active)`**: Adds a new template.
- **`modifyTemplate(templateId, name, baseBalance, price, discount, isVIP, metadataURI, active)`**: Modifies an existing template.
- **`getTemplateCount()`**: Returns the total number of templates.
- **`getTemplate(templateId)`**: Retrieves details of a specific template.

(Refer to `API.md` for detailed API documentation of these functions)

## Use Cases and Examples

- **Membership Tiers**: Create templates for different membership tiers (e.g., "Basic", "Premium", "VIP") with varying `baseBalance`, `price`, and `isVIP` status.
- **Event Access Passes**: Define templates for different event access levels (e.g., "Standard Access", "VIP Access") with specific properties and metadata.
- **Product Categories**: Use templates to categorize NFTs representing different product categories with specific attributes and pricing.

**Example (Creating a "Silver" Template):**

```javascript
// Example script (using Hardhat)
const templateId = 3;
const templateName = "Silver";
const baseBalance = ethers.parseUnits("500", "ether");
const price = ethers.parseUnits("500", "ether");
const discount = 5;
const isVIP = false;
const metadataURI = "ipfs://template-silver.json";
const active = true;

await wavexNFTV2.addTemplate(
    templateId,
    templateName,
    baseBalance,
    price,
    discount,
    isVIP,
    metadataURI,
    active
);

console.log(\`Template "${templateName}" created with ID: ${templateId}\`);