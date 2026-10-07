import { Bytes } from "@graphprotocol/graph-ts"
import {
  BeneficiaryAdded as BeneficiaryAddedEvent,
  BeneficiaryRemoved as BeneficiaryRemovedEvent,
  SubsidyClaimed as SubsidyClaimedEvent,
  FundsAdded as FundsAddedEvent,
  FundsWithdrawn as FundsWithdrawnEvent,
  TokenSwapped as TokenSwappedEvent,
  TokenAdded as TokenAddedEvent,
} from "../generated/SubsidyProgram/SubsidyProgram"
import {
  addBeneficiary,
  removeBeneficiary,
  recordClaim,
  getOrCreateFunds,
  getOrCreateTokenBalance,
} from "./helpers"

// Handlers for the V2 contract (UUPS proxy, multi-token).

const BASE_TOKEN = Bytes.fromHexString("0x8A567e2aE79CA692Bd748aB832081C45de4041eA")

export function handleBeneficiaryAdded(event: BeneficiaryAddedEvent): void {
  addBeneficiary(event.params.beneficiaryAddress, event.block.timestamp)
}

export function handleBeneficiaryRemoved(event: BeneficiaryRemovedEvent): void {
  removeBeneficiary(event.params.beneficiaryAddress, event.block.timestamp)
}

export function handleSubsidyClaimed(event: SubsidyClaimedEvent): void {
  recordClaim(
    event.address,
    event.params.beneficiaryAddress,
    event.params.amount,
    event.params.contractBalance,
    event.block.timestamp
  )
}

export function handleFundsAdded(event: FundsAddedEvent): void {
  let funds = getOrCreateFunds(event.address)

  if (event.params.tokenAddress == BASE_TOKEN) {
    funds.totalSupplied = funds.totalSupplied.plus(event.params.amount)
    funds.contractBalance = event.params.tokenBalance
  } else {
    let tb = getOrCreateTokenBalance(funds, event.params.tokenAddress)
    tb.balance = event.params.tokenBalance
    tb.save()
  }

  funds.save()
}

export function handleFundsWithdrawn(event: FundsWithdrawnEvent): void {
  let funds = getOrCreateFunds(event.address)

  if (event.params.tokenAddress == BASE_TOKEN) {
    funds.totalWithdrawn = funds.totalWithdrawn.plus(event.params.amountWithdrawed)
    funds.contractBalance = funds.contractBalance.minus(event.params.amountWithdrawed)
  } else {
    let tb = getOrCreateTokenBalance(funds, event.params.tokenAddress)
    tb.totalWithdrawn = tb.totalWithdrawn.plus(event.params.amountWithdrawed)
    tb.balance = tb.balance.minus(event.params.amountWithdrawed)
    tb.save()
  }

  funds.save()
}

export function handleTokenAdded(event: TokenAddedEvent): void {
  let funds = getOrCreateFunds(event.address)
  let tb = getOrCreateTokenBalance(funds, event.params.tokenAddress)
  tb.save()
}

export function handleTokenSwapped(event: TokenSwappedEvent): void {
  let funds = getOrCreateFunds(event.address)
  let tb = getOrCreateTokenBalance(funds, event.params.tokenAddress)

  tb.totalSwapped = tb.totalSwapped.plus(event.params.amountIn)
  tb.balance = tb.balance.minus(event.params.amountIn)
  funds.contractBalance = funds.contractBalance.plus(event.params.amountOut)

  tb.save()
  funds.save()
}
