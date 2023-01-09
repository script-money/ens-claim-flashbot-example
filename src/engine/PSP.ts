import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";
import { isAddress } from "ethers/lib/utils";
import { Contract, providers } from "ethers";
import ShardedMerkleTree from './merkle'
import { ERC20_ABI } from "../abi";

const PSPCLAIM_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "token_",
        type: "address"
      },
      {
        internalType: "bytes32",
        name: "merkleRoot_",
        type: "bytes32"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "index",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Claimed",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "account",
        type: "address"
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
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256"
      }
    ],
    name: "isClaimed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "merkleRoot",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "token",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
]

export class PSP extends Base {
  private _recipient: string
  private _pspClaimContract: Contract;
  private _pspERC20Contract: Contract;
  private _sender: string;

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, _pspClaimAddress: string, _pspTokenAddress: string) {
    super()
    if (!isAddress(recipient)) throw new Error("Bad recipient Address")
    if (!isAddress(sender)) throw new Error("Bad sender Address")
    this._sender = sender;
    this._recipient = recipient;
    this._pspClaimContract = new Contract(_pspClaimAddress, PSPCLAIM_ABI, provider);
    this._pspERC20Contract = new Contract(_pspTokenAddress, ERC20_ABI, provider);
  }

  async description(): Promise<string> {
    return `claim psp from ${this._sender}, and transfer to ${this._recipient}`
  }

  async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
    const merkle = ShardedMerkleTree.getProofParaswap('./airdrops/paraswap', this._sender);
    const _merkleRoot = await this._pspClaimContract.merkleRoot()
    if (_merkleRoot !== merkle[0]) {
      return Promise.reject(new Error('contract merkleRoot is not equal to tree root'))
    }
    const { index, amount, proof } = merkle[1]
    return [
      { ...await this._pspClaimContract.populateTransaction.claim(index, this._sender, amount, proof), chainId: 1, gasLimit: 90000 },
      { ...await this._pspERC20Contract.populateTransaction.transfer(this._recipient, amount), chainId: 1, gasLimit: 100000 }
    ]
  }
}