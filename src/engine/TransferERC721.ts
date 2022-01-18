import { BigNumber, Contract, providers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";

const ERC721_ABI = [{
    "constant": true,
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {
        "internalType": "address",
        "name": "operator",
        "type": "address"
    }],
    "name": "isApprovedForAll",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
    }],
    "name": "setApprovalForAll",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {
        "internalType": "address",
        "name": "to",
        "type": "address"
    }, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {
        "internalType": "address",
        "name": "to",
        "type": "address"
    }, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}]

export class TransferERC721 extends Base {
    private _sender: string;
    private _recipient: string;
    private _tokenContract: Contract;
    private _tokenIds: number[];

    constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, _tokenAddress: string,tokenIds: number[]) {
        super()
        if (!isAddress(sender)) throw new Error("Bad Address")
        if (!isAddress(recipient)) throw new Error("Bad Address")
        this._sender = sender;
        this._recipient = recipient;
        this._tokenContract = new Contract(_tokenAddress, ERC721_ABI, provider);
        this._tokenIds = tokenIds;
    }

    async description(): Promise<string> {
        return "Transfer ERC721 balance " + (await this.getTokenBalance(this._sender)).toString() + " @ " + this._tokenContract.address + " from " + this._sender + " to " + this._recipient
    }

    async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
        await Promise.all(this._tokenIds.map(async (tokenId) => {
            const owner = await this._tokenContract.functions.ownerOf(tokenId);
            if (owner.owner !== this._sender) throw new Error("NFT: " + tokenId + " is not owned by " + this._sender)
        }))
        return Promise.all(this._tokenIds.map(async (tokenId) => {
            return {
                ...(await this._tokenContract.populateTransaction.transfer(this._recipient, tokenId)),
            }
        }))
    }

    private async getTokenBalance(tokenHolder: string): Promise<BigNumber> {
        return (await this._tokenContract.functions.balanceOf(tokenHolder))[0];
    }
}