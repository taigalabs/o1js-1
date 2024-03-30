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

import { MerkleSigPosRangeV1Contract } from './merkle_sig_pos_range_v1.js';

const HEIGHT = 32;

const Local = Mina.LocalBlockchain();
Mina.setActiveInstance(Local);
const { privateKey: deployerKey, publicKey: deployerAccount } =
  Local.testAccounts[0];
const { privateKey: senderPrivateKey, publicKey: senderPublicKey } =
  Local.testAccounts[1];

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();

{
  console.log('start');
  const zkApp = new MerkleSigPosRangeV1Contract(zkAppAddress);
  await MerkleSigPosRangeV1Contract.compile();
  console.log('compiled');

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

  const tree = new MerkleTree(HEIGHT);
  class MerkleWitness32 extends MerkleWitness(HEIGHT) {}

  const idx0 = 0n;
  const sigpos = Field(10);
  const assetSize = Field(1521);
  const assetSizeGreaterEqThan = Field(1000);
  const assetSizeLessThan = Field(10000);
  const nonceRaw = 'nonce';
  const nonceInt = Poseidon.hash(CircuitString.fromString(nonceRaw).toFields());
  const proofPubKey = '0x0';
  const proofPubKeyInt = Poseidon.hash(
    CircuitString.fromString(proofPubKey).toFields()
  );

  const leaf = Poseidon.hash([sigpos, assetSize]);
  const sigposAndNonce = Poseidon.hash([sigpos, nonceInt]);
  const serialNo = Poseidon.hash([sigposAndNonce, proofPubKeyInt]);

  // Dummy values to populate the tree
  const idx1 = 1n;
  const val1 = Field(11);
  const idx2 = 2n;
  const val2 = Field(12);

  // const rt1 = tree.getRoot();
  // console.log('rt1', rt1);
  tree.setLeaf(idx0, leaf);
  tree.setLeaf(idx1, val1);
  tree.setLeaf(idx2, val2);

  const root = tree.getRoot();
  console.log('root', root);

  const merklePath = new MerkleWitness32(tree.getWitness(idx0));

  console.log('numBefore', zkApp.num.get());
  const tx = await Mina.transaction(senderPublicKey, () => {
    zkApp.update2();
  });
  await tx.prove();
  console.log('tx1 proven');

  let tx1Pending = await tx.sign([senderPrivateKey, zkAppPrivateKey]).send();
  await tx1Pending.wait();

  const num = zkApp.num.get();
  console.log('num', num);

  const tx1 = await Mina.transaction(senderPublicKey, () => {
    zkApp.update(
      root,
      sigpos,
      merklePath,
      leaf,
      //
      assetSize,
      assetSizeGreaterEqThan,
      assetSizeLessThan,
      //
      nonceInt,
      proofPubKeyInt,
      serialNo
    );
  });
  await tx1.prove();
  console.log('tx1 proven');

  const pendingTx = await tx1.sign([senderPrivateKey, zkAppPrivateKey]).send();
  await pendingTx.wait();
  console.log(
    `BasicMerkleTree: local tree root hash after send1: ${tree.getRoot()}`
  );
  console.log(
    `BasicMerkleTree: smart contract root hash after send1: ${zkApp.root.get()}`
  );
}
