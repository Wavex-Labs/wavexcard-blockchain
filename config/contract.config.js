const config = {
  // Network configurations
  networks: {
    polygon: {
      usdt: process.env.USDT_ADDRESS,
      usdc: process.env.USDC_ADDRESS,
      gasLimit: process.env.DEFAULT_GAS_LIMIT || 5000000,
      confirmations: 2
    },
    polygonAmoy: {
      usdt: process.env.USDT_CONTRACT_ADDRESS, // Updated to match .env
      gasLimit: process.env.DEFAULT_GAS_LIMIT || 5000000,
      confirmations: 1
    }
  },

  // Template configurations for V3
  templatesV3: {
    gold: {
      id: 1,
      name: process.env.TEMPLATE_1_NAME,
      baseBalance: process.env.TEMPLATE_1_BASE_BALANCE,
      price: process.env.TEMPLATE_1_PRICE,
      discount: process.env.TEMPLATE_1_DISCOUNT,
      isVIP: process.env.TEMPLATE_1_IS_VIP === 'true',
      image: process.env.TEMPLATE_1_IMAGE,
      benefits: JSON.parse(process.env.TEMPLATE_1_BENEFITS),
      active: true
    },
    platinum: {
      id: 2,
      name: process.env.TEMPLATE_2_NAME,
      baseBalance: process.env.TEMPLATE_2_BASE_BALANCE,
      price: process.env.TEMPLATE_2_PRICE,
      discount: process.env.TEMPLATE_2_DISCOUNT,
      isVIP: process.env.TEMPLATE_2_IS_VIP === 'true',
      image: process.env.TEMPLATE_2_IMAGE,
      benefits: JSON.parse(process.env.TEMPLATE_2_BENEFITS),
      active: true
    },
    black: {
      id: 3,
      name: process.env.TEMPLATE_3_NAME,
      baseBalance: process.env.TEMPLATE_3_BASE_BALANCE,
      price: process.env.TEMPLATE_3_PRICE,
      discount: process.env.TEMPLATE_3_DISCOUNT,
      isVIP: process.env.TEMPLATE_3_IS_VIP === 'true',
      image: process.env.TEMPLATE_3_IMAGE,
      benefits: JSON.parse(process.env.TEMPLATE_3_BENEFITS),
      active: true
    },
    eventbrite: {
      id: 4,
      name: process.env.TEMPLATE_4_NAME,
      baseBalance: process.env.TEMPLATE_4_BASE_BALANCE,
      price: process.env.TEMPLATE_4_PRICE,
      discount: process.env.TEMPLATE_4_DISCOUNT,
      isVIP: process.env.TEMPLATE_4_IS_VIP === 'true',
      image: process.env.TEMPLATE_4_IMAGE,
      benefits: JSON.parse(process.env.TEMPLATE_4_BENEFITS),
      active: true
    }
  },

  // Contract addresses
  contracts: {
    v2: process.env.WAVEX_NFT_V2_ADDRESS,
    v3: process.env.WAVEX_NFT_V3_ADDRESS
  },

  // IPFS configurations
  ipfs: {
    pinata: {
      apiKey: process.env.PINATA_API_KEY,
      secretKey: process.env.PINATA_API_SECRET,
      jwt: process.env.PINATA_JWT,
      gateway: 'https://gateway.pinata.cloud/ipfs/'
    }
  },

  // Contract verification settings
  verification: {
    polygonscan: {
      apiKey: process.env.POLYGONSCAN_API_KEY,
      wait: 5 
    }
  },

  // Gas settings
  gas: {
    price: process.env.GAS_PRICE,
    limit: process.env.GAS_LIMIT,
    margin: process.env.GAS_MARGIN_PERCENT || 20
  }
};

// Helper function to get network configuration
const getNetworkConfig = (networkName) => {
  return config.networks[networkName] || config.networks.polygonAmoy;
};

// Helper function to get template configuration
const getTemplateConfig = (templateId) => {
  const templates = config.templatesV3;
  return Object.values(templates).find(t => t.id === parseInt(templateId));
};

module.exports = {
  config,
  getNetworkConfig,
  getTemplateConfig
};