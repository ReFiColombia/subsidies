// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SubsidyProgram} from "../../src/SubsidyProgram.sol";
import {Test, console} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockERC20} from "../mock/MockERC20.sol";
import {MockSwapRouter} from "../mock/MockSwapRouter.sol";
import {DeploySubsidyProgram} from "../helpers/DeploySubsidyProgram.sol";

contract SubsidyProgramSwapTest is Test {
    SubsidyProgram subsidyProgram;
    MockSwapRouter mockSwapRouter;
    IERC20 token1;
    IERC20 token2;
    IERC20 token3;

    uint256 constant INTERVAL_TIME = 2 weeks;
    uint256 constant TOKEN_AMOUNT = 500;
    uint256 constant TEN_YEARS = 365 * 10 days;

    address constant USER = address(1);

    function setUp() external {
        // Deploy mock swap router
        mockSwapRouter = new MockSwapRouter();

        // Deploy tokens
        vm.startBroadcast();
        MockERC20 mockToken1 = new MockERC20(1e6);
        MockERC20 mockToken2 = new MockERC20(1e6);
        MockERC20 mockToken3 = new MockERC20(1e6);
        vm.stopBroadcast();
        
        token1 = IERC20(address(mockToken1));
        token2 = IERC20(address(mockToken2));
        token3 = IERC20(address(mockToken3));
        
        // Deploy subsidy program
        subsidyProgram = DeploySubsidyProgram.deploy(address(token1), address(mockSwapRouter), msg.sender);
        
        // Give mock router some token1 (cCop) for swaps
        vm.startPrank(msg.sender);
        token1.transfer(address(mockSwapRouter), 100000);
        vm.stopPrank();
        
        // Ensure test contract has enough tokens for testing
        vm.startPrank(msg.sender);
        token1.transfer(address(this), 100000); // Give test contract tokens
        token2.transfer(address(this), 100000);
        token3.transfer(address(this), 100000);
        vm.stopPrank();
        
        // Add token2 to whitelist first
        vm.prank(msg.sender);
        subsidyProgram.addToken(address(token2));
        
        // Configure token2 fee tier
        vm.prank(msg.sender);
        subsidyProgram.setTokenFeeTier(address(token2), 3000); // 0.3% fee tier
    }

    function testSetTokenFeeTier() public {
        vm.prank(msg.sender);
        subsidyProgram.setTokenFeeTier(address(token2), 500); // 0.05% fee tier
        
        assertEq(subsidyProgram.tokenToFeeTier(address(token2)), 500);
    }

    function testSetTokenFeeTierFailsIfNotOwner() public {
        vm.expectRevert();
        subsidyProgram.setTokenFeeTier(address(token2), 500);
    }

    function testSetTokenFeeTierFailsIfTokenNotWhitelisted() public {
        address randomToken = address(0x123);
        vm.prank(msg.sender);
        vm.expectRevert("Token not whitelisted");
        subsidyProgram.setTokenFeeTier(randomToken, 500);
    }

    function testSetTokenFeeTierFailsForCCop() public {
        vm.prank(msg.sender);
        vm.expectRevert("Cannot set fee tier for cCop");
        subsidyProgram.setTokenFeeTier(address(token1), 500);
    }

    function testSwapWhenClaimingWithInsufficientCCop() public {
        vm.warp(TEN_YEARS);
        
        // Add funds - insufficient cCop, need to swap token2
        vm.startPrank(msg.sender);
        token1.approve(address(subsidyProgram), TOKEN_AMOUNT / 2); // Only half the needed cCop
        token2.approve(address(subsidyProgram), TOKEN_AMOUNT);
        
        subsidyProgram.addFunds(TOKEN_AMOUNT / 2, address(token1));
        subsidyProgram.addFunds(TOKEN_AMOUNT, address(token2));
        subsidyProgram.setClaimableAmount(TOKEN_AMOUNT);
        subsidyProgram.addBeneficiary(USER);
        vm.stopPrank();
        
        // Configure router to pull some token2 and send exact TOKEN_AMOUNT token1 to contract
        mockSwapRouter.setNextAmountIn(TOKEN_AMOUNT / 2);

        // Claim subsidy - should trigger swap of token2 to get remaining cCop needed
        vm.prank(USER);
        subsidyProgram.claimSubsidy();
        
        // Verify user received the full subsidy amount
        assertEq(token1.balanceOf(USER), TOKEN_AMOUNT);
        
        // Verify that token2 was partially consumed (swapped for cCop)
        uint256 remainingToken2 = token2.balanceOf(address(subsidyProgram));
        assertTrue(remainingToken2 < TOKEN_AMOUNT, "Token2 should have been partially consumed");
    }

    function testSwapFailsIfFeeTierNotSet() public {
        vm.warp(TEN_YEARS);
        
        // Add token3 to whitelist but don't set fee tier
        vm.prank(msg.sender);
        subsidyProgram.addToken(address(token3));
        
        // Add funds
        vm.startPrank(msg.sender);
        token3.approve(address(subsidyProgram), TOKEN_AMOUNT);
        subsidyProgram.addFunds(TOKEN_AMOUNT, address(token3));
        subsidyProgram.setClaimableAmount(TOKEN_AMOUNT);
        subsidyProgram.addBeneficiary(USER);
        vm.stopPrank();
        
        // Claim should fail because fee tier not set
        vm.prank(USER);
        vm.expectRevert("Fee tier not set for token");
        subsidyProgram.claimSubsidy();
    }

    function testSlippageProtection() public {
        vm.warp(TEN_YEARS);
        
        // Add funds - insufficient cCop, need to swap token2
        vm.startPrank(msg.sender);
        token1.approve(address(subsidyProgram), TOKEN_AMOUNT / 3); // Only 1/3 of needed cCop
        token2.approve(address(subsidyProgram), TOKEN_AMOUNT);
        
        subsidyProgram.addFunds(TOKEN_AMOUNT / 3, address(token1));
        subsidyProgram.addFunds(TOKEN_AMOUNT, address(token2));
        subsidyProgram.setClaimableAmount(TOKEN_AMOUNT);
        subsidyProgram.addBeneficiary(USER);
        vm.stopPrank();
        
        // Configure router to pull some token2 and send enough token1
        mockSwapRouter.setNextAmountIn(TOKEN_AMOUNT);

        // Claim should work with high slippage tolerance
        vm.prank(USER);
        subsidyProgram.claimSubsidy();
        
        // Verify user received the full subsidy amount
        assertEq(token1.balanceOf(USER), TOKEN_AMOUNT);
    }

    function testMultipleTokenPriority() public {
        vm.warp(TEN_YEARS);
        
        // Add token3 to whitelist and configure it
        vm.prank(msg.sender);
        subsidyProgram.addToken(address(token3));
        vm.prank(msg.sender);
        subsidyProgram.setTokenFeeTier(address(token3), 500); // 0.05% fee tier
        
        // Add funds: insufficient cCop, but enough token2 and token3
        vm.startPrank(msg.sender);
        token1.approve(address(subsidyProgram), TOKEN_AMOUNT / 4); // Only 1/4 of needed cCop
        token2.approve(address(subsidyProgram), TOKEN_AMOUNT / 2);
        token3.approve(address(subsidyProgram), TOKEN_AMOUNT);
        
        subsidyProgram.addFunds(TOKEN_AMOUNT / 4, address(token1));
        subsidyProgram.addFunds(TOKEN_AMOUNT / 2, address(token2));
        subsidyProgram.addFunds(TOKEN_AMOUNT, address(token3));
        subsidyProgram.setClaimableAmount(TOKEN_AMOUNT);
        subsidyProgram.addBeneficiary(USER);
        vm.stopPrank();
        
        // Configure router to first consume token3 (lowest priority), then possibly token2
        mockSwapRouter.setNextAmountIn(TOKEN_AMOUNT / 2);

        uint256 token2BalanceBefore = token2.balanceOf(address(subsidyProgram));
        uint256 token3BalanceBefore = token3.balanceOf(address(subsidyProgram));
        
        // Claim subsidy - should swap token3 first (lowest priority), then token2 if needed
        vm.prank(USER);
        subsidyProgram.claimSubsidy();
        
        // Verify user received the full subsidy amount
        assertEq(token1.balanceOf(USER), TOKEN_AMOUNT);
        
        // Verify token3 was consumed first (lowest priority)
        uint256 token3BalanceAfter = token3.balanceOf(address(subsidyProgram));
        assertTrue(token3BalanceAfter < token3BalanceBefore, "Token3 should have been consumed first");
        
        // Token2 might or might not have been consumed depending on swap rates
        uint256 token2BalanceAfter = token2.balanceOf(address(subsidyProgram));
        assertTrue(token2BalanceAfter <= token2BalanceBefore, "Token2 should not have increased");
    }
}
