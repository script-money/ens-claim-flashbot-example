import { Contract, providers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";

const ERC721_ABI = [{
  name: "transferFrom",
  outputs: [
    {
      type: "bool",
      name: "out"
    }
  ],
  inputs: [
    {
      type: "address",
      name: "_from"
    },
    {
      type: "address",
      name: "_to"
    },
    {
      type: "uint256",
      name: "_value"
    }
  ],
  constant: false,
  payable: false,
  type: "function"
}, {
  inputs: [
    {
      internalType: "uint256",
      name: "tokenId",
      type: "uint256"
    }
  ],
  name: "ownerOf",
  outputs: [
    {
      internalType: "address",
      name: "",
      type: "address"
    }
  ],
  stateMutability: "view",
  type: "function"
},]

export class TransferERC721 extends Base {
  private _sender: string;
  private _recipient: string;
  private _tokenContract: Contract;
  private _tokenIds: number[];

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, _tokenAddress: string, tokenIds: number[]) {
    super()
    if (!isAddress(sender)) throw new Error("Bad Address")
    if (!isAddress(recipient)) throw new Error("Bad Address")
    this._sender = sender;
    this._recipient = recipient;
    this._tokenContract = new Contract(_tokenAddress, ERC721_ABI, provider);
    this._tokenIds = tokenIds;
  }

  async description(): Promise<string> {
    return "Transfer ERC721 token " + this._tokenIds.join('/') + this._tokenContract.address + " from " + this._sender + " to " + this._recipient;
  }

  async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
    return Promise.all(this._tokenIds.map(async (tokenId) => {
      return {
        ...await this._tokenContract.populateTransaction.transferFrom(this._sender, this._recipient, tokenId), gasLimit: 100000,
      }
    }))
  }
}