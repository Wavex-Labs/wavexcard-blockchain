const { ethers, network } = require("hardhat");

async function topUpUSDT() {
    try {
        const [signer] = await ethers.getSigners();
        console.log(`Using signer: ${signer.address}`);
        console.log(`Current Network: ${network.name}`);

        const usdtAddress = process.env.USDT_CONTRACT_ADDRESS;
        if (!usdtAddress) {
            throw new Error("Missing USDT_CONTRACT_ADDRESS environment variable");
        }

        // Get USDT contract instance
        const usdtContract = await ethers.getContractAt("IERC20V3", usdtAddress, signer);

        // Check initial balance
        const initialBalance = await usdtContract.balanceOf(signer.address);
        console.log(`\nInitial USDT Balance: ${ethers.formatUnits(initialBalance, 6)} USDT`);

        // Since this is a test network, we can try to mint USDT directly if the contract supports it
        try {
            // Try to call the mint function (this will only work if the USDT contract is a test token with mint function)
            const mintAmount = ethers.parseUnits("3000000", 6); // 3M USDT to cover the Gold template
            const mintTx = await usdtContract.mint(signer.address, mintAmount);
            await mintTx.wait();
            console.log(`\nMinted ${ethers.formatUnits(mintAmount, 6)} USDT`);
        } catch (mintError) {
            console.log("\nCouldn't mint USDT directly. This is expected on mainnet.");
            console.log("To get more USDT, you need to:");
            console.log("1. Either use a faucet if available on this network");
            console.log("2. Or purchase USDT from an exchange");
            console.log("3. Or request USDT from the contract owner/admin");
            throw mintError;
        }

        // Check final balance
        const finalBalance = await usdtContract.balanceOf(signer.address);
        console.log(`\nFinal USDT Balance: ${ethers.formatUnits(finalBalance, 6)} USDT`);

        const difference = finalBalance - initialBalance;
        console.log(`Balance Change: ${ethers.formatUnits(difference, 6)} USDT`);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    topUpUSDT()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { topUpUSDT };