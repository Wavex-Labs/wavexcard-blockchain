const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { 
    getDeploymentGasOptions, 
    estimateDeploymentGas,
    waitForTransaction 
} = require("../utils/gasUtils");

async function main() {
    try {
        console.log("Starting deployment process...");

        // Deploy WaveXLibUpdated
        console.log("\nDeploying WaveXLibUpdated...");
        const WaveXLibUpdated = await hre.ethers.getContractFactory("WaveXLibUpdated");
        
        // Estimate gas for library deployment
        const libGasLimit = await estimateDeploymentGas(WaveXLibUpdated);
        const libGasOptions = await getDeploymentGasOptions({ gasLimit: libGasLimit });
        
        console.log("Deploying library with gas settings:", {
            gasPrice: libGasOptions.gasPrice.toString(),
            gasLimit: libGasOptions.gasLimit.toString()
        });

        const libUpdated = await WaveXLibUpdated.deploy(libGasOptions);
        const libReceipt = await waitForTransaction(libUpdated.deploymentTransaction());
        console.log("WaveXLibUpdated deployed to:", await libUpdated.getAddress());
        console.log("Transaction hash:", libReceipt.hash);
        console.log("Gas used:", libReceipt.gasUsed.toString());

        // Deploy WaveXNFTV2Updated with library
        console.log("\nDeploying WaveXNFTV2Updated...");
        const WaveXNFTV2Updated = await hre.ethers.getContractFactory("WaveXNFTV2Updated", {
            libraries: {
                WaveXLibUpdated: await libUpdated.getAddress(),
            },
        });

        // Estimate gas for contract deployment
        const contractGasLimit = await estimateDeploymentGas(WaveXNFTV2Updated);
        const contractGasOptions = await getDeploymentGasOptions({ gasLimit: contractGasLimit });

        console.log("Deploying contract with gas settings:", {
            gasPrice: contractGasOptions.gasPrice.toString(),
            gasLimit: contractGasOptions.gasLimit.toString()
        });

        const nftV2Updated = await WaveXNFTV2Updated.deploy(contractGasOptions);
        const contractReceipt = await waitForTransaction(nftV2Updated.deploymentTransaction());
        console.log("WaveXNFTV2Updated deployed to:", await nftV2Updated.getAddress());
        console.log("Transaction hash:", contractReceipt.hash);
        console.log("Gas used:", contractReceipt.gasUsed.toString());

        // Initialize default templates
        console.log("\nInitializing default templates...");
        const initOptions = await getDeploymentGasOptions();
        const initTx = await nftV2Updated.initializeDefaultTemplates(initOptions);
        const initReceipt = await waitForTransaction(initTx);
        console.log("Default templates initialized");
        console.log("Transaction hash:", initReceipt.hash);
        console.log("Gas used:", initReceipt.gasUsed.toString());

        // Save deployment info
        const deploymentInfo = {
            network: hre.network.name,
            WaveXLibUpdated: await libUpdated.getAddress(),
            WaveXNFTV2Updated: await nftV2Updated.getAddress(),
            transactions: {
                libraryDeploy: {
                    hash: libReceipt.hash,
                    gasUsed: libReceipt.gasUsed.toString(),
                    gasPrice: libGasOptions.gasPrice.toString()
                },
                contractDeploy: {
                    hash: contractReceipt.hash,
                    gasUsed: contractReceipt.gasUsed.toString(),
                    gasPrice: contractGasOptions.gasPrice.toString()
                },
                templateInit: {
                    hash: initReceipt.hash,
                    gasUsed: initReceipt.gasUsed.toString(),
                    gasPrice: initOptions.gasPrice.toString()
                }
            },
            timestamp: new Date().toISOString()
        };

        const deploymentPath = path.join(__dirname, '../../deployments', `${hre.network.name}_deployment_updated.json`);
        fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("\nDeployment info saved to:", deploymentPath);

        // Verify contracts on Polygonscan if API key is available
        if (process.env.POLYGONSCAN_API_KEY) {
            console.log("\nWaiting before verification...");
            // Wait for 5 blocks before verification
            await new Promise(resolve => setTimeout(resolve, 30000));

            console.log("Verifying contracts on Polygonscan...");
            try {
                await hre.run("verify:verify", {
                    address: await libUpdated.getAddress(),
                    contract: "contracts/libraries/WaveXLibUpdated.sol:WaveXLibUpdated"
                });
                console.log("WaveXLibUpdated verified");

                await hre.run("verify:verify", {
                    address: await nftV2Updated.getAddress(),
                    contract: "contracts/v2/WaveXNFTV2Updated.sol:WaveXNFTV2Updated",
                    constructorArguments: []
                });
                console.log("WaveXNFTV2Updated verified");
            } catch (error) {
                console.log("Verification error:", error);
            }
        }

        return deploymentInfo;
    } catch (error) {
        console.error("\nDeployment failed with error:", error);
        throw error;
    }
}

// Execute deployment
main()
    .then((deploymentInfo) => {
        console.log("\nDeployment completed successfully!");
        console.log("Deployment Info:", deploymentInfo);
        process.exit(0);
    })
    .catch((error) => {
        console.error("\nDeployment failed:", error);
        process.exit(1);
    });