import {
  Field,
  SmartContract,
  state,
  State,
  method,
  MerkleWitness,
  CircuitString,
  Poseidon,
} from 'o1js';

class MerkleWitness32 extends MerkleWitness(32) { }

export class MerkleSigPosRangeV1Contract extends SmartContract {
  @state(Field) root = State<Field>();
  @state(Field) nonce = State<Field>();
  @state(Field) proofPubKey = State<Field>();
  @state(Field) serialNo = State<Field>();
  @state(Field) assetSizeGreaterEqThan = State<Field>();
  @state(Field) assetSizeLessThan = State<Field>();

  // signal input assetSize;
  // signal input assetSizeGreaterEqThan;
  // signal input assetSizeLessThan;
  // signal input sigpos;

  // // leaf := pos(pos(sigpos), assetSize)
  // signal input leaf;
  // signal input root;
  // signal input pathIndices[nLevels];
  // signal input siblings[nLevels];

  // signal input proofPubKey;
  // signal input nonce;
  // // serialNo := pos(sigpos, nonce)
  // signal input serialNo;

  @method initState() {
    this.root.set(Field(0));
    this.nonce.set(Field(0));
    this.proofPubKey.set(Field(0));
    this.serialNo.set(Field(0));
    this.assetSizeGreaterEqThan.set(Field(0));
    this.assetSizeLessThan.set(Field(0));
  }

  @method update(
    root: Field,
    sigpos: Field,
    merklePath: MerkleWitness32,
    //
    assetSize: Field,
    assetSizeGreaterEqThan: Field,
    assetSizeLessThan: Field,
    //
    nonce: Field,
    proofPubKey: Field,
    serialNo: Field,
  ) {
    // const initialRoot = this.treeRoot.get();
    // this.treeRoot.requireEquals(initialRoot);

    // 1 incrementAmount.assertLessThan(Field(10));

    // leafs in new trees start at a state of 0
    // const _rootBefore = leafWitness.calculateRoot(Field(0));
    // rootBefore.assertEquals(root);
    const leaf = Poseidon.hash([
      sigpos,
      assetSize,
    ]);

    // compute the root after incrementing
    const calculatedRoot = merklePath.calculateRoot(
      leaf,
    );
    calculatedRoot.assertEquals(root);

    assetSize.assertGreaterThanOrEqual(assetSizeGreaterEqThan);
    assetSize.assertLessThan(assetSizeLessThan);

    const sigposAndNonce = Poseidon.hash([
      sigpos,
      nonce,
    ]);
    const _serialNo = Poseidon.hash([
      sigposAndNonce,
      proofPubKey,
    ]);

    // set the new root
    this.root.set(root);
    // this.nonce.set(memo);
  }
}
