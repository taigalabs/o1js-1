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

class MerkleWitness32 extends MerkleWitness(32) {}

export class MerkleSigPosRangeV1Contract extends SmartContract {
  @state(Field) root = State<Field>();
  @state(Field) nonce = State<Field>();
  @state(Field) proofPubKey = State<Field>();
  @state(Field) serialNo = State<Field>();
  @state(Field) assetSizeGreaterEqThan = State<Field>();
  @state(Field) assetSizeLessThan = State<Field>();

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
    leaf: Field,
    //
    assetSize: Field,
    assetSizeGreaterEqThan: Field,
    assetSizeLessThan: Field,
    //
    nonce: Field,
    proofPubKey: Field,
    serialNo: Field
  ) {
    // => leaf := pos(pos(sigpos), assetSize)
    const _leaf = Poseidon.hash([sigpos, assetSize]);
    _leaf.assertEquals(leaf);

    const calculatedRoot = merklePath.calculateRoot(leaf);
    calculatedRoot.assertEquals(root);

    assetSize.assertGreaterThanOrEqual(assetSizeGreaterEqThan);
    assetSize.assertLessThan(assetSizeLessThan);

    const sigposAndNonce = Poseidon.hash([sigpos, nonce]);

    // ==> serialNo := pos(sigpos, nonce)
    const _serialNo = Poseidon.hash([sigposAndNonce, proofPubKey]);

    _serialNo.assertEquals(serialNo);

    this.root.set(root);
    this.nonce.set(nonce);
    this.proofPubKey.set(proofPubKey);
    this.serialNo.set(serialNo);
    this.assetSizeGreaterEqThan.set(assetSizeGreaterEqThan);
    this.assetSizeLessThan.set(assetSizeLessThan);
  }
}
