import {
  Mina,
  UInt32,
  UInt64,
  Int64,
  Character,
  CircuitString,
  PrivateKey,
  Signature,
  Poseidon,
  Field,
  Provable,
  MerkleWitness,
  MerkleTree,
  AccountUpdate,
  Struct,
  MerkleMap,
  Bool,
} from 'o1js';

// import { LedgerContract } from './LedgerContract.js';
// import { BasicMerkleTreeContract } from './BasicMerkleTreeContract.js';
import { MerkleSigPosRangeV1Contract } from './merkle_sig_pos_range_v1.js';

const Local = Mina.LocalBlockchain();
Mina.setActiveInstance(Local);
const { privateKey: deployerKey, publicKey: deployerAccount } =
  Local.testAccounts[0];
const { privateKey: senderPrivateKey, publicKey: senderPublicKey } =
  Local.testAccounts[1];

// const zkAppPrivateKey = PrivateKey.random();
// const zkAppPublicKey = zkAppPrivateKey.toPublicKey();

// const ledgerZkAppPrivateKey = PrivateKey.random();
// const ledgerZkAppAddress = ledgerZkAppPrivateKey.toPublicKey();

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();



{
  console.log('start');

  // initialize the zkapp
  // const zkApp = new BasicMerkleTreeContract(basicTreeZkAppAddress);
  const zkApp = new MerkleSigPosRangeV1Contract(zkAppAddress);
  await MerkleSigPosRangeV1Contract.compile();

  console.log('compiled ');

  // create a new tree
  // const height = 20;
  const height = 32;
  const tree = new MerkleTree(height);
  // class MerkleWitness20 extends MerkleWitness(height) { }
  class MerkleWitness32 extends MerkleWitness(height) { }

  const str1 = CircuitString.fromString('abc..xyz');


  // deploy the smart contract
  const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    zkApp.deploy();
    zkApp.initState();
  });
  await deployTxn.prove();

  console.log('deployTx proven');

  deployTxn.sign([deployerKey, zkAppPrivateKey]);

  const pendingDeployTx = await deployTxn.send();
  /**
   * `txn.send()` returns a pending transaction with two methods - `.wait()` and `.hash`
   * `.hash` returns the transaction hash
   * `.wait()` automatically resolves once the transaction has been included in a block. this is redundant for the LocalBlockchain, but very helpful for live testnets
   */
  await pendingDeployTx.wait();

  const idx0 = 0n;
  const val0 = Field(10);

  const idx1 = 1n;
  const val1 = Field(11);

  const idx2 = 2n;
  const val2 = Field(12);

  const rt1 = tree.getRoot();
  console.log('rt1', rt1);

  // update the leaf locally
  tree.setLeaf(idx0, val0);
  tree.setLeaf(idx1, val1);
  tree.setLeaf(idx2, val2);

  const rt2 = tree.getRoot();

  console.log('rt2', rt2);

  // get the witness for the current tree
  const merklePath = new MerkleWitness32(tree.getWitness(idx0));

  // const str = CircuitString.fromString("memo1");

  // update the smart contract
  const txn1 = await Mina.transaction(senderPublicKey, () => {
    zkApp.update(
      rt2,
      val0,
      merklePath,
      // str,
    );
  });
  await txn1.prove();

  console.log('tx1 proven');

  const pendingTx = await txn1.sign([senderPrivateKey, zkAppPrivateKey]).send();
  await pendingTx.wait();

  // compare the root of the smart contract tree to our local tree
  console.log(
    `BasicMerkleTree: local tree root hash after send1: ${tree.getRoot()}`
  );
  console.log(
    `BasicMerkleTree: smart contract root hash after send1: ${zkApp.root.get()}`
  );
}
