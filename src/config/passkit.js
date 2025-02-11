require('dotenv').config();

module.exports = {
    passTypeIdentifiers: {
        gold: 'pass.com.wavex.gold',
        platinum: 'pass.com.wavex.platinum',
        black: 'pass.com.wavex.black',
        eventbrite: 'pass.com.wavex.eventbrite'
    },
    teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
    certificates: {
        wwdr: process.env.WWDR_CERTIFICATE_PATH,
        signerCert: process.env.SIGNER_CERTIFICATE_PATH,
        signerKey: process.env.SIGNER_KEY_PATH,
        signerKeyPassphrase: process.env.SIGNER_KEY_PASSPHRASE
    },
    webServiceURL: process.env.PASS_WEBSERVICE_URL
};