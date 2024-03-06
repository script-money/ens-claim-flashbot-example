import { Contract, providers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";

const captainAddress = "0x769272677faB02575E84945F03Eca517ACc544Cc"
const potatoAddress = "0x39ee2c7b3cb80254225884ca001F57118C8f21B6"
const captainAbi = [
  {
    inputs: [
      { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
    ],
    name: "batchStopQuest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const ERC721_ABI = [
  { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
]

export class TransferCaptain extends Base {
  private _sender: string;
  private _recipient: string;
  private _captainContract: Contract;
  private _potatoContract: Contract;
  private _captainIds: number[] | string[];
  private _crewIds: number[] | string[];

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, captainIds: number[] | string[], crewIds: number[] | string[]) {
    super()
    if (!isAddress(sender)) throw new Error("Bad sender address")
    if (!isAddress(recipient)) throw new Error("Bad sender address")
    this._sender = sender;
    this._recipient = recipient;
    this._captainContract = new Contract(captainAddress, captainAbi, provider);
    this._captainIds = captainIds;
    this._potatoContract = new Contract(potatoAddress, ERC721_ABI, provider);
    this._crewIds = crewIds;
  }

  async description(): Promise<string> {
    return `Transfer Captain and crews from ${this._captainIds.length} ${this._sender} and ${this._crewIds.length} to ${this._recipient}`;
  }

  async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
    const batchTransaction: Array<TransactionRequest> = []

    batchTransaction.push({ ...await this._captainContract.populateTransaction.batchStopQuest(this._captainIds), chainId: 1, gasLimit: 60000 })

    this._captainIds.forEach(async tokenId => {
      batchTransaction.push({
        ...await this._captainContract.populateTransaction.transferFrom(this._sender, this._recipient, tokenId), chainId: 1, gasLimit: 82000
      })
    });

    this._crewIds.forEach(async tokenId => {
      batchTransaction.push({
        ...await this._potatoContract.populateTransaction.transferFrom(this._sender, this._recipient, tokenId), chainId: 1, gasLimit: 88000
      })
    });
    return batchTransaction
  }
}