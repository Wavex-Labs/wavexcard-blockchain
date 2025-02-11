# 🚀 Minting Guide: Create Your NFTs with Ease! 🚀

## 📜 Table of Contents
- [✅ Prerequisites](#prerequisites)
- [🛠️ Steps to Mint Your NFT](#steps-to-mint-your-nft)
  - [1. ⚙️ Configure the Minting Script](#1-configure-the-minting-script)
  - [2. 🚀 Run the Minting Script](#2-run-the-minting-script)
  - [3. 🔍 Verify the Mint](#3-verify-the-mint)
- [⚠️ Troubleshooting Common Issues](#troubleshooting-common-issues)
- [📚 Additional Resources](#additional-resources)

---

## ✅ Prerequisites

🔧 Before you begin, make sure you have the following ready:

* **Dependencies Installed:** Ensure you have all necessary project dependencies installed. If you haven't already, run:

  ```bash
  npm install
  ```

* **Funded Wallet:** You'll need a crypto wallet connected and funded with enough tokens (e.g., ETH on Ethereum, MATIC on Polygon) to cover minting fees.
  * Make sure your wallet is connected to the correct network.

---

## 🛠️ Steps to Mint Your NFT

### 1. ⚙️ Configure the Minting Script

📂 **Open the Script:** Navigate to your project directory and open the `scripts/mint/mintFromTemplate.js` file in your code editor.

🔩 **Modify Configuration:** Carefully review and modify the configuration parameters within the script to match your minting requirements.

```javascript
// --- Configuration ---
const templateId = 1; // ⚠️ Replace with your desired template ID
const recipientAddress = "0x..."; // ⚠️ Replace with the recipient's wallet address
```

> **💡 Tip:**
> - **`templateId`**: This ID corresponds to the template you wish to use for minting. Ensure this ID is correct.
> - **`recipientAddress`**: This is the wallet address where the minted NFT will be sent. Double-check the address for accuracy.

---

### 2. 🚀 Run the Minting Script

📊 **Open Terminal:** Open a new terminal in your VS Code or navigate to your project directory using your system's terminal.

👨🏫 **Execute Command:** Run the minting script using the following command:

```bash
npm run mint:template
```

> **⚠️ Important:**
> - Before executing, **double-check** your script configurations to avoid errors or unintended minting.
> - The script will automatically use the configured parameters to mint your NFT.

---

### 3. 🔍 Verify the Mint

👛 **Check Your Wallet:** After running the script, check your wallet (or the recipient's wallet if you minted to another address) to confirm that the NFT has been successfully minted and received.

🔍 **Block Explorer Verification:** For definitive proof, you can also verify the mint transaction on a block explorer (e.g., Etherscan, Polygonscan) using the transaction hash provided in the terminal output after running the script.

> **✅ Success!**
> If you've followed these steps, your NFT should now be successfully minted and visible in the designated wallet!

---

## ⚠️ Troubleshooting Common Issues

🛠️ Encountering problems? Here are some common issues and their solutions:

* **Insufficient Funds Error:**
  * **Problem:** Your wallet doesn't have enough tokens to pay for the transaction fees (gas).
  * **Solution:** Fund your wallet with more ETH or MATIC (depending on the network) from an exchange or another wallet.

* **Invalid Template ID Error:**
  * **Problem:** The `templateId` you configured in the script is incorrect or doesn't exist.
  * **Solution:** Double-check the `templateId` in your `mintFromTemplate.js` file. Ensure it matches a valid template ID in your system.

* **Transaction Failed Error:**
  * **Problem:** The minting transaction failed on the blockchain. This could be due to various reasons, such as network congestion or incorrect parameters.
  * **Solution:**
    * Review the error message in the terminal output for specific details.
    * Ensure all parameters in your script are correctly configured (addresses, IDs, etc.).
    * Try running the script again later, as network congestion can sometimes cause temporary issues.

---

## 📚 Additional Resources

* **Project Documentation:** For in-depth information and advanced topics, refer to the comprehensive [project documentation](docs/SYSTEM_DOCUMENTATION.md).
* **Need Help?** If you require further assistance or have specific questions, please contact our support team through [support@example.com](mailto:support@example.com).

---

🎉 Congratulations on minting your NFT! 🎉