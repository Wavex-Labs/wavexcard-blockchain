# WaveX Project Flowchart

```mermaid
graph TD
    subgraph Smart_Contracts
        WaveXNFTV2[WaveXNFTV2 Contract]
        WaveXNFTV3[WaveXNFTV3 Contract]
        WaveXLib[WaveXLib Library]
        IERC20[IERC20 Interface]
    end

    subgraph Core_Functions
        Templates[Template Management]
        Minting[NFT Minting]
        Events[Event Management]
        Merchants[Merchant Management]
    end

    subgraph Integration_Services
        AppleWallet[Apple Wallet Service]
        Metadata[Metadata Service]
        IPFS[IPFS/Pinata]
    end

    subgraph Deployment_Flow
        Deploy[Contract Deployment]
        Setup[Merchant Setup]
        Init[Template Initialization]
    end

    subgraph Testing
        UnitTests[Unit Tests]
        MockContracts[Mock Contracts]
        TestScripts[Test Scripts]
    end

    %% Core Contract Flow
    WaveXNFTV2 --> |Uses| WaveXLib
    WaveXNFTV3 --> |Uses| WaveXLib
    WaveXNFTV2 --> |Implements| IERC20
    WaveXNFTV3 --> |Implements| IERC20

    %% Template and Minting Flow
    Templates --> |Creates| Minting
    Minting --> |Generates| Metadata
    Metadata --> |Stores on| IPFS

    %% Event Management Flow
    Events --> |Requires| Merchants
    Events --> |Creates| Minting
    Events --> |Updates| AppleWallet

    %% Merchant Flow
    Deploy --> |Configures| Setup
    Setup --> |Authorizes| Merchants
    Merchants --> |Can Create| Templates
    Merchants --> |Can Manage| Events

    %% Integration Flow
    Minting --> |Triggers| AppleWallet
    AppleWallet --> |Updates| Metadata

    %% Testing Flow
    UnitTests --> |Uses| MockContracts
    TestScripts --> |Validates| Core_Functions

    %% Deployment Process
    Deploy --> |Initializes| Init
    Init --> |Configures| Templates

    style WaveXNFTV2 fill:#f9f,stroke:#333,stroke-width:2px
    style WaveXNFTV3 fill:#f9f,stroke:#333,stroke-width:2px
    style AppleWallet fill:#bbf,stroke:#333,stroke-width:2px
    style Events fill:#bfb,stroke:#333,stroke-width:2px
    style Merchants fill:#bfb,stroke:#333,stroke-width:2px