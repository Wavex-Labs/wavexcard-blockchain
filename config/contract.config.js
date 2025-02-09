require('dotenv').config();

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
      usdt: process.env.TESTNET_USDT_ADDRESS,
      usdc: process.env.TESTNET_USDC_ADDRESS,
      gasLimit: process.env.DEFAULT_GAS_LIMIT || 5000000,
      confirmations: 1
    }
  },

  // Template configurations
  templates: {
    gold: {
      id: 1,
      name: "Gold",
      baseBalance: process.env.INITIAL_GOLD_BALANCE || "1000",
      price: process.env.INITIAL_GOLD_BALANCE || "1000",
      discount: 0,
      isVIP: false,
      metadataURI: "",
      active: true
    },
    platinum: {
      id: 2,
      name: "Platinum",
      baseBalance: process.env.INITIAL_PLATINUM_BALANCE || "3000",
      price: process.env.INITIAL_PLATINUM_BALANCE || "3000",
      discount: 0,
      isVIP: false,
      metadataURI: "",
      active: true
    }
  },

  // IPFS configurations
  ipfs: {
    pinata: {
      apiKey: process.env.PINATA_API_KEY,
      secretKey: process.env.PINATA_SECRET_KEY,
      jwt: process.env.PINATA_JWT,
      gateway: 'https://gateway.pinata.cloud/ipfs/'
    }
  },

  // Contract verification settings
  verification: {
    polygonscan: {
      apiKey: process.env.POLYGONSCAN_API_KEY,
      wait: 5 // Number of blocks to wait before verification
    }
  },

  // Test configurations
  test: {
    // Test wallet configurations
    wallets: {
      merchant: {
        address: '0x0000000000000000000000000000000000000001', // Replace with actual test merchant address
        privateKey: process.env.TEST_MERCHANT_PRIVATE_KEY
      },
      user: {
        address: '0x0000000000000000000000000000000000000002', // Replace with actual test user address
        privateKey: process.env.TEST_USER_PRIVATE_KEY
      }
    },
    // Test amounts
    amounts: {
      topUp: '100',
      payment: '50',
      eventPrice: '25'
    },
    // Test event configurations
    events: {
      standard: {
        name: 'Test Event',
        price: '25',
        capacity: 100,
        eventType: 1
      }
    }
  },

  // Contract deployment settings
  deployment: {
    // Constructor arguments if needed
    args: [],
    // Libraries to link
    libraries: {},
    // Proxy settings if using upgradeable pattern
    proxy: {
      admin: process.env.PROXY_ADMIN_ADDRESS,
      implementation: process.env.IMPLEMENTATION_ADDRESS
    }
  }
};

// Helper functions
const getNetworkConfig = (network) => {
  const networkConfig = config.networks[network];
  if (!networkConfig) {
    throw new Error(`Network configuration not found for ${network}`);
  }
  return networkConfig;
};

const getTemplateConfig = (templateName) => {
  const templateConfig = config.templates[templateName];
  if (!templateConfig) {
    throw new Error(`Template configuration not found for ${templateName}`);
  }
  return templateConfig;
};

module.exports = {
  config,
  getNetworkConfig,
  getTemplateConfig
};