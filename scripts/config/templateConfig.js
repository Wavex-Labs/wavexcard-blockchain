// scripts/config/templateConfig.js
const { TEMPLATE_METADATA } = require('./metadataConfig');
const hre = require("hardhat");
require('dotenv').config();

// Internal metadata validation
function validateMetadata(metadata) {
  const requiredFields = ['name', 'description', 'image', 'attributes'];
  const missingFields = requiredFields.filter(field => !metadata[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required metadata fields: ${missingFields.join(', ')}`);
  }

  if (!Array.isArray(metadata.attributes)) {
    throw new Error('Attributes must be an array');
  }

  return true;
}

async function getTemplateMetadata(templateId, tokenId = "template") {
  try {
    // First try to get template configuration from TEMPLATE_METADATA
    const templateBase = TEMPLATE_METADATA[templateId];
    
    // If not found in TEMPLATE_METADATA, try environment variables
    const templateName = templateBase ? templateBase.name : process.env.TEMPLATE_NEW_NAME;
    const templateBaseBalance = templateBase ? templateBase.baseBalance : (process.env.TEMPLATE_NEW_BASE_BALANCE || "0");
    const templatePrice = templateBase ? templateBase.price : (process.env.TEMPLATE_NEW_PRICE || "0");
    const templateDiscount = templateBase ? templateBase.discount : parseInt(process.env.TEMPLATE_NEW_DISCOUNT || "0");
    const templateIsVIP = templateBase ? templateBase.isVIP : (process.env.TEMPLATE_NEW_IS_VIP === "true" || false);
    const templateImage = process.env[`TEMPLATE_${templateId}_IMAGE`] || "ipfs://QmDefaultTemplateHash";

    if (!templateName) {
      throw new Error(`Template name not found for template ID ${templateId}`);
    }

    // Generate complete metadata
    const metadata = templateBase?.metadata || {
      name: `WaveX ${templateName} Membership`,
      description: `WaveX ${templateName} Membership Card`,
      image: templateImage,
      attributes: [
        {
          trait_type: "Membership Tier",
          value: templateName
        },
        {
          trait_type: "Base Balance",
          value: `${templateBaseBalance} MATIC`
        },
        {
          trait_type: "VIP Status",
          value: templateIsVIP ? "VIP" : "Standard"
        }
      ],
      properties: {
        tier: templateName,
        benefits: [
          "Access to Events",
          "Member Discounts",
          templateIsVIP ? "VIP Benefits" : "Standard Benefits"
        ],
        cardDesign: "v2",
        baseBalance: templateBaseBalance,
        price: templatePrice,
        discount: templateDiscount,
        isVIP: templateIsVIP,
        design: {
          image: templateImage,
          backgroundColor: templateIsVIP ? "rgb(0, 0, 0)" : "rgb(255, 215, 0)",
          foregroundColor: templateIsVIP ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
          labelColor: templateIsVIP ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
          primaryColor: templateIsVIP ? "#000000" : "#FFD700",
          textColor: templateIsVIP ? "#FFFFFF" : "#000000"
        }
      }
    };

    // Validate metadata
    validateMetadata(metadata);

    return metadata;
  } catch (error) {
    console.error("Error generating template metadata:", error);
    throw error;
  }
}

module.exports = {
  getTemplateMetadata,
  validateMetadata,
  // Add other exports if needed
};