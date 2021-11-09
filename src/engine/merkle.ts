import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { ethers } from "ethers";
import * as fs from 'fs';
import * as path from 'path';

interface IEntry {
  past_tokens: ethers.BigNumber,
  future_tokens: ethers.BigNumber,
  longest_owned_name: string,
  last_expiring_name: string,
  balance: ethers.BigNumber,
  has_reverse_record: boolean
}

type IEntries = Record<string, IEntry>

interface IShards {
  [shard: string]: {
    proof: string[],
    entries: IEntries
  }
}

function hashLeaf([address, entry]: [string, IEntry]): string {
  return ethers.utils.solidityKeccak256(['address', 'uint256'], [address, entry.balance]);
}

class ShardedMerkleTree {
  private fetcher: any
  private shardNybbles: number
  public root: string
  private total: any
  private shards: IShards
  private trees: {
    [shard: string]: MerkleTree
  }

  constructor(fetcher: any, shardNybbles: number, root: string, total: ethers.BigNumber) {
    this.fetcher = fetcher;
    this.shardNybbles = shardNybbles;
    this.root = root;
    this.total = total;
    this.shards = {};
    this.trees = {};
  }

  getProof(address: string): [IEntry | undefined, string[]] {
    const shardid = address.slice(2, 2 + this.shardNybbles).toLowerCase();
    let shard = this.shards[shardid];
    if (shard === undefined) {
      shard = this.shards[shardid] = this.fetcher(shardid);
      const leaves = Object.entries(shard.entries).map(hashLeaf)
      this.trees[shardid] = new MerkleTree(leaves, keccak256, { sort: true });
    }
    const entry = shard.entries[address];
    const leaf = hashLeaf([address, entry!])
    const proof = this.trees[shardid].getProof(leaf).map((entry) => '0x' + entry.data.toString('hex'));
    return [entry, proof.concat(shard.proof)];
  }

  static fromFiles(directory: string): ShardedMerkleTree {
    const { root, shardNybbles, total } = JSON.parse(fs.readFileSync(path.join(directory, 'root.json'), { encoding: 'utf-8' }));
    return new ShardedMerkleTree((shard: string) => {
      return JSON.parse(fs.readFileSync(path.join(directory, `${shard}.json`), { encoding: 'utf-8' }));
    }, shardNybbles, root, ethers.BigNumber.from(total));
  }
}

export default ShardedMerkleTree;
