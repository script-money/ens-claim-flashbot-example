import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";
import { fetchJson, isAddress } from "ethers/lib/utils";
import { Contract, providers } from "ethers";
import { ERC20_ABI } from "../abi";

const RSS3CLAIM_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        internalType: "bytes32[]",
        name: "merkleProof",
        type: "bytes32[]"
      }
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
]

export class RSS3 extends Base {
  private _recipient: string
  private _RSS3ClaimContract: Contract;
  private _RSS3ERC20Contract: Contract;
  private _sender: string;

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, _RSS3ClaimAddress: string, _RSS3TokenAddress: string) {
    super()
    if (!isAddress(recipient)) throw new Error("Bad recipient Address")
    if (!isAddress(sender)) throw new Error("Bad sender Address")
    this._sender = sender;
    this._recipient = recipient;
    this._RSS3ClaimContract = new Contract(_RSS3ClaimAddress, RSS3CLAIM_ABI, provider);
    this._RSS3ERC20Contract = new Contract(_RSS3TokenAddress, ERC20_ABI, provider);
  }

  async description(): Promise<string> {
    return `claim RSS3 from ${this._sender}, and transfer to ${this._recipient}`
  }

  async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
    const response = await fetchJson(`https://airdrop-backend.rss3.events/check/${this._sender}`)
    const index = response.index
    const amount = response.earnings
    const proof = response.proof

    return [
      { ...await this._RSS3ClaimContract.populateTransaction.claim(index, amount, proof), gasLimit: 76599 },
      { ...await this._RSS3ERC20Contract.populateTransaction.transfer(this._recipient, amount), gasLimit: 60000 }
    ]
  }
}