const config = {
    defaultTemplates: [
        {
            id: 1,
            name: "Gold",
            baseBalance: "3000000000", // 3000 USDT (6 decimals)
            price: "3000000000",
            discount: 6,
            isVIP: true,
            metadataURI: "",
            active: true
        },
        {
            id: 2,
            name: "Platinum",
            baseBalance: "5000000000", // 5000 USDT (6 decimals)
            price: "5000000000",
            discount: 9,
            isVIP: true,
            metadataURI: "",
            active: true
        },
        {
            id: 3,
            name: "Black",
            baseBalance: "1000000000", // 1000 USDT (6 decimals)
            price: "1000000000",
            discount: 0,
            isVIP: false,
            metadataURI: "",
            active: true
        },
        {
            id: 4,
            name: "Eventbrite",
            baseBalance: "0",
            price: "0",
            discount: 0,
            isVIP: false,
            metadataURI: "",
            active: true
        }
    ]
};

module.exports = config;