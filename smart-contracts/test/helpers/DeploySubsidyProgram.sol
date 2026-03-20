// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SubsidyProgram} from "../../src/SubsidyProgram.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

library DeploySubsidyProgram {
    function deploy(
        address _tokenAddress,
        address _swapRouter,
        address _initialOwner
    ) internal returns (SubsidyProgram) {
        // Deploy implementation
        SubsidyProgram implementation = new SubsidyProgram();
        
        // Prepare initialization data
        bytes memory initData = abi.encodeCall(
            SubsidyProgram.initialize,
            (_tokenAddress, _swapRouter, _initialOwner)
        );
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        
        // Cast proxy to SubsidyProgram interface
        return SubsidyProgram(address(proxy));
    }
}

