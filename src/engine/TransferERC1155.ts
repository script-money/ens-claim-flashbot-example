import { Contract, providers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";

const ERC1155_ABI = [{
  inputs: [
    {
      internalType: "address",
      name: "from",
      type: "address"
    },
    {
      internalType: "address",
      name: "to",
      type: "address"
    },
    {
      internalType: "uint256[]",
      name: "ids",
      type: "uint256[]"
    },
    {
      internalType: "uint256[]",
      name: "amounts",
      type: "uint256[]"
    },
    {
      internalType: "bytes",
      name: "data",
      type: "bytes"
    }
  ],
  name: "safeBatchTransferFrom",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function"
}]

export class TransferERC1155 extends Base {
  private _sender: string;
  private _recipient: string;
  private _tokenContract: Contract;
  private _tokenIds: number[] | string[];
  private _amounts: number[];

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, _tokenAddress: string, tokenIds: number[] | string[], amounts: number[]) {
    super()
    if (!isAddress(sender)) throw new Error("Bad Address")
    if (!isAddress(recipient)) throw new Error("Bad Address")
    this._sender = sender;
    this._recipient = recipient;
    this._tokenContract = new Contract(_tokenAddress, ERC1155_ABI, provider);
    this._tokenIds = tokenIds;
    this._amounts = amounts;
  }

  async description(): Promise<string> {
    return `Transfer ${this._amounts.join('/')} ERC1155 ${this._tokenContract.address} ${this._tokenIds.join('/')} tokens from ${this._sender} to ${this._recipient}`;
  }

  async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
    return [{
      ...await this._tokenContract.populateTransaction.safeBatchTransferFrom(this._sender, this._recipient, this._tokenIds, this._amounts, "0x00"),
      gasLimit: 50000 * this._amounts.length,
    }]
  }
}