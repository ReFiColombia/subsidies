# Smart Contracts

Solidity contracts for the Subsidios RefiColombia subsidy distribution program on Celo. Built with Foundry.

## Deployed Contracts

| Address | Network | Role | Status |
|---------|---------|------|--------|
| `0x947C6dB1569edc9fd37B017B791cA0F008AB4946` | Celo Mainnet | V1 SubsidyProgram (non-upgradeable) | **Active in frontend** |
| `0xAbE493F082f41B432696F715f84D5471F48cdA2B` | Celo Mainnet | V2 SubsidyProgram (UUPS Proxy) | Deployed, not yet active |
| `0x35108fAa4511BAfe42ABD85F0BAB71f67Cc4AC1d` | Celo Mainnet | V2 SubsidyProgram (Implementation) | Behind proxy |
| `0x1A6FBc7b51E55C6D4F15c8D5CE7e97daEA699ecf` | Celo Alfajores | Old test deployment | Testnet only |
| `0x8A567e2aE79CA692Bd748aB832081C45de4041eA` | Celo Mainnet | cCOP Token (ERC-20) | Active |

## V1 vs V2 Overview

**V1** is a simple, non-upgradeable contract that holds a single token (cCOP) and distributes a fixed amount to registered beneficiaries on a time interval.

**V2** is a UUPS-upgradeable contract that supports multiple whitelisted tokens. When a beneficiary claims their subsidy, the contract automatically swaps non-cCOP tokens to cCOP via Uniswap V3 if needed.

### Key Differences

| Feature | V1 | V2 |
|---------|----|----|
| Upgrade pattern | None | UUPS Proxy (OpenZeppelin) |
| Token support | cCOP only | Multi-token with whitelist |
| `addFunds` | `addFunds(uint256)` | `addFunds(uint256, address)` |
| `withdrawFunds` | `withdrawFunds()` | `withdrawFunds(address)` |
| Auto-swap | No | Yes (Uniswap V3) |
| Token priority | N/A | Ordered array, owner-controlled |
| Storage | Standard | Namespaced (`SubsidyProgramStorage`) |

## V2 Function Reference

Source: `src/SubsidyProgram.sol`

### Owner Functions

| Function | Description |
|----------|-------------|
| `initialize(address _tokenAddress, address _swapRouter, address _initialOwner)` | Set primary token (cCOP), swap router, and initial owner |
| `setClaimInterval(uint256 _interval)` | Set time between claims (default: 7 days) |
| `setClaimableAmount(uint256 _amount)` | Set cCOP amount per claim |
| `addBeneficiary(address _user)` | Register a beneficiary (sets lastClaimed so they can claim immediately) |
| `removeBeneficiary(address _user)` | Remove a beneficiary |
| `addToken(address _token)` | Whitelist a new donation token |
| `removeToken(address _token)` | Remove a whitelisted token |
| `changeTokenPriority(address _token, uint256 _newIndex)` | Reorder token in priority array |
| `setTokenFeeTier(address _token, uint24 _feeTier)` | Set Uniswap V3 fee tier for a token (required before it can be swapped) |
| `withdrawFunds(address _token)` | Withdraw entire balance of a specific token |

### Public Functions

| Function | Description |
|----------|-------------|
| `addFunds(uint256 _amount, address _token)` | Deposit a whitelisted token into the contract |
| `claimSubsidy()` | Claim cCOP subsidy (beneficiaries only, respects claim interval) |

### View Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `isBeneficiary(address)` | `bool` | Check if address is a registered beneficiary |
| `addressToUser(address)` | `User` | Get user's `lastClaimed` and `totalClaimed` |
| `subsidyClaimInterval()` | `uint256` | Current claim interval in seconds |
| `subsidyClaimableAmount()` | `uint256` | cCOP amount per claim |
| `getWhitelistedTokens()` | `address[]` | All whitelisted token addresses |
| `swapRouter()` | `ISwapRouter` | Uniswap V3 swap router address |
| `tokenToFeeTier(address)` | `uint24` | Fee tier for a given token |

Inherited from OpenZeppelin: `owner()`, `transferOwnership(address)`, `renounceOwnership()`, `proxiableUUID()`, `upgradeToAndCall(address, bytes)`.

## Auto-Swap Mechanism

When `claimSubsidy()` is called, the contract unconditionally attempts to swap non-cCOP tokens to cCOP:

1. Iterates `tokens[]` in **reverse order** (highest index = lowest priority = spent first)
2. For each token, calls `_swapTokenToCCop()` using Uniswap V3 `exactOutputSingle` — requests exactly `subsidyClaimableAmount` of cCOP as output
3. If the swap returns `amountIn > 0`, the loop breaks
4. After the loop, requires `cCopBalance >= subsidyClaimableAmount`
5. Token at index 0 (cCOP) is never swapped — it is the target output token

### Token Priority

- **Lower array index = higher priority = preserved longer**
- Index 0 is always cCOP (never swapped)
- The owner controls priority via `changeTokenPriority(address, uint256)`
- Each non-cCOP token must have a fee tier set via `setTokenFeeTier()` before swaps work

### Storage Pattern

V2 uses OpenZeppelin namespaced storage for UUPS upgrade safety:

```solidity
struct SubsidyProgramStorage {
    mapping(address => User) addressToUser;
    uint256 subsidyClaimInterval;
    uint256 subsidyClaimableAmount;
    address[] tokens;
    mapping(address => uint256) tokenIndex;
    ISwapRouter swapRouter;
    mapping(address => uint24) tokenToFeeTier;
}
```

The storage slot is computed from `keccak256("openzeppelin.storage.subsidy_program")`.

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Setup

```bash
# Install dependencies
forge install

# Build
forge build

# Run tests
forge test

# Format
forge fmt
```

### Environment Variables

Copy `.env.example` and fill in values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Deployer wallet private key |
| `CELO_RPC_URL` | Celo mainnet RPC (default: `https://forno.celo.org`) |
| `ALFAJORES_RPC_URL` | Celo Alfajores RPC |
| `CELOSCAN_API_KEY` | For contract verification on Celoscan |
| `TOKEN_ADDRESS` | cCOP token address (required by deploy script) |
| `SWAP_ROUTER_ADDRESS` | Uniswap V3 SwapRouter address (required by deploy script) |
| `INITIAL_OWNER` | Contract owner address (optional, defaults to deployer) |

### Deploy

```bash
# Alfajores testnet
forge script script/DeploySubsidyProgram.s.sol --rpc-url alfajores --broadcast --verify

# Celo mainnet
forge script script/DeploySubsidyProgram.s.sol --rpc-url celo --broadcast --verify
```

### Verify

```bash
forge verify-contract <ADDRESS> src/SubsidyProgram.sol:SubsidyProgram --chain celo
```
