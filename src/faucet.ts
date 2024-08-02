import { TariProvider } from "@tariproject/tarijs"
import { InitTokensResponse, Token } from "./types.ts"
import {
  Amount,
  buildTransactionRequest,
  fromWorkspace,
  submitAndWaitForTransaction,
  TransactionBuilder,
} from "@tariproject/tarijs/dist/builders/index"
import { AccountTemplate, TestFaucet } from "../../../forked/tari.js/dist/index"
import { getAcceptResultSubstates } from "@tariproject/tarijs/dist/builders/helpers/submitTransaction"

export const FEE_AMOUNT = "2000"
export const INIT_SUPPLY = "100000"
export const FAUCET_TEMPLATE_ADDRESS = "02716e415371d4a1f1aefa8391ed6102e7667148dabb0416f069aabe3de9cc3d"

export const FIRST_TOKEN_RESOURCE_ADDRESS = "resource_773dabf7bd8856cfa1f323be125f603c564f528913d68f4ba6afbbde"
export const FIRST_TOKEN_COMPONENT_ADDRESS = "component_773dabf7bd8856cfa1f323be125f603c564f52895d31caee6221456a"
export const FIRST_TOKEN_SYMBOL = "A"

export const SECOND_TOKEN_RESOURCE_ADDRESS = "resource_c92473c97eef7e252617cfd0115662439e13113ed974bcc8ab48e508"
export const SECOND_TOKEN_COMPONENT_ADDRESS = "component_c92473c97eef7e252617cfd0115662439e13113e5d31caee6221456a"
export const SECOND_TOKEN_SYMBOL = "B"

export const defaultFirstToken: Token = {
  substate: {
    resource: FIRST_TOKEN_RESOURCE_ADDRESS,
    component: FIRST_TOKEN_COMPONENT_ADDRESS,
  },
  symbol: FIRST_TOKEN_SYMBOL,
  balance: 0,
}

export const defaultSecondToken: Token = {
  substate: {
    resource: SECOND_TOKEN_RESOURCE_ADDRESS,
    component: SECOND_TOKEN_COMPONENT_ADDRESS,
  },
  symbol: SECOND_TOKEN_SYMBOL,
  balance: 0,
}

export async function takeFreeCoins(provider: TariProvider, faucet_component: string) {
  try {
    const account = await provider.getAccount()
    const builder = new TransactionBuilder()
    const faucet = new TestFaucet(faucet_component)
    const accountComponent = new AccountTemplate(account.address)
    const fee = new Amount(2000)
    const maxfee = fee.getStringValue()

    const required_substates = [{ substate_id: account.address }, { substate_id: faucet_component }]

    const transaction = builder
      .callMethod(faucet.takeFreeCoins, [])
      .saveVar("test")
      .callMethod(accountComponent.deposit, [fromWorkspace("test")])
      .feeTransactionPayFromComponent(account.address, maxfee)
      .build()

    const req = buildTransactionRequest(transaction, account.account_id, required_substates)
    const tx = await submitAndWaitForTransaction(provider, req)

    return tx.result
  } catch (error) {
    console.error(error)
  }
}

export async function initFaucets(provider: TariProvider): Promise<InitTokensResponse | undefined> {
  const account = await provider.getAccount()
  const builder = new TransactionBuilder()
  const faucet_template = new TestFaucet(FAUCET_TEMPLATE_ADDRESS)
  const transaction = builder
    .callFunction(faucet_template.mintWithSymbol, [INIT_SUPPLY, FIRST_TOKEN_SYMBOL])
    .callFunction(faucet_template.mintWithSymbol, [INIT_SUPPLY, SECOND_TOKEN_SYMBOL])
    .feeTransactionPayFromComponent(account.address, FEE_AMOUNT)
    .build()

  try {
    const req = buildTransactionRequest(transaction, account.account_id, [])

    const { response, result: txResult } = await submitAndWaitForTransaction(provider, req)
    if (!response) throw new Error("Failed to init tokens")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upSubstates = getAcceptResultSubstates(txResult)?.upSubstates as any[]
    if (!upSubstates) throw new Error("No up substates found")

    const firstToken: Token = {
      substate: {
        resource: upSubstates[2][0].Resource,
        component: upSubstates[4][0].Component,
      },
      symbol: FIRST_TOKEN_SYMBOL,
      balance: 0,
    }
    const secondToken: Token = {
      substate: {
        resource: upSubstates[5][0].Resource,
        component: upSubstates[7][0].Component,
      },
      symbol: SECOND_TOKEN_SYMBOL,
      balance: 0,
    }

    return {
      firstToken,
      secondToken,
    }
  } catch (error) {
    console.error(error)
  }
}
