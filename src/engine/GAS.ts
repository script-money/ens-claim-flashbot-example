import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";
import { isAddress } from "ethers/lib/utils";
import { Contract, providers } from "ethers";
import { ERC20_ABI } from "../abi";

const GASCLAIM_ABI = [
  {
    inputs: [
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
    name: "claimTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
]

export class GAS extends Base {
  private _recipient: string
  private _GASClaimContract: Contract;
  private _GASERC20Contract: Contract;
  private _sender: string;

  constructor(provider: providers.JsonRpcProvider, sender: string, recipient: string, _GASTokenAddress: string) {
    super()
    if (!isAddress(recipient)) throw new Error("Bad recipient Address")
    if (!isAddress(sender)) throw new Error("Bad sender Address")
    this._sender = sender;
    this._recipient = recipient;
    this._GASClaimContract = new Contract(_GASTokenAddress, GASCLAIM_ABI, provider);
    this._GASERC20Contract = new Contract(_GASTokenAddress, ERC20_ABI, provider);
  }

  async description(): Promise<string> {
    return `claim GAS from ${this._sender}, and transfer to ${this._recipient}`
  }

  async getSponsoredTransactions(): Promise<Array<TransactionRequest>> {
    const proofSource = { "result": "" } // get from https://www.gasdao.org claim page
    // check https://us1-willing-skunk-35505.upstash.io/ request in Developer Tools's Fetch/XHR tab. 
    // Example at next line:
    // const proofSource = { "result": "{\"address\": \"0x49E53Fb3d5bf1532fEBAD88a1979E33A94844d1d\", \"eth\": 6.7478265, \"usd\": 20271.53816622, \"count\": 640.0, \"lastBlock\": 13866325, \"tokens\": 2328295.731737526, \"airdrop\": \"2328295731737526133656502\", \"proof\": [\"0xd88c4abec6abaf202b33173c888c151b755e1f4fd95639d7c51fc08dd4fe9017\", \"0x2e7dfa77a00f80c70d10bd4fb9b55450b8edbe10e022afd2a815db08b24c4b6f\", \"0xa602a15c989e2a3cac730a7a216081449dddeb13029a0cc000e8efb565484f12\", \"0xe168bb6bbbd6baaac5bf5131cf311cec39aeb6f4e2b2a473fa18b05fe2b53753\", \"0xe927079751105c8037e13dd4ed0b650255ded5e9f5700c7ab6c2019e6b29e188\", \"0xa09a737df2662d428db949a4052330eb2b7d0f923033a1419c94cbcb3ca63be0\", \"0x11aa6f9a5007f392b10bc3abdf394461ff9cf4896ea98a5f55a1fa58138d7633\", \"0xc27f4e42ef2ca7c7bb00db54f906f042b69b2b50de59f1793b0412777537c9e8\", \"0x8c28ac990fe6012a3b3bb2d3edf4dcb758f7815fc6be19c7a3fdf8ce06d9abb3\", \"0x952263615fbdc5f066457bf424169a4920f83ab043ced11afa39cff9adf39dca\", \"0xf78b1cb2f4863b12fbcd29bf081a48218fb0e3b5f09a0f95ee5b99a1e0b05772\", \"0x0d93555d1e601b40afacecdf0416372c3722016c9d70d5b4e74d4578d2848cdc\", \"0xd05c3a0529f3c61787f4fbab4c31a98de536f77456b6091fea689d780e47da71\", \"0x38c31fb2671aa2b7b543eb96e76b37621ab06b39324248a9f16dca29a77d32bd\", \"0x49fc41b9aa71ebc94fd363a1d587753ea8bf7cb46ff824443eba69c113cc846d\", \"0x4a21300cfc605429833843f07c50bb7e510eb4566d325600ceb9d0382bf01f36\", \"0xebda3ed73687a943cbffdf3c209c9eda806fc4be4758f9647c6f8eb59da50b6e\", \"0x25c27c9a15e170ebb2778ce65fa2ba22032dbf4d22528209560822a732832b14\"]}" }

    const { airdrop, proof } = JSON.parse(proofSource.result)

    return [
      { ...await this._GASClaimContract.populateTransaction.claimTokens(airdrop, proof), gasLimit: 160000 },
      { ...await this._GASERC20Contract.populateTransaction.transfer(this._recipient, airdrop), gasLimit: 100000 }
    ]
  }
}