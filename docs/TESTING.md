# WaveX NFT V2 Testing Guide

## Testing Framework

WaveX NFT V2 smart contracts are tested using the Hardhat testing framework. Hardhat provides a local development network, testing utilities, and assertion libraries to facilitate writing and running unit tests for Solidity contracts.

## Test File Structure

Test files are located in the `test/v2/` directory. Each test file typically focuses on testing a specific aspect or functionality of the smart contract. 
- `Template.test.js`: Contains test cases for template management functionalities.
- `Event.test.js`: Contains test cases for event management functionalities.
- `Balance.test.js`: (To be implemented) Will contain test cases for balance management functionalities.
- `Metadata.test.js`: (To be implemented) Will contain test cases for metadata handling.
- `Integration.test.js`: (To be implemented) Will contain integration tests across different contract functionalities.

## Running Tests

To run the tests, use the following command in the project root directory:

```bash
npx hardhat test
```

This command will execute all test files in the `test/v2/` directory and report the test results.

To run a specific test file, use:

```bash
npx hardhat test test/v2/<test-file-name>.js
```

Example: To run `Template.test.js`:

```bash
npx hardhat test test/v2/Template.test.js
```

## Existing Test Suites Overview

### 1. `Template.test.js`

- **Purpose**: Tests the template management functionalities of the `WaveXNFTV2` contract.
- **Test Cases**:
    - Should create a template
    - Should modify a template
    - Should get template count
    - ... (More test cases to be added for template functionalities and validations)

### 2. `Event.test.js`

- **Purpose**: Tests the event management functionalities of the `WaveXNFTV2` contract.
- **Test Cases**:
    - Should create an event
    - Should purchase event entrance
    - Should fail to purchase event entrance if insufficient balance
    - Should fail to purchase event entrance if event is full
    - ... (More test cases to be added for event functionalities and validations)

### 3. (Future Test Suites)

- `Balance.test.js`: Will test balance management functionalities (top-up, payment processing, balance validation).
- `Metadata.test.js`: Will test metadata handling functionalities (metadata generation, update, validation).
- `Integration.test.js`: Will include integration tests to verify interactions between different contract functionalities and components.

## Guidelines for Writing New Tests

- **Test-Driven Development (TDD)**: Ideally, write tests before implementing the actual contract functionality.
- **Test Coverage**: Aim for high test coverage to ensure all critical functionalities and edge cases are tested.
- **Unit Tests**: Focus on writing unit tests that test individual functions and components in isolation.
- **Descriptive Test Names**: Use clear and descriptive test names (e.g., "Should create a template", "Should fail to mint if price is not met") to clearly indicate the purpose of each test case.
- **Assertions**: Use `expect` assertions from Chai library to validate contract behavior and expected outcomes.
- **Error Handling**: Test for error conditions and ensure that the contract handles errors gracefully and reverts transactions when necessary.
- **Event Assertions**: Assert that events are emitted correctly with expected parameters when state changes occur.
- **Gas Optimization**: Consider gas usage and optimize test cases for efficiency.

By following these guidelines and expanding the test suite, you can ensure the robustness and reliability of the WaveX NFT V2 smart contract.