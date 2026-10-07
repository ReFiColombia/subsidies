import {
  BeneficiaryAdded as BeneficiaryAddedEvent,
  BeneficiaryRemoved as BeneficiaryRemovedEvent,
  SubsidyClaimed as SubsidyClaimedEvent,
  FundsAdded as FundsAddedEvent,
  FundsWithdrawed as FundsWithdrawedEvent,
} from "../generated/SubsidyProgramV1/SubsidyProgramV1"
import {
  addBeneficiary,
  removeBeneficiary,
  recordClaim,
  getOrCreateFunds,
} from "./helpers"

// Handlers for the V1 contract (single token, non-upgradeable).

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
  funds.totalSupplied = funds.totalSupplied.plus(event.params.amount)
  funds.contractBalance = event.params.contractBalance
  funds.save()
}

export function handleFundsWithdrawed(event: FundsWithdrawedEvent): void {
  let funds = getOrCreateFunds(event.address)
  funds.totalWithdrawn = funds.totalWithdrawn.plus(event.params.amountWithdrawed)
  funds.contractBalance = funds.contractBalance.minus(event.params.amountWithdrawed)
  funds.save()
}
