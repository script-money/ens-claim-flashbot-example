import { Contract, providers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";

const ERC721_ABI = [
  { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
]

export class TransferERC721 extends Base {
  private _sender: string;
  private _recipient: string;
  private _tokenContract: Contract;
  private _tokenIds: number[] | string[];

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, _tokenAddress: string, tokenIds: number[] | string[]) {
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
        ...await this._tokenContract.populateTransaction.safeTransferFrom(this._sender, this._recipient, tokenId), chainId: 1, gasLimit: 85000,
      }
    }))
  }
}