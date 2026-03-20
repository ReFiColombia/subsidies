// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import "forge-std/StdCheats.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SubsidyProgram} from "../../src/SubsidyProgram.sol";
import {DeploySubsidyProgram} from "../helpers/DeploySubsidyProgram.sol";

// This test is designed to run against a CELO mainnet fork with real Uniswap V3.
// Provide the following env vars before running:
//  - CELO_RPC (or ensure foundry.toml has rpc_endpoints.celo)
//  - CELO_UNISWAP_V3_ROUTER
//  - CELO_TOKEN_OUT (the cCop token in your deployment, or any ERC20 to receive)
//  - CELO_TOKEN_IN (an ERC20 with deep liquidity vs TOKEN_OUT)
//  - CELO_FEE_TIER (e.g., 500, 3000, 10000)
//  - CELO_TOKEN_IN_WHALE (an address holding TOKEN_IN for funding)

interface IQuoterV2 {
    struct QuoteExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint256 amount;
        uint24 fee;
        uint160 sqrtPriceLimitX96;
    }

    function quoteExactOutputSingle(QuoteExactOutputSingleParams memory params)
        external
        returns (uint256 amountIn);
}

contract SubsidyProgramCeloFork is Test {
    SubsidyProgram subsidyProgram;
    address ROUTER;
    IERC20 CCOP;
    IERC20 USDGLO;
    uint24 constant FEE_TIER = 100;
    uint256 constant TOKEN_AMOUNT = 500;
    address TOKEN_IN_WHALE;

    address BENEFICIARY = address(0xBEEF);

    function setUp() external {
        vm.createSelectFork("celo");

        ROUTER = vm.envAddress("ROUTER_ADDRESS");
        CCOP = IERC20(vm.envAddress("CCOP_ADDRESS"));
        USDGLO = IERC20(vm.envAddress("USDGLO_ADDRESS"));
        // FEE_TIER = uint24(vm.envUint("CELO_FEE_TIER"));
        // TOKEN_IN_WHALE = vm.envAddress("CELO_TOKEN_IN_WHALE");

        deal(address(CCOP), address(this), 1e6);
        deal(address(USDGLO), address(this), 1e6);

        subsidyProgram = DeploySubsidyProgram.deploy(address(CCOP), ROUTER, address(this));
    }

    function testFork_claimViaRealSwap() external {
        // Configure program
        subsidyProgram.setClaimableAmount(TOKEN_AMOUNT);

        subsidyProgram.addToken(address(USDGLO));
        subsidyProgram.setTokenFeeTier(address(USDGLO), FEE_TIER);
        subsidyProgram.addBeneficiary(BENEFICIARY);

        USDGLO.approve(address(subsidyProgram), type(uint256).max);
        subsidyProgram.addFunds(TOKEN_AMOUNT / 2, address(USDGLO));

        // Beneficiary claims; program should swap TOKEN_IN into TOKEN_OUT using real router
        vm.prank(BENEFICIARY);
        subsidyProgram.claimSubsidy();

        // Verify beneficiary received TOKEN_OUT
        assertGt(CCOP.balanceOf(BENEFICIARY), 0);
    }
}


