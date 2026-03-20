// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {ISwapRouter} from "./ISwapRouter.sol";

contract SubsidyProgram is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    struct User {
        uint256 lastClaimed;
        uint256 totalClaimed;
    }

    struct SubsidyProgramStorage {
        mapping(address => User) addressToUser;
        uint256 subsidyClaimInterval;
        uint256 subsidyClaimableAmount;
        address[] tokens;
        mapping(address => uint256) tokenIndex;
        ISwapRouter swapRouter;
        mapping(address => uint24) tokenToFeeTier;
    }

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.subsidy_program")) - 1)) & ~bytes32(uint256(0xff));
    function _getSubsidyProgramStorageLocation() private pure returns (bytes32) {
        return keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.subsidy_program")) - 1)) & ~bytes32(uint256(0xff));
    }

    function _getSubsidyProgramStorage() private pure returns (SubsidyProgramStorage storage $) {
        bytes32 slot = _getSubsidyProgramStorageLocation();
        assembly {
            $.slot := slot
        }
    }

    event FundsAdded(uint256 amount, address tokenAddress, uint256 tokenBalance);
    event FundsWithdrawn(address tokenAddress, uint256 amountWithdrawed);
    event BeneficiaryAdded(address indexed beneficiaryAddress);
    event BeneficiaryRemoved(address indexed beneficiaryAddress);
    event SubsidyClaimed(
        address indexed beneficiaryAddress,
        uint256 amount,
        uint256 contractBalance
    );
    event ClaimIntervalSet(uint256 interval);
    event ClaimableAmountSet(uint256 amount);
    event TokenAdded(address indexed tokenAddress, uint256 newIndex);
    event TokenRemoved(address indexed tokenAddress);
    event TokenPriorityChanged(
        address indexed tokenAddress,
        uint256 oldIndex,
        uint256 newIndex
    );
    event TokenSwapped(address indexed tokenAddress, uint256 amountIn, uint256 amountOut);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _tokenAddress,
        address _swapRouter,
        address _initialOwner
    ) public initializer {
        __Ownable_init(_initialOwner);
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        $.tokens.push(_tokenAddress);
        $.tokenIndex[_tokenAddress] = 1;
        $.swapRouter = ISwapRouter(_swapRouter);
        $.subsidyClaimInterval = 7 days;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setClaimInterval(uint256 _interval) external onlyOwner {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        $.subsidyClaimInterval = _interval;
        emit ClaimIntervalSet(_interval);
    }

    function setClaimableAmount(uint256 _amount) external onlyOwner {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        $.subsidyClaimableAmount = _amount;
        emit ClaimableAmountSet(_amount);
    }

    function setTokenFeeTier(
        address _tokenAddress,
        uint24 _feeTier
    ) external onlyOwner {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        require($.tokenIndex[_tokenAddress] != 0, "Token not whitelisted");
        require(_tokenAddress != $.tokens[0], "Cannot set fee tier for cCop");
        $.tokenToFeeTier[_tokenAddress] = _feeTier;
    }

    function addToken(address _tokenAddress) external onlyOwner {
        require(_tokenAddress != address(0), "Zero token");
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        require($.tokenIndex[_tokenAddress] == 0, "The token is already whitelisted.");
        $.tokens.push(_tokenAddress);
        $.tokenIndex[_tokenAddress] = $.tokens.length;
        emit TokenAdded(_tokenAddress, $.tokens.length - 1);
    }

    function removeToken(address _tokenAddress) external onlyOwner {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        uint256 idx1 = $.tokenIndex[_tokenAddress];
        require(idx1 != 0, "This token isn't whitelisted.");
        require($.tokens.length > 1, "Cannot remove all tokens.");

        for (uint256 i = idx1 - 1; i < $.tokens.length - 1; i++) {
            $.tokens[i] = $.tokens[i + 1];
            $.tokenIndex[$.tokens[i]] = i + 1;
        }

        $.tokens.pop();
        $.tokenIndex[_tokenAddress] = 0;
        emit TokenRemoved(_tokenAddress);
    }

    function changeTokenPriority(address _tokenAddress, uint256 _newIndex) external onlyOwner {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        require(_newIndex < $.tokens.length, "New index out of bounds.");
        require($.tokenIndex[_tokenAddress] != 0, "This token isn't whitelisted");

        uint256 oldIndex = $.tokenIndex[_tokenAddress] - 1;
        if (oldIndex == _newIndex) return;

        address tokenToChange = $.tokens[oldIndex];
        if (oldIndex < _newIndex) {
            // shift to the left
            for (uint256 i = oldIndex; i < _newIndex; i++) {
                $.tokens[i] = $.tokens[i + 1];
                $.tokenIndex[$.tokens[i]] = i + 1;
            }
        } else {
            // shift to the right
            for (uint256 i = oldIndex; i > _newIndex; i--) {
                $.tokens[i] = $.tokens[i - 1];
                $.tokenIndex[$.tokens[i]] = i - 1;
            }
        }

        $.tokens[_newIndex] = tokenToChange;
        $.tokenIndex[tokenToChange] = _newIndex + 1;

        emit TokenPriorityChanged(_tokenAddress, oldIndex, _newIndex);
    }

    function addFunds(uint256 _amount, address _tokenAddress) external {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        require($.tokenIndex[_tokenAddress] != 0, "This token isn't whitelisted.");
        uint256 index = $.tokenIndex[_tokenAddress] - 1;
        require(
            IERC20($.tokens[index]).transferFrom(msg.sender, address(this), _amount),
            "Transfer failed."
        );

        emit FundsAdded(
            _amount,
            $.tokens[index],
            IERC20($.tokens[index]).balanceOf(address(this))
        );
    }

    function withdrawFunds(address _tokenAddress) external onlyOwner {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        require($.tokenIndex[_tokenAddress] != 0, "The contract doesn't have this token in balance.");
        uint256 index = $.tokenIndex[_tokenAddress] - 1;
        uint256 contractBalance = IERC20($.tokens[index]).balanceOf(address(this));
        require(
            IERC20($.tokens[index]).transfer(msg.sender, contractBalance),
            "Transfer failed."
        );
        emit FundsWithdrawn($.tokens[index], contractBalance);
    }

    function addBeneficiary(address _userAddress) external onlyOwner {
        require(!isBeneficiary(_userAddress), "Already a beneficiary.");
        require(_userAddress != address(0), "Invalid address");
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        $.addressToUser[_userAddress] = User({
            lastClaimed: block.timestamp - $.subsidyClaimInterval,
            totalClaimed: 0
        });
        emit BeneficiaryAdded(_userAddress);
    }

    function removeBeneficiary(address _userAddress) external onlyOwner {
        require(isBeneficiary(_userAddress), "Address is not a beneficiary.");
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        $.addressToUser[_userAddress] = User(0, 0);
        emit BeneficiaryRemoved(_userAddress);
    }

    function _swapTokenToCCop(
        address tokenIn,
        uint256 amountOut,
        uint256 amountInMaximum
    ) internal returns (uint256 amountIn) {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        uint24 feeTier = $.tokenToFeeTier[tokenIn];
        require(feeTier != 0, "Fee tier not set for token");

        // Approve the router to spend the token
        TransferHelper.safeApprove(tokenIn, address($.swapRouter), type(uint256).max);

        ISwapRouter.ExactOutputSingleParams memory params =
            ISwapRouter.ExactOutputSingleParams({
            tokenIn: tokenIn,
            tokenOut: $.tokens[0],
            fee: feeTier,
            recipient: address(this),
            amountOut: amountOut,
            amountInMaximum: amountInMaximum,
            sqrtPriceLimitX96: 0
        });

        amountIn = $.swapRouter.exactOutputSingle(params);

        IERC20(tokenIn).approve(address($.swapRouter), 0);
        
        return amountIn;
    }

    function claimSubsidy() public {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        require(isBeneficiary(msg.sender), "Address is not a beneficiary.");
        require(
            block.timestamp - $.addressToUser[msg.sender].lastClaimed >=
                $.subsidyClaimInterval,
            "Cannot claim yet."
        );

        // Iterate tokens in reverse order (lowest priority first)
        for (uint256 i = $.tokens.length - 1; i > 0; i--) {
            address tokenToSwap = $.tokens[i];
            uint256 tokenBalance = IERC20(tokenToSwap).balanceOf(address(this));

            uint256 amountIn = _swapTokenToCCop(
                tokenToSwap,
                $.subsidyClaimableAmount,
                tokenBalance
            );

            if (amountIn > 0) break;
        }

        // Check if we still need more cCop
        uint256 cCopBalance = IERC20($.tokens[0]).balanceOf(address(this));

        require(
            cCopBalance >= $.subsidyClaimableAmount,
            "Not enough funds even after swaps."
        );

        $.addressToUser[msg.sender].lastClaimed = block.timestamp;
        $.addressToUser[msg.sender].totalClaimed += $.subsidyClaimableAmount;

        require(
            IERC20($.tokens[0]).transfer(msg.sender, $.subsidyClaimableAmount),
            "Transfer failed."
        );

        emit SubsidyClaimed(
            msg.sender,
            $.subsidyClaimableAmount,
            IERC20($.tokens[0]).balanceOf(address(this))
        );
    }

    function getWhitelistedTokens() public view returns (address[] memory) {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        return $.tokens;
    }

    function isBeneficiary(
        address _beneficiaryAddress
    ) public view returns (bool) {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        return $.addressToUser[_beneficiaryAddress].lastClaimed != 0;
    }

    // Public getters for state variables
    function addressToUser(address user) public view returns (User memory) {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        return $.addressToUser[user];
    }

    function subsidyClaimInterval() public view returns (uint256) {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        return $.subsidyClaimInterval;
    }

    function subsidyClaimableAmount() public view returns (uint256) {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        return $.subsidyClaimableAmount;
    }

    function swapRouter() public view returns (ISwapRouter) {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        return $.swapRouter;
    }

    function tokenToFeeTier(address token) public view returns (uint24) {
        SubsidyProgramStorage storage $ = _getSubsidyProgramStorage();
        return $.tokenToFeeTier[token];
    }
}
