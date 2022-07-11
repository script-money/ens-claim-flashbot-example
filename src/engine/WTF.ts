import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";
import { isAddress, parseUnits } from "ethers/lib/utils";
import { Contract, providers } from "ethers";

const WTFCLAIM_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address"
      },
      {
        internalType: "address payable",
        name: "_referrer",
        type: "address"
      }
    ],
    name: "unlock",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address"
      },
      {
        internalType: "uint256[9]",
        name: "_data",
        type: "uint256[9]"
      },
      {
        internalType: "bytes32[]",
        name: "_proof",
        type: "bytes32[]"
      }
    ],
    name: "claimWTF",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_to",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_tokens",
        type: "uint256"
      }
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
]



export class WTF extends Base {
  private _recipient: string
  private _WTFClaimContract: Contract;
  private _sender: string;
  private _referrer: string;

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, _WTFTokenAddress: string, referrer: string) {
    super()
    if (!isAddress(recipient)) throw new Error("Bad recipient Address")
    if (!isAddress(sender)) throw new Error("Bad sender Address")
    if (!isAddress(referrer)) throw new Error("Bad referrer Address")
    this._sender = sender;
    this._recipient = recipient;
    this._referrer = referrer;
    this._WTFClaimContract = new Contract(_WTFTokenAddress, WTFCLAIM_ABI, provider);
  }

  async description(): Promise<string> {
    return `claim WTF from ${this._sender}, and transfer to ${this._recipient}`
  }

  async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
    // replace proofSource by yours, get from https://https://api.fees.wtf/claim/[address],
    const proofSource = {
      "index": 1705542,
      "amount": "2619084179105690054712",
      "totalFees": "6901133918979264114",
      "failFees": "140272287498724517",
      "totalGas": "116120211",
      "avgGwei": "64558421571",
      "totalDonated": "0",
      "totalTxs": 651,
      "failTxs": 23,
      "leaf": "0x19f2699bda0c5b2da87c9f1d9c406fb9ab9f16f0d1778410559b72c689af2534",
      "data": [
        1705542,
        "2619084179105690054712",
        "6901133918979264114",
        "140272287498724517",
        "116120211",
        "64558421571",
        "0",
        651,
        23
      ],
      "proof": [
        "0x19f2698b09c4bcffcd59fb0a562c58461b118706619d7213a331f638c062d31f",
        "0x9d38d3700c1f46e76eb615b9f2404c0a2abd8955869fe9a021b9a9b929464a63",
        "0xe50278718b17b35bb38fc8a1510015cb78cec974f3a8522cae1101a1f23a027b",
        "0xd70cda7521fae6b0493f9dc3d269fde3a05536909c7314cd7b91e68c2e8e7bdf",
        "0x16e89bfd044dda691d3effc5ed22c6c09d1359a60b4edb6bc56d61c343cea607",
        "0x75c6d84787e739961c6c3d779f13a61d336ae8db41f70702aa1290f77e1095dd",
        "0x737543bc6994b69852f5f68d1aa548eb4e16cc03f33dabdf38e42ec448884a0e",
        "0xc689428b86df7d2f0a771f5b9c817232c0f582ef7be5b98c91157e6657b9119d",
        "0xf5579ed0701a293b5ebb726e0fa6e8f6a1bd5330c6ab7a278dd925db50a7f1f2",
        "0x15491f041411ba89b337d48948d4f10ab6a828259acc48657eda01e404558eae",
        "0xcc0b807b160bde903eda8cea80ac3e4843eeae99193e4bb19dec81eca45e655a",
        "0x5b792d52ff82e6bffce1fc9543e3f7214fec11e89c8eb80432ceb06f702f1c14",
        "0x7d7f3e5667a2ab21f5b505c6f07d1e671a80943d04e0a7dcb9b6b3d2a167eff2",
        "0xc11dd119fcf0f8163b6874ec3cbeecc5baeb221640e7d08028e6b41535673124",
        "0xe7146b1ee0c938bcd929996dabceb3b483db8b4d8af5570e9926ab87f168d52a",
        "0x1f2f47d060bfaf079471321c6fa0b28f180fb23287f4539c9297d60b3966b282",
        "0x2a3c4d77a2843e97a712ae319ef6937310c74f970cf7c8fb19f0c9fc172ba59c",
        "0x30629c34ea5feb55569d7c90f555d6f9d0e87ebbad480d68a87b80375c7c138e",
        "0x46e19f25b3394e17e7950ccc708dbe5febc6d70c0e19382afb0f53dd38423772",
        "0x262fb8ab747eb54d0ef9d965a5b80f429a27161b1eb9cafb6f116fdad6e0fc84",
        "0x42d7f57c74319f2199d6e2763dec15ea43abbd55ed44978ece3847c29c91280c",
        "0x1b17fb85a23eabfbe3c7e4b58a432bdd63e4f017ac51c7cda266b24fc762077f",
        "0x23c81c8c47cc456a4bf9fa1e8099fbbe7be313c612743f0686a5a93ee3c75dab"
      ]
    }

    return [
      { ...await this._WTFClaimContract.populateTransaction.unlock(this._sender, this._referrer), gasLimit: 90000 + Math.floor(0.01 / 200e-9), value: parseUnits('0.01', 'ether') },
      { ...await this._WTFClaimContract.populateTransaction.claimWTF(this._sender, proofSource.data, proofSource.proof), gasLimit: 135000 },
      { ...await this._WTFClaimContract.populateTransaction.transfer(this._recipient, proofSource.amount), gasLimit: 110000 }
    ]
  }
}