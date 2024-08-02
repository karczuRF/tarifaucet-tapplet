import {
  Account,
  SubmitTransactionRequest,
  SubstateRequirement,
  TariProvider,
  TransactionStatus,
} from "@tariproject/tarijs"

export async function submitAndWaitForTransaction(
  provider: TariProvider,
  account: Account,
  instructions: object[],
  required_substates: SubstateRequirement[]
) {
  const fee = 2000
  const fee_instructions = [
    {
      CallMethod: {
        component_address: account.address,
        method: "pay_fee",
        args: [`Amount(${fee})`],
      },
    },
  ]
  const req: SubmitTransactionRequest = {
    account_id: account.account_id,
    fee_instructions,
    instructions: instructions as object[],
    inputs: [],
    input_refs: [],
    required_substates,
    is_dry_run: false,
    min_epoch: null,
    max_epoch: null,
  }

  console.log("before req:", req)
  const resp = await provider.submitTransaction(req)

  const result = await waitForTransactionResult(provider, resp.transaction_id)

  return result
}

export async function waitForTransactionResult(provider: TariProvider, transactionId: string) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const resp = await provider.getTransactionResult(transactionId)
    const FINALIZED_STATUSES = [
      TransactionStatus.Accepted,
      TransactionStatus.Rejected,
      TransactionStatus.InvalidTransaction,
      TransactionStatus.OnlyFeeAccepted,
      TransactionStatus.DryRun,
    ]

    if (resp.status == TransactionStatus.Rejected) {
      throw new Error(`Transaction rejected: ${JSON.stringify(resp.result)}`)
    }
    if (FINALIZED_STATUSES.includes(resp.status)) {
      return resp
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

export async function getSubstate(provider: TariProvider, substateId: string) {
  const resp = await provider.getSubstate(substateId)
  return resp
}
