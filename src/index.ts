import {
  FlashbotsBundleProvider, FlashbotsBundleRawTransaction,
  FlashbotsBundleResolution,
  FlashbotsBundleTransaction
} from "@flashbots/ethers-provider-bundle";
import { BigNumber, providers, Wallet } from "ethers";
import { Base } from "./engine/Base";
import { checkSimulation, gasPriceToGwei, printTransactions } from "./utils";
import { ENS } from "./engine/ENS";
import * as dotenv from 'dotenv'
import { PSP } from "./engine/PSP";
import { SOS } from "./engine/SOS";
import { GAS } from "./engine/GAS";

dotenv.config();
require('log-timestamp');

const BLOCKS_IN_FUTURE = 2;

const GWEI = BigNumber.from(10).pow(9);
const PRIORITY_GAS_PRICE = GWEI.mul(Number(process.env.PRIORITY_GAS_FEE));

const PRIVATE_KEY_EXECUTOR = process.env.PRIVATE_KEY_EXECUTOR || ""
const PRIVATE_KEY_SPONSOR = process.env.PRIVATE_KEY_SPONSOR || ""
const FLASHBOTS_RELAY_SIGNING_KEY = process.env.FLASHBOTS_RELAY_SIGNING_KEY || "";
const RECIPIENT = process.env.RECIPIENT || ""

if (PRIVATE_KEY_EXECUTOR === "") {
  console.warn("Must provide PRIVATE_KEY_EXECUTOR environment variable, corresponding to Ethereum EOA with assets to be transferred")
  process.exit(1)
}
if (PRIVATE_KEY_SPONSOR === "") {
  console.warn("Must provide PRIVATE_KEY_SPONSOR environment variable, corresponding to an Ethereum EOA with ETH to pay miner")
  process.exit(1)
}
if (FLASHBOTS_RELAY_SIGNING_KEY === "") {
  console.warn("Must provide FLASHBOTS_RELAY_SIGNING_KEY environment variable. Please see https://github.com/flashbots/pm/blob/main/guides/flashbots-alpha.md")
  process.exit(1)
}
if (RECIPIENT === "") {
  console.warn("Must provide RECIPIENT environment variable, an address which will receive assets")
  process.exit(1)
}

async function main() {
  const walletRelay = new Wallet(FLASHBOTS_RELAY_SIGNING_KEY)

  // ======= UNCOMMENT FOR GOERLI ==========
  // const provider = new providers.InfuraProvider(5, process.env.INFURA_API_KEY || '');
  // const flashbotsProvider = await FlashbotsBundleProvider.create(provider, walletRelay, 'https://relay-goerli.epheph.com/');
  // const ensToken = '0xF962cC0c9A8862bd970c796b46e2A5027e225CeE' // testnet
  // ======= UNCOMMENT FOR GOERLI ==========

  // ======= UNCOMMENT FOR MAINNET ==========
  const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545"
  const provider = new providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, walletRelay);
  // ======= UNCOMMENT FOR MAINNET ==========

  const walletExecutor = new Wallet(PRIVATE_KEY_EXECUTOR);
  const walletSponsor = new Wallet(PRIVATE_KEY_SPONSOR);
  const block = await provider.getBlock("latest")

  // ======= UNCOMMENT FOR ERC20 TRANSFER ==========
  // const tokenAddress = "0x64ef393b6846114bad71e2cb2ccc3e10736b5716";
  // const engine: Base = new TransferERC20(provider, walletExecutor.address, RECIPIENT, tokenAddress);
  // ======= UNCOMMENT FOR ERC20 TRANSFER ==========

  // ======= UNCOMMENT FOR 721 Approval ==========
  // const HASHMASKS_ADDRESS = "0xC2C747E0F7004F9E8817Db2ca4997657a7746928";
  // const engine: Base = new Approval721(RECIPIENT, [HASHMASKS_ADDRESS]);
  // ======= UNCOMMENT FOR 721 Approval ==========

  // ======= UNCOMMENT FOR ENS CLAIM AND TRANSFER ==========
  // const ensToken = '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72' // mainnet
  // const engine: Base = new ENS(provider, walletExecutor.address, RECIPIENT, ensToken);
  // ======= UNCOMMENT FOR ENS CLAIM AND TRANSFER ==========

  // ======= UNCOMMENT FOR PSP CLAIM AND TRANSFER ==========
  // const pspClaim = '0x090E53c44E8a9b6B1bcA800e881455b921AEC420' // mainnet
  // const pspToken = '0xcAfE001067cDEF266AfB7Eb5A286dCFD277f3dE5' // mainnet
  // const engine: Base = new PSP(provider, walletExecutor.address, RECIPIENT, pspClaim, pspToken);
  // ======= UNCOMMENT FOR PSP CLAIM AND TRANSFER ==========

  // ======= UNCOMMENT FOR SOS CLAIM AND TRANSFER ==========
  // const sosTokenAddress = '0x3b484b82567a09e2588a13d54d032153f0c0aee0'
  // const engine: Base = new SOS(provider, walletExecutor.address, RECIPIENT, sosTokenAddress);
  // ======= UNCOMMENT FOR SOS CLAIM AND TRANSFER ==========

  // ======= UNCOMMENT FOR GASDAO CLAIM AND TRANSFER ==========
  const gasTokenAddress = '0x6bba316c48b49bd1eac44573c5c871ff02958469'
  const engine: Base = new GAS(provider, walletExecutor.address, RECIPIENT, gasTokenAddress);
  // ======= UNCOMMENT FOR SOS CLAIM AND TRANSFER ==========

  const sponsoredTransactions = await engine.getSponsoredTransactions();
  if (sponsoredTransactions.length === 0) {
    console.log("No sponsored transactions found")
    process.exit(0)
  }

  const gasEstimates = sponsoredTransactions.map(tx => BigNumber.from(tx.gasLimit!))

  const gasEstimateTotal = gasEstimates.reduce((acc, cur) => acc.add(cur), BigNumber.from(0))

  const gasPrice = PRIORITY_GAS_PRICE.add(block.baseFeePerGas || 0);
  console.log('gasPrice', gasPrice);

  const bundleTransactions: Array<FlashbotsBundleTransaction | FlashbotsBundleRawTransaction> = [
    {
      transaction: {
        to: walletExecutor.address,
        gasPrice: gasPrice,
        value: gasEstimateTotal.mul(gasPrice),
        gasLimit: 21000,
      },
      signer: walletSponsor
    },
    ...sponsoredTransactions.map((transaction, txNumber) => {
      return {
        transaction: {
          ...transaction,
          gasPrice: gasPrice,
          gasLimit: gasEstimates[txNumber],
        },
        signer: walletExecutor,
      }
    })
  ]
  const signedBundle = await flashbotsProvider.signBundle(bundleTransactions)
  await printTransactions(bundleTransactions, signedBundle);
  const simulatedGasPrice = await checkSimulation(flashbotsProvider, signedBundle);

  console.log(await engine.description())

  console.log(`Executor Account: ${walletExecutor.address}`)
  console.log(`Sponsor Account: ${walletSponsor.address}`)
  console.log(`Simulated Gas Price: ${gasPriceToGwei(simulatedGasPrice)} gwei`)
  console.log(`Gas Price: ${gasPriceToGwei(gasPrice)} gwei`)
  console.log(`Gas Used: ${gasEstimateTotal.toString()}`)

  provider.on('block', async (blockNumber) => {
    const simulatedGasPrice = await checkSimulation(flashbotsProvider, signedBundle);
    const targetBlockNumber = blockNumber + BLOCKS_IN_FUTURE;
    console.log(`Current Block Number: ${blockNumber},   Target Block Number:${targetBlockNumber},   gasPrice: ${gasPriceToGwei(simulatedGasPrice)} gwei`)
    const bundleResponse = await flashbotsProvider.sendBundle(bundleTransactions, targetBlockNumber);
    if ('error' in bundleResponse) {
      throw new Error(bundleResponse.error.message)
    }
    const bundleResolution = await bundleResponse.wait()
    if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
      console.log(`Congrats, included in ${targetBlockNumber}`)
      process.exit(0)
    } else if (bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
      console.log(`Not included in ${targetBlockNumber}`)
    } else if (bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
      console.log("Nonce too high, bailing")
      process.exit(1)
    }
  })
}

async function run() {
  let result = false
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  while (!result) {
    try {
      await main().then(() => result = true).catch(async (e) => {
        console.warn(e);
        await delay(5000)
      });
    } catch (e) {
      console.log('failed:', e)
    }
  }
}

run()
