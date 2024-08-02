import { useCallback, useEffect, useRef, useState } from "react"
import { Box, Button, Paper, Stack, Typography } from "@mui/material"
import {
  TariPermissions,
  TariUniverseProvider,
  TariUniverseProviderParameters,
  permissions as walletPermissions,
} from "@tariproject/tarijs"
import { Token } from "./types"
import { defaultFirstToken, defaultSecondToken, initFaucets, takeFreeCoins } from "./faucet"

const { TariPermissionAccountInfo, TariPermissionKeyList, TariPermissionSubstatesRead, TariPermissionTransactionSend } =
  walletPermissions

const permissions = new TariPermissions()
permissions.addPermission(new TariPermissionKeyList())
permissions.addPermission(new TariPermissionAccountInfo())
permissions.addPermission(new TariPermissionTransactionSend())
permissions.addPermission(new TariPermissionSubstatesRead())
const optionalPermissions = new TariPermissions()
const params: TariUniverseProviderParameters = {
  permissions: permissions,
  optionalPermissions,
}

function App() {
  const provider = useRef<TariUniverseProvider>(new TariUniverseProvider(params))
  const [firstToken, setFirstToken] = useState<Token>(defaultFirstToken)
  const [secondToken, setSecondToken] = useState<Token>(defaultSecondToken)

  useEffect(() => {
    refreshBalances()
  }, [])

  const deployFaucet = async () => {
    // TODO fix this check
    // if (!firstToken || !secondToken) throw new Error("Tokens not initialized")

    const result = await initFaucets(provider.current)
    console.log(result)
  }

  const takeCoins = async () => {
    if (!firstToken || !secondToken) throw new Error("Tokens not initialized")

    const firstTokenComponent = firstToken.substate.component
    const secondTokenComponent = secondToken.substate.component

    await takeFreeCoins(provider.current, firstTokenComponent)
    await takeFreeCoins(provider.current, secondTokenComponent)

    refreshBalances()
  }

  const refreshBalances = useCallback(async () => {
    try {
      const account = await getAccount()
      if (!firstToken || !secondToken) throw new Error("Tokens not initialized")

      const accountBalances = await provider.current.getAccountBalances(account.address)
      const firstTokenBalance =
        accountBalances.balances.find(
          (balance) => balance.resource_address.toLowerCase() === firstToken?.substate.resource.toLowerCase()
        )?.balance || 0
      const secondTokenBalance =
        accountBalances.balances.find(
          (balance) => balance.resource_address.toLowerCase() === secondToken?.substate.resource.toLowerCase()
        )?.balance || 0
      setFirstToken({ ...firstToken, balance: firstTokenBalance })
      setSecondToken({ ...secondToken, balance: secondTokenBalance })
    } catch (e) {
      console.error(e)
    }
  }, [firstToken, secondToken])

  const getAccount = useCallback(async () => {
    const account = await provider.current.getAccount()
    if (!account) throw new Error("Account not initialized")
    return account
  }, [provider])

  return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" width="100%">
      <Paper variant="outlined" elevation={0} sx={{ padding: 3, borderRadius: 4, marginBottom: 3, width: "20%" }}>
        <Stack direction="column" spacing={2}>
          {
            <Button variant="contained" sx={{ width: "100%" }} onClick={deployFaucet}>
              Deploy Faucet
            </Button>
          }
          <Button variant="contained" sx={{ width: "100%" }} onClick={takeCoins}>
            Take free coins
          </Button>
          <Button variant="contained" sx={{ width: "100%" }} onClick={refreshBalances}>
            Refresh account balances
          </Button>
        </Stack>
      </Paper>

      <Box display="flex" flexDirection="column" alignItems="center" width="50%">
        <Paper variant="outlined" elevation={0} sx={{ padding: 3, borderRadius: 4, marginBottom: 2, width: "100%" }}>
          <Typography variant="h6">First Token</Typography>
          <Typography>Resource: {firstToken ? firstToken.substate.resource : ""}</Typography>
          <Typography>Component: {firstToken ? firstToken.substate.component : ""}</Typography>
          <Typography>Symbol: {firstToken ? firstToken.symbol : ""}</Typography>
          <Typography>Balance: {firstToken ? firstToken.balance : 0}</Typography>
        </Paper>

        <Paper variant="outlined" elevation={0} sx={{ padding: 3, borderRadius: 4, marginBottom: 2, width: "100%" }}>
          <Typography variant="h6">Second Token</Typography>
          <Typography>Resource: {secondToken ? secondToken.substate.resource : ""}</Typography>
          <Typography>Component: {secondToken ? secondToken.substate.component : ""}</Typography>
          <Typography>Symbol: {secondToken ? secondToken.symbol : ""}</Typography>
          <Typography>Balance: {secondToken ? secondToken.balance : 0}</Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export default App
