// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import {SubsidyProgram} from "../src/SubsidyProgram.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {MockERC20, OtherMock} from "../test/mock/MockERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeploySubsidyProgramTestnet is Script {
    uint256 constant INITIAL_SUPPLY = 1e5;
    address tokenAddress;
    address token2Address;

    // For testing, use mock address for SwapRouter
    // In production, this would be the actual SwapRouter address
    address constant MOCK_SWAP_ROUTER = address(0x1111111111111111111111111111111111111111);

    function run() public returns (SubsidyProgram, address, address) {
        return run(tx.origin);
    }

    function run(address _owner) public returns (SubsidyProgram, address, address) {
        vm.startBroadcast();
        MockERC20 mockToken = new MockERC20(INITIAL_SUPPLY);
        OtherMock mockToken2 = new OtherMock(INITIAL_SUPPLY);
        vm.stopBroadcast();
        tokenAddress = address(mockToken);
        token2Address = address(mockToken2);

        vm.startBroadcast();
        
        // Deploy implementation
        SubsidyProgram implementation = new SubsidyProgram();
        
        // Prepare initialization data
        bytes memory initData = abi.encodeCall(
            SubsidyProgram.initialize,
            (tokenAddress, MOCK_SWAP_ROUTER, _owner)
        );
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        
        // Cast proxy to SubsidyProgram interface
        SubsidyProgram subsidyProgram = SubsidyProgram(address(proxy));
        
        vm.stopBroadcast();

        console.log("Subsidy program implementation deployed at: ", address(implementation));
        console.log("Subsidy program proxy deployed at: ", address(subsidyProgram));

        return (subsidyProgram, tokenAddress, token2Address);
    }
}

contract DeploySubsidyProgram is Script {
    address token = vm.envAddress("TOKEN_ADDRESS");
    address swapRouter = vm.envAddress("SWAP_ROUTER_ADDRESS");
    
    function run() public returns (SubsidyProgram, address) {
        // Get owner from env or use tx.origin (the EOA that initiated the transaction)
        address initialOwner = vm.envOr("INITIAL_OWNER", tx.origin);
        
        vm.startBroadcast();
        
        // Deploy implementation
        SubsidyProgram implementation = new SubsidyProgram();
        
        // Prepare initialization data
        bytes memory initData = abi.encodeCall(
            SubsidyProgram.initialize,
            (token, swapRouter, initialOwner)
        );
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        
        // Cast proxy to SubsidyProgram interface
        SubsidyProgram subsidyProgram = SubsidyProgram(address(proxy));
        
        vm.stopBroadcast();

        console.log("Subsidy program implementation deployed at: ", address(implementation));
        console.log("Subsidy program proxy deployed at: ", address(subsidyProgram));
        console.log("Owner set to: ", initialOwner);

        return (subsidyProgram, token);
    }
}
