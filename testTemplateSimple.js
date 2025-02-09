// scripts/test/testTemplateSimple.js
async function main() {
    console.log('\nStarting simple template test...');

    try {
        // Get contract instance
        const WaveXNFT = await ethers.getContractFactory("WaveXNFTV2");
        const wavexNFT = WaveXNFT.attach("0x4a821854B43553544Aa9Bacf4f51497F9fD9a714");

        console.log('Contract attached');

        // Template parameters
        const templateId = 1;
        const name = "Gold";
        const baseBalance = ethers.parseEther("20");
        const price = ethers.parseEther("20");
        const discount = 0;
        const isVIP = false;
        const metadataURI = "template-1";
        const active = true;

        console.log('\nTemplate parameters:', {
            templateId,
            name,
            baseBalance: ethers.formatEther(baseBalance),
            price: ethers.formatEther(price),
            discount,
            isVIP,
            metadataURI,
            active
        });

        // Send transaction
        console.log('\nSending transaction...');
        const tx = await wavexNFT.addTemplate(
            templateId,
            name,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI,
            active
        );

        console.log('Transaction hash:', tx.hash);
        console.log('Waiting for confirmation...');

        const receipt = await tx.wait();
        console.log('\nTransaction confirmed!');
        console.log('Block number:', receipt.blockNumber);
        console.log('Gas used:', receipt.gasUsed.toString());

        // Verify template
        console.log('\nVerifying template...');
        const template = await wavexNFT.getTemplate(templateId);
        console.log('Template verified:', {
            name: template[0],
            baseBalance: ethers.formatEther(template[1]),
            price: ethers.formatEther(template[2]),
            discount: Number(template[3]),
            isVIP: template[4],
            metadataURI: template[5],
            active: template[6]
        });

    } catch (error) {
        console.error('\nError:', error);
        if (error.data) {
            console.error('Error data:', error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });