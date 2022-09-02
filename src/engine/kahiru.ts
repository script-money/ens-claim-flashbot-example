import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";
import { isAddress } from "ethers/lib/utils";
import { Contract, providers } from "ethers";

const KahiruStakingContract = '0x6DffB6415c96EC393Bf018fB824934d7b5B637a0' // Unstake
const KahiruNFTContract = '0x0326b0688d9869a19388312Df6805d1D72AaB7bC' // NFT to transfer

const STAKING_ABI = [{ "inputs": [{ "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" }], "name": "unstake", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]
const NFT_ABI = [
  { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
]

export class Kahiru extends Base {
  private _sender: string;
  private _recipient: string
  private _KahiruStakingContract: Contract;
  private _KahiruNFTContract: Contract;

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string) {
    super()
    if (!isAddress(recipient)) throw new Error("Bad recipient Address")
    if (!isAddress(sender)) throw new Error("Bad sender Address")
    this._sender = sender;
    this._recipient = recipient;
    this._KahiruStakingContract = new Contract(KahiruStakingContract, STAKING_ABI, provider);
    this._KahiruNFTContract = new Contract(KahiruNFTContract, NFT_ABI, provider);
  }

  async description(): Promise<string> {
    return `unstake Kahiru from ${this._sender}, and transfer to ${this._recipient}`
  }

  async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
    const tokenIds = ['1', '2'] // change to your token id
    const batchTransaction: Array<TransactionRequest> = []

    batchTransaction.push({ ...await this._KahiruStakingContract.populateTransaction.unstake(tokenIds), gasLimit: 114865 })

    tokenIds.forEach(async tokenId => {
      batchTransaction.push({
        ...await this._KahiruNFTContract.populateTransaction.transferFrom(this._sender, this._recipient, tokenId), gasLimit: 70000
      })
    });

    return batchTransaction
  }
}