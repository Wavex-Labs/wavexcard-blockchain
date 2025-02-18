const { ethers, network } = require("hardhat");
const { gasManager } = require('../utils/gasUtils');

class MintError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'MintError';
        this.code = code;
        this.details = details;
    }
}

const USDT_DECIMALS = 6;
const CONTRACT_DECIMALS = 18;

const mint = async () => {
    try {
        // Ensure network connection
        await ethers.provider.getNetwork();
        
        const [signer] = await ethers.getSigners();
        console.log(`Using signer: ${signer.address}`);
        console.log(`Current Network: ${network.name}`);

        // Required environment variables
        const requiredVars = [
            'MINT_FROM_TEMPLATE_ID',
            'MINT_RECIPIENT_ADDRESS',
            'USDT_CONTRACT_ADDRESS',
            'WAVEX_NFT_V3_ADDRESS'
        ];

        requiredVars.forEach(varName => {
            if (!process.env[varName]) {
                throw new Error(`Missing required environment variable: ${varName}`);
            }
        });

        // Initialize contracts and parameters
        const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;
        const nftAddress = process.env.WAVEX_NFT_V3_ADDRESS;
        const templateId = ethers.toBigInt(process.env.MINT_FROM_TEMPLATE_ID);
        const recipientAddress = process.env.MINT_RECIPIENT_ADDRESS;

        console.log('Contract Addresses:', {
            USDT: usdtAddress,
            NFT: nftAddress,
            templateId: templateId.toString(),
            recipient: recipientAddress
        });

        // Contract initialization
        const USDT = await ethers.getContractAt("IERC20V3", usdtAddress, signer);
        
        // Get the contract factory to ensure ABI is loaded
        const WaveXNFTV3Factory = await ethers.getContractFactory("WaveXNFTV3");
        
        // Debug logging for interface
        console.log('\n--- Contract Interface Debug ---');
        const mintFunction = WaveXNFTV3Factory.interface.fragments.find(f => f.name === 'mintFromTemplate');
        if (!mintFunction) {
            throw new Error('Contract interface missing mintFromTemplate function');
        }
        
        console.log('Found mintFromTemplate function:', {
            name: mintFunction.name,
            inputs: mintFunction.inputs
        });
        
        const nftContract = WaveXNFTV3Factory.attach(nftAddress).connect(signer);

        // Verify contract deployment
        const usdtCode = await ethers.provider.getCode(usdtAddress);
        const nftCode = await ethers.provider.getCode(nftAddress);
        
        if (usdtCode === '0x') throw new MintError('USDT contract not deployed', 'CONTRACT_NOT_DEPLOYED');
        if (nftCode === '0x') throw new MintError('NFT contract not deployed', 'CONTRACT_NOT_DEPLOYED');

        // Pre-mint checks
        console.log("\n--- Pre-Mint Validation ---");

        // Get and verify template
        let template;
        try {
            template = await nftContract.getTemplate(templateId);
            console.log('Template details:', {
                name: template[0],
                baseBalance: template[1].toString(),
                price: template[2].toString(),
                active: template[6]
            });

            if (!template[6]) {
                throw new MintError('Template is not active', 'TEMPLATE_INACTIVE');
            }
        } catch (error) {
            throw new MintError(
                `Template verification failed: ${error.message}`, 
                'TEMPLATE_ERROR'
            );
        }

        // Price calculations
        const templatePrice = template[2];
        const templatePriceIn6 = ethers.parseUnits(
            ethers.formatUnits(templatePrice, CONTRACT_DECIMALS),
            USDT_DECIMALS
        );

        // Balance checks
        const usdtBalance = await USDT.balanceOf(signer.address);
        
        console.log('\n--- Price and Balance Details ---');
        console.log({
            templatePrice: ethers.formatUnits(templatePrice, CONTRACT_DECIMALS),
            requiredUSDT: ethers.formatUnits(templatePriceIn6, USDT_DECIMALS),
            currentBalance: ethers.formatUnits(usdtBalance, USDT_DECIMALS)
        });

        if (usdtBalance < templatePriceIn6) {
            throw new MintError(
                'Insufficient USDT balance', 
                'INSUFFICIENT_BALANCE',
                {
                    required: ethers.formatUnits(templatePriceIn6, USDT_DECIMALS),
                    available: ethers.formatUnits(usdtBalance, USDT_DECIMALS)
                }
            );
        }

        // Allowance management
        const currentAllowance = await USDT.allowance(signer.address, nftAddress);
        console.log('\n--- Allowance Check ---');
        console.log(`Current allowance: ${ethers.formatUnits(currentAllowance, USDT_DECIMALS)} USDT`);

        if (currentAllowance < templatePriceIn6) {
            console.log('Initiating USDT approval...');
            const gasConfig = await gasManager.getGasConfig();
            
            const approveTx = await USDT.approve(
                nftAddress,
                templatePriceIn6,
                {
                    maxFeePerGas: gasConfig.maxFeePerGas,
                    maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas
                }
            );
            
            console.log('Waiting for approval confirmation...');
            const approveReceipt = await approveTx.wait();
            console.log('Approval confirmed:', approveReceipt.hash);
        }

        // Contract state verification
        const isPaused = await nftContract.paused();
        if (isPaused) {
            throw new MintError('Contract is paused', 'CONTRACT_PAUSED');
        }

        // Mint transaction preparation
        console.log('\n--- Preparing Mint Transaction ---');
        const gasConfig = await gasManager.getGasConfig();
        console.log('Gas prices:', {
            maxFeePerGas: ethers.formatUnits(gasConfig.maxFeePerGas, 'gwei'),
            maxPriorityFeePerGas: ethers.formatUnits(gasConfig.maxPriorityFeePerGas, 'gwei')
        });

        const metadataURI = `ipfs://template-${templateId}`;

        // Debug logging
        console.log('Preparing mint transaction parameters:', {
            templateId: templateId.toString(),
            recipient: recipientAddress,
            metadataURI,
            paymentToken: usdtAddress
        });

        // Execute mint transaction
        const mintTx = await nftContract.mintFromTemplate(
            templateId,
            recipientAddress,
            metadataURI,
            usdtAddress,
            {
                maxFeePerGas: gasConfig.maxFeePerGas,
                maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas,
                gasLimit: 1000000,
                value: 0
            }
        );

        console.log('Mint transaction submitted:', mintTx.hash);

        console.log('Waiting for confirmation...');
        const receipt = await mintTx.wait();
        
        // Process receipt for token ID
        const transferEvent = receipt.logs.find(
            log => log.topics[0] === ethers.id("Transfer(address,address,uint256)")
        );

        const tokenId = transferEvent ? ethers.toBigInt(transferEvent.topics[3]) : null;

        console.log('\n--- Mint Complete ---');
        console.log({
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            tokenId: tokenId ? tokenId.toString() : null,
            gasUsed: receipt.gasUsed.toString()
        });

        return {
            success: true,
            transactionHash: receipt.hash,
            tokenId: tokenId ? tokenId.toString() : null,
            blockNumber: receipt.blockNumber
        };

    } catch (error) {
        console.error("\n--- Mint Error ---");
        console.error(error);
        
        if (error.transaction) {
            console.error('Transaction details:', {
                to: error.transaction.to,
                from: error.transaction.from,
                data: error.transaction.data
            });
        }

        return {
            success: false,
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                details: error.details || {}
            }
        };
    }
};

// Script execution
if (require.main === module) {
    mint()
        .then(result => {
            console.log('\n--- Final Result ---');
            console.log(result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n--- Fatal Error ---');
            console.error(error);
            process.exit(1);
        });
}

module.exports = { mint };