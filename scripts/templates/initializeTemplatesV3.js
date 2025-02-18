// scripts/templates/initializeTemplatesV3.js

const { ethers } = require("hardhat");

async function main() {
    console.log("Starting template initialization for V3...");

    try {
        // Get the signer
        const [deployer] = await ethers.getSigners();
        console.log(`Initializing with account: ${deployer.address}`);

        // Contract ABI for the functions we need
        const contractABI = [
            "function addTemplate(uint256 templateId, string name, uint256 baseBalance, uint256 price, uint8 discount, bool isVIP, string metadataURI, bool active) external",
            "function getTemplate(uint256 templateId) external view returns (string name, uint256 baseBalance, uint256 price, uint256 discount, bool isVIP, string metadataURI, bool active)",
            "function addSupportedToken(address token) external",
            "function setTemplatePaymentToken(uint256 templateId, address token) external"
        ];

        // Get contract instance
        const contractAddress = "0xC444DEAA508025FdBdC93C42a4E7Dbdc10c3a975";
        console.log(`Using contract address: ${contractAddress}`);
        
        const contract = new ethers.Contract(
            contractAddress,
            contractABI,
            deployer
        );

        // Template data with USDT prices (6 decimals) and template IDs
        const templates = [
            {
                id: 1,
                name: "Gold",
                baseBalance: ethers.parseUnits("3000", 6), // 3000 USDT
                price: ethers.parseUnits("3000", 6), // 3000 USDT
                discount: 6,
                isVIP: true,
                image: "ipfs://QmZ8u69Hjwuxe7XSB4p344DaCtPoHAu9D6v3QE6cnggLRD",
                active: true
            },
            {
                id: 2,
                name: "Platinum",
                baseBalance: ethers.parseUnits("5000", 6), // 5000 USDT
                price: ethers.parseUnits("5000", 6), // 5000 USDT
                discount: 9,
                isVIP: true,
                image: "ipfs://QmVSqUndoMDubugAGMUtyzXyxNH8TjT9w5PAWWCHnjmQnj",
                active: true
            },
            {
                id: 3,
                name: "Black",
                baseBalance: ethers.parseUnits("1000", 6), // 1000 USDT
                price: ethers.parseUnits("1000", 6), // 1000 USDT
                discount: 0,
                isVIP: false,
                image: "ipfs://QmY6qhAMnc2USJB6b3QxL3sYLnofoyXdr8aN3KAqDkvpms",
                active: true
            },
            {
                id: 4,
                name: "EventBrite",
                baseBalance: ethers.parseUnits("0", 6), // 0 USDT
                price: ethers.parseUnits("0", 6), // 0 USDT
                discount: 0,
                isVIP: false,
                image: "ipfs://QmY328jAjbgFvQLD1yuauCUAxyiQT8kEdtZzde1Xy2QkPb",
                active: true
            }
        ];

        console.log("Initializing templates one by one...");
        
        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            console.log(`\nInitializing template ${template.id}: ${template.name}`);

             // Check if template already exists
              
              console.log('Existing template object: ', existingTemplate);
             const existingTemplate = await contract.getTemplate(template.id);
             if (existingTemplate.name !== "") {
                 console.log(`Template ${template.id} already exists. Skipping.`);
             } else {
                console.log(`Price: ${ethers.formatUnits(template.price, 6)} USDT`);
                console.log(`Base Balance: ${ethers.formatUnits(template.baseBalance, 6)} USDT`);

      
         try {
    
                const tx = await contract.addTemplate(
                        template.id,
                        template.name,
                        template.baseBalance,
                        template.price,
                        template.discount,
                        template.isVIP,
                        template.image,
                        template.active,
                       { 
                            gasLimit: 3000000,
                            gasPrice: ethers.parseUnits("100", "gwei")
                        }
                    );

                    console.log(`Transaction hash: ${tx.hash}`);
                    console.log("Waiting for confirmation...");

               
     const receipt = await tx.wait();
                    console.log(`Template ${template.id} created successfully! Gas used: ${receipt.gasUsed.toString()}`);

                    // Verify template was created
                    const createdTemplate = await contract.getTemplate(template.id);
                    console.log("\nVerifying created template:");
                    console.log(`Name: ${createdTemplate.name}`);
                    console.log(`Base Balance: ${ethers.formatUnits(createdTemplate.baseBalance, 6)} USDT`);
                    console.log(`Price: ${ethers.formatUnits(createdTemplate.price, 6)} USDT`);
                    console.log(`Discount: ${createdTemplate.discount}%`);
                    console.log(`Is VIP: ${createdTemplate.isVIP}`);
                    console.log(`Active: ${createdTemplate.active}`);
                } catch (error) {
                    console.error(`Error creating template ${template.id}:`, error.message);
                    throw error;
                 }
            }
        }

        // Add USDT token support
        const usdtAddress = "0x9638ccCFD1AeB100f9210d611e94C22F7eC4c71E"; // USDT contract on Polygon Amoy
        console.log("\nAdding USDT as supported token...");
        
        try {
            const addTokenTx = await contract.addSupportedToken(usdtAddress, {
                gasLimit: 2000000,
                gasPrice: ethers.parseUnits("100", "gwei")
            });
            
            console.log(`Transaction hash: ${addTokenTx.hash}`);
            await addTokenTx.wait();
            console.log("USDT token added successfully!");

            // Set USDT as payment token for templates
            console.log("\nSetting USDT as payment token for templates...");
            for (const template of templates) {
                const setTokenTx = await contract.setTemplatePaymentToken(
                    template.id, 
                    usdtAddress,
                    {
                        gasLimit: 2000000,
                        gasPrice: ethers.parseUnits("100", "gwei")
                    }
                );
                await setTokenTx.wait();
                console.log(`Set USDT as payment token for template ${template.id}`);
            }
        } catch (error) {
            console.error("Error adding USDT token:", error.message);
        }

        console.log("\nTemplate initialization completed successfully! 🎉");

    } catch (error) {
        console.error("\nTemplate initialization failed!");
        console.error("Error details:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });