import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";
import { isAddress, parseUnits } from "ethers/lib/utils";
import { Contract, providers } from "ethers";
import { ERC20_ABI } from "../abi";

const SOSCLAIM_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountV",
        type: "uint256"
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32"
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32"
      }
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
]

export class SOS extends Base {
  private _recipient: string
  private _sosClaimContract: Contract;
  private _sosERC20Contract: Contract;
  private _sender: string;

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, _sosTokenAddress: string) {
    super()
    if (!isAddress(recipient)) throw new Error("Bad recipient Address")
    if (!isAddress(sender)) throw new Error("Bad sender Address")
    this._sender = sender;
    this._recipient = recipient;
    this._sosClaimContract = new Contract(_sosTokenAddress, SOSCLAIM_ABI, provider);
    this._sosERC20Contract = new Contract(_sosTokenAddress, ERC20_ABI, provider);
  }

  async description(): Promise<string> {
    return `claim SOS from ${this._sender}, and transfer to ${this._recipient}`
  }

  async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
    // you can open broswer to https://api.theopendao.com/api/opendao/claim/[Fill Your Address] 
    // get total_share, v, r, s and fill below
    //
    // such as for my address https://api.theopendao.com/api/opendao/claim/0x49E53Fb3d5bf1532fEBAD88a1979E33A94844d1d
    // const total_share = "41429244.5055"
    // const v = "12664759760331458874453076485325239921451404572804478121060178750865498554368"
    // const r = "0xe57fcd80afe2701a3469c0411080595ee77a8315481589b0494981f06b6e7cdd"
    // const s = "0x7a716d2e99812e791fd17afcbffe92c1980e25f68ea2519ec21d845ed672a7e8"
    const total_share = ""
    const v = ""
    const r = ""
    const s = ""

    return [
      { ...await this._sosClaimContract.populateTransaction.claim(v, r, s), gasLimit: 60000 },
      { ...await this._sosERC20Contract.populateTransaction.transfer(this._recipient, parseUnits(total_share, 'ether')), gasLimit: 100000 }
    ]
  }
}