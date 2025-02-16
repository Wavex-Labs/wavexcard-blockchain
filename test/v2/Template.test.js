// test/v2/Template.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Template Contract Tests", function () {
    let wavexNFTV2;
    let owner;

    beforeEach(async function () {
        const WaveXNFTV2 = await ethers.getContractFactory("WaveXNFTV2");
        wavexNFTV2 = await WaveXNFTV2.deploy();
        await wavexNFTV2.waitForDeployment();
        [owner] = await ethers.getSigners();

        // Initialize default templates
        await wavexNFTV2.initializeDefaultTemplates();

        // Create a template for modification tests (using templateId = 3)
        await wavexNFTV2.addTemplate(
            3,
            "Gold",
            ethers.parseUnits("1000", "ether"),
            ethers.parseUnits("1000", "ether"),
            0,
            false,
            "ipfs://template-gold.json",
            true
        );
    });

    it("Should create a template", async function () {
        const templateId = 4; // Use templateId = 4 for create test
        const templateName = "Silver";
        const baseBalance = ethers.parseUnits("500", "ether");
        const price = ethers.parseUnits("500", "ether");
        const discount = 5;
        const isVIP = false;
        const metadataURI = "ipfs://template-silver.json";
        const active = true;

        const tx = await wavexNFTV2.addTemplate(
            templateId,
            templateName,
            baseBalance,
            price,
            discount,
            isVIP,
            metadataURI,
            active
        );
        await tx.wait();

        await expect(tx)
            .to.emit(wavexNFTV2, "TemplateCreated")
            .withArgs(
                templateId,
                templateName,
                baseBalance,
                price,
                discount,
                isVIP,
                metadataURI,
                active
            );

        const template = await wavexNFTV2.getTemplate(templateId);
        expect(template.name).to.equal(templateName);
        expect(template.baseBalance).to.equal(baseBalance);
        expect(template.price).to.equal(price);
        expect(template.discount).to.equal(discount);
        expect(template.isVIP).to.equal(isVIP);
        expect(template.metadataURI).to.equal(metadataURI);
        expect(template.active).to.equal(active);
    });

    it("Should modify a template", async function () {
        const templateId = 3; // Modify template with templateId = 3
        const updatedPrice = ethers.parseUnits("1200", "ether");
        const updatedDiscount = 10;
        const updatedActive = false;

        const tx = await wavexNFTV2.modifyTemplate(
            templateId,
            "Gold Updated", // name can be updated too
            ethers.parseUnits("1000", "ether"), // baseBalance remains same
            updatedPrice,
            updatedDiscount,
            false, // isVIP remains same
            "ipfs://template-gold-updated.json", // metadataURI updated
            updatedActive
        );
        await tx.wait();

        await expect(tx)
            .to.emit(wavexNFTV2, "TemplateUpdated")
            .withArgs(
                templateId,
                "Gold Updated",
                ethers.parseUnits("1000", "ether"),
                updatedPrice,
                updatedDiscount,
                false,
                "ipfs://template-gold-updated.json",
                updatedActive
            );

        const template = await wavexNFTV2.getTemplate(templateId);
        expect(template.price).to.equal(updatedPrice);
        expect(template.discount).to.equal(updatedDiscount);
        expect(template.active).to.equal(updatedActive);
    });

    it("Should get template count", async function () {
        const initialTemplateCount = await wavexNFTV2.getTemplateCount();
        expect(initialTemplateCount).to.equal(3); // Initial templates are now 3

        await wavexNFTV2.addTemplate(
            4, // Use templateId = 4 for create test here as well
            "Silver",
            ethers.parseUnits("500", "ether"),
            ethers.parseUnits("500", "ether"),
            5,
            false,
            "ipfs://template-silver.json",
            true
        );

        const updatedTemplateCount = await wavexNFTV2.getTemplateCount();
        expect(updatedTemplateCount).to.equal(4); // Updated count should be 4
    });
});