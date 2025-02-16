// scripts/utils/verifyNetwork.js
const { gasManager } = require('./gasUtils');
const { networkManager } = require('./networkUtils');

async function main() {
    const networkName = await networkManager.getNetworkName();
    console.log("Current Network:", networkName);

    const networkConfig = networkManager.getNetworkConfig();
    console.log("Network Config:", networkConfig);

    const isConnected = await networkManager.verifyNetworkConnection();
    console.log("Network Connection Status:", isConnected ? "Connected" : "Not Connected");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });