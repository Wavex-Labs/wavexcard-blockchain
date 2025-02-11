const PassKit = require('passkit-generator');
const path = require('path');
const passKitConfig = require('../../../config/passkit');

class PassKitUtils {
    static async createPass(templateId, tokenId, passData) {
        try {
            const passTypeIdentifier = passKitConfig.passTypeIdentifiers[templateId];
            const templatePath = path.join(process.cwd(), 'certificates', passTypeIdentifier);

            const pass = await PassKit.from({
                templatePath,
                certificates: {
                    wwdr: passKitConfig.certificates.wwdr,
                    signerCert: passKitConfig.certificates.signerCert,
                    signerKey: passKitConfig.certificates.signerKey,
                    signerKeyPassphrase: passKitConfig.certificates.signerKeyPassphrase
                }
            });

            // Set pass data
            Object.entries(passData).forEach(([key, value]) => {
                if (value.label && value.value) {
                    pass.primaryFields.push({
                        key,
                        label: value.label,
                        value: value.value,
                        ...(value.currencyCode && { currencyCode: value.currencyCode })
                    });
                }
            });

            return pass;
        } catch (error) {
            console.error('Error creating pass:', error);
            throw error;
        }
    }

    static async generatePassBuffer(pass) {
        try {
            return await pass.generate();
        } catch (error) {
            console.error('Error generating pass buffer:', error);
            throw error;
        }
    }
}

module.exports = PassKitUtils;