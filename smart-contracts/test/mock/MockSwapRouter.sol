// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISwapRouter} from "../../src/ISwapRouter.sol";

contract MockSwapRouter {
    uint256 public nextAmountIn;

    function setNextAmountIn(uint256 amountIn) external {
        nextAmountIn = amountIn;
    }

    function exactOutputSingle(
        ISwapRouter.ExactOutputSingleParams calldata params
    ) external returns (uint256 amountIn) {
        amountIn = nextAmountIn;

        require(params.amountOut > 0, "amountOut=0");

        // Send tokenOut to recipient to simulate successful swap
        require(
            IERC20(params.tokenOut).balanceOf(address(this)) >= params.amountOut,
            "router lacks tokenOut"
        );
        IERC20(params.tokenOut).transfer(params.recipient, params.amountOut);

        // Pull tokenIn from caller (must have allowance set previously)
        if (amountIn > 0) {
            IERC20(params.tokenIn).transferFrom(msg.sender, address(this), amountIn);
        }
        return amountIn;
    }
}


