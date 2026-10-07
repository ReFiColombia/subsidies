import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Beneficiary, Funds, DailyClaim, TokenBalance } from "../generated/schema"

// Shared by the V1 and V2 data sources so both contracts write the same
// entities the same way.

export function getOrCreateDailyClaim(timestamp: BigInt): DailyClaim {
  let day = timestamp.toI32() / 86400
  let id = day.toString()
  let dailyClaim = DailyClaim.load(id)

  if (!dailyClaim) {
    dailyClaim = new DailyClaim(id)
    dailyClaim.date = timestamp
    dailyClaim.totalClaims = BigInt.zero()
    dailyClaim.totalAmount = BigInt.zero()
    dailyClaim.beneficiaries = []
  }

  return dailyClaim
}

// One Funds entity per contract address.
export function getOrCreateFunds(address: Address): Funds {
  let funds = Funds.load(address)
  if (!funds) {
    funds = new Funds(address)
    funds.totalSupplied = BigInt.zero()
    funds.totalWithdrawn = BigInt.zero()
    funds.totalClaimed = BigInt.zero()
    funds.contractBalance = BigInt.zero()
  }
  return funds
}

export function getOrCreateTokenBalance(funds: Funds, token: Bytes): TokenBalance {
  let tb = TokenBalance.load(token)
  if (!tb) {
    tb = new TokenBalance(token)
    tb.token = token
    tb.balance = BigInt.zero()
    tb.totalSwapped = BigInt.zero()
    tb.totalWithdrawn = BigInt.zero()
    tb.funds = funds.id
  }
  return tb
}

// A beneficiary can be added again, on the same contract or on V2 after
// having claimed on V1. Keep what they already claimed instead of resetting it.
export function addBeneficiary(beneficiary: Address, timestamp: BigInt): void {
  let entity = Beneficiary.load(beneficiary)
  if (!entity) {
    entity = new Beneficiary(beneficiary)
    entity.totalClaimed = BigInt.zero()
  }
  entity.dateAdded = timestamp
  entity.dateRemoved = null
  entity.isActive = true
  entity.save()
}

export function removeBeneficiary(beneficiary: Address, timestamp: BigInt): void {
  let entity = Beneficiary.load(beneficiary)
  if (!entity) return
  entity.isActive = false
  entity.dateRemoved = timestamp
  entity.save()
}

export function recordClaim(
  contractAddress: Address,
  beneficiary: Address,
  amount: BigInt,
  contractBalance: BigInt,
  timestamp: BigInt
): void {
  let entity = Beneficiary.load(beneficiary)
  if (!entity) return

  let funds = getOrCreateFunds(contractAddress)
  entity.totalClaimed = entity.totalClaimed.plus(amount)
  funds.totalClaimed = funds.totalClaimed.plus(amount)
  funds.contractBalance = contractBalance
  entity.save()
  funds.save()

  let dailyClaim = getOrCreateDailyClaim(timestamp)
  dailyClaim.totalClaims = dailyClaim.totalClaims.plus(BigInt.fromI32(1))
  dailyClaim.totalAmount = dailyClaim.totalAmount.plus(amount)
  let beneficiaries = dailyClaim.beneficiaries
  if (!beneficiaries.includes(beneficiary)) {
    beneficiaries.push(beneficiary)
    dailyClaim.beneficiaries = beneficiaries
  }
  dailyClaim.save()
}
