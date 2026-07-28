import {
  bytesToHex, cre, encodeCallMsg, getNetwork, LAST_FINALIZED_BLOCK_NUMBER,
  logTriggerConfig, prepareReportRequest, protoBigIntToBigint, TxStatus,
  type EVMClient, type EVMLog, type Runtime,
} from '@chainlink/cre-sdk'
import {
  decodeFunctionResult, encodeAbiParameters, encodeFunctionData, keccak256,
  parseAbiParameters, toBytes, zeroAddress, type Address, type Hex,
} from 'viem'
import { z } from 'zod'
import { erc20Abi, poolAbi, receiverAbi } from './src/abi'
import { Action, decide } from './src/policy'

export const configSchema = z.object({
  schedule: z.string(),
  chainSelectorName: z.string(),
  poolAddress: z.string(),
  receiverAddress: z.string(),
  variableDebtUsdcAddress: z.string(),
  oracleEventAddress: z.string(),
  oracleEventSignature: z.string(),
  borrowers: z.array(z.string()),
  reportTtlSeconds: z.number().positive(),
  writeGasLimit: z.string(),
  dryRun: z.boolean().default(false),
})
type Config = z.infer<typeof configSchema>

function read<T extends readonly unknown[] | bigint>(
  runtime: Runtime<Config>, client: EVMClient, address: Address,
  abi: readonly unknown[], functionName: string, args: readonly unknown[],
): T {
  const data = encodeFunctionData({ abi, functionName, args } as never)
  const response = client.callContract(runtime, {
    call: encodeCallMsg({ from: zeroAddress, to: address, data }),
    blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
  }).result()
  return decodeFunctionResult({ abi, functionName, data: bytesToHex(response.data) } as never) as T
}

function evaluate(runtime: Runtime<Config>, trigger: 'HEARTBEAT' | 'ORACLE_EVENT', eventBlock?: bigint): string {
  const config = runtime.config
  const network = getNetwork({ chainFamily: 'evm', chainSelectorName: config.chainSelectorName, isTestnet: true })
  if (!network) throw new Error(`Unsupported network: ${config.chainSelectorName}`)
  const client = new cre.capabilities.EVMClient(network.chainSelector.selector)
  const header = client.headerByNumber(runtime, { blockNumber: LAST_FINALIZED_BLOCK_NUMBER }).result()
  const sourceBlock = eventBlock ?? (header.header?.blockNumber
    ? protoBigIntToBigint(header.header.blockNumber) : 0n)
  const sourceTime = header.header?.timestamp ? Number(header.header.timestamp) : 0
  runtime.log(JSON.stringify({ event: 'check_started', trigger, sourceBlock: sourceBlock.toString(), sourceTime }))

  const outcomes: string[] = []
  for (const rawBorrower of config.borrowers) {
    const borrower = rawBorrower as Address
    try {
      const account = read<readonly [bigint, bigint, bigint, bigint, bigint, bigint]>(
        runtime, client, config.poolAddress as Address, poolAbi, 'getUserAccountData', [borrower],
      )
      const userRules = read<readonly [bigint, bigint, bigint, boolean]>(
        runtime, client, config.receiverAddress as Address, receiverAbi, 'rules', [borrower],
      )
      const reserve = read<bigint>(
        runtime, client, config.receiverAddress as Address, receiverAbi, 'reserves', [borrower],
      )
      const debt = read<bigint>(
        runtime, client, config.variableDebtUsdcAddress as Address, erc20Abi, 'balanceOf', [borrower],
      )
      const [suggestedRepay] = read<readonly [bigint, bigint]>(
        runtime, client, config.receiverAddress as Address, receiverAbi, 'previewRepay', [borrower],
      )
      const decision = decide({
        healthFactor: account[5], lowerHF: userRules[0], upperHF: userRules[2],
        debtBalance: debt, reserveBalance: reserve, enabled: userRules[3],
      })
      const evaluationId = keccak256(encodeAbiParameters(
        parseAbiParameters('address,uint256,uint256,string'),
        [borrower, sourceBlock, account[5], trigger],
      ))
      runtime.log(JSON.stringify({
        event: 'position_evaluated', borrower, healthFactor: account[5].toString(),
        collateralBase: account[0].toString(), debtBase: account[1].toString(),
        reserve: reserve.toString(), action: decision.reason, evaluationId,
      }))

      if (decision.action !== Action.REPAY || config.dryRun) {
        outcomes.push(`${borrower}:${config.dryRun ? `DRY_RUN_${decision.reason}` : decision.reason}`)
        continue
      }
      const report = encodeAbiParameters(
        parseAbiParameters(
          'address borrower,uint8 action,uint256 observedHealthFactor,uint256 sourceBlock,uint256 validUntil,bytes32 evaluationId,uint256 suggestedRepayAmount',
        ),
        [borrower, Action.REPAY, account[5], sourceBlock, BigInt(sourceTime + config.reportTtlSeconds), evaluationId, suggestedRepay],
      )
      const signed = runtime.report(prepareReportRequest(report)).result()
      const result = client.writeReport(runtime, {
        receiver: config.receiverAddress as Address,
        report: signed,
        gasConfig: { gasLimit: config.writeGasLimit },
      }).result()
      if (result.txStatus !== TxStatus.SUCCESS) throw new Error(result.errorMessage || `status=${result.txStatus}`)
      const txHash = bytesToHex(result.txHash || new Uint8Array(32))
      runtime.log(JSON.stringify({ event: 'repayment_report_submitted', borrower, txHash }))
      outcomes.push(`${borrower}:REPAY:${txHash}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      runtime.log(JSON.stringify({ event: 'evaluation_error', borrower, message }))
      outcomes.push(`${borrower}:ERROR`)
    }
  }
  return outcomes.length ? outcomes.join(',') : 'NO_BORROWERS_CONFIGURED'
}

export const onHeartbeat = (runtime: Runtime<Config>) => evaluate(runtime, 'HEARTBEAT')
export const onOracleEvent = (runtime: Runtime<Config>, log: EVMLog) =>
  evaluate(runtime, 'ORACLE_EVENT', log.blockNumber ? protoBigIntToBigint(log.blockNumber) : undefined)

export function initWorkflow(config: Config) {
  const network = getNetwork({ chainFamily: 'evm', chainSelectorName: config.chainSelectorName, isTestnet: true })
  if (!network) throw new Error(`Unsupported network: ${config.chainSelectorName}`)
  const client = new cre.capabilities.EVMClient(network.chainSelector.selector)
  const topic = keccak256(toBytes(config.oracleEventSignature)) as Hex
  const cron = new cre.capabilities.CronCapability()
  return [
    cre.handler(cron.trigger({ schedule: config.schedule }), onHeartbeat),
    cre.handler(client.logTrigger(logTriggerConfig({
      addresses: [config.oracleEventAddress as Address],
      topics: [[topic]],
      confidence: 'FINALIZED',
    })), onOracleEvent),
  ]
}
