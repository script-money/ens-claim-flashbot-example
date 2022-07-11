import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";
import { fetchJson, isAddress } from "ethers/lib/utils";
import { Contract, providers } from "ethers";
import { ERC20_ABI } from "../abi";

const FORTCLAIM_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      },
      {
        internalType: "bytes32[]",
        name: "_proof",
        type: "bytes32[]"
      }
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
]

export class FORT extends Base {
  private _recipient: string
  private _FORTClaimContract: Contract;
  private _FORTERC20Contract: Contract;
  private _sender: string;

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, _FORTClaimAddress: string, _FORTTokenAddress: string) {
    super()
    if (!isAddress(recipient)) throw new Error("Bad recipient Address")
    if (!isAddress(sender)) throw new Error("Bad sender Address")
    this._sender = sender;
    this._recipient = recipient;
    this._FORTClaimContract = new Contract(_FORTClaimAddress, FORTCLAIM_ABI, provider);
    this._FORTERC20Contract = new Contract(_FORTTokenAddress, ERC20_ABI, provider);
  }

  async description(): Promise<string> {
    return `claim FORT from ${this._sender}, and transfer to ${this._recipient}`
  }

  async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
    let response
    try {
      response = await fetchJson(`https://airdrop-api.forta.network/proof?address=${this._sender}`)
    } catch (error) {
      console.warn('This address is not eligible for the FORT token airdrop.')
      return []
    }
    const index = response.index
    const amount = response.amount
    const proof = response.proof

    return [
      { ...await this._FORTClaimContract.populateTransaction.claim(index, amount, proof), gasLimit: 130000 },
      { ...await this._FORTERC20Contract.populateTransaction.transfer(this._recipient, amount), gasLimit: 60000 }
    ]
  }
}