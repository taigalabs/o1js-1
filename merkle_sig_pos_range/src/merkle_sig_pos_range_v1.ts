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

export interface MerkleSigPosRangeV1ContractUpdateArgs {
  root: Field;
  sigpos: Field;
  merklePath: MerkleWitness32;
  leaf: Field;
  //
  assetSize: Field;
  assetSizeGreaterEqThan: Field;
  assetSizeLessThan: Field;
  //
  nonce: Field;
  proofPubKey: Field;
  serialNo: Field;
}

class MerkleWitness32 extends MerkleWitness(32) {}

export class MerkleSigPosRangeV1Contract extends SmartContract {
  // testing purpose
  @state(Field) num = State<Field>();

  @state(Field) root = State<Field>();
  @state(Field) nonce = State<Field>();
  @state(Field) proofPubKey = State<Field>();
  @state(Field) serialNo = State<Field>();
  @state(Field) assetSizeGreaterEqThan = State<Field>();
  @state(Field) assetSizeLessThan = State<Field>();

  init() {
    super.init();
    this.num.set(Field(1));

    this.root.set(Field(0));
    this.nonce.set(Field(0));
    this.proofPubKey.set(Field(0));
    this.serialNo.set(Field(0));
    this.assetSizeGreaterEqThan.set(Field(0));
    this.assetSizeLessThan.set(Field(0));
  }

  // @method initState(num: Field) {
  //   this.num.set(num);
  //   this.root.set(Field(0));
  //   this.nonce.set(Field(0));
  //   this.proofPubKey.set(Field(0));
  //   this.serialNo.set(Field(0));
  //   this.assetSizeGreaterEqThan.set(Field(0));
  //   this.assetSizeLessThan.set(Field(0));
  // }

  @method fn1() {
    const currentState = this.num.getAndRequireEquals();
    const newState = currentState.add(2);
    this.num.set(newState);
  }

  @method fn2(root: Field) {
    const currentState = this.num.getAndRequireEquals();
    const newState = currentState.add(2);
    this.num.set(newState);

    this.root.set(root);
  }

  @method fn3(root: Field, merklePath: MerkleWitness32) {
    const currentState = this.num.getAndRequireEquals();
    const newState = currentState.add(2);
    this.num.set(newState);

    this.root.set(root);
  }

  @method fn4(root: Field, merklePath: MerkleWitness32, leaf: Field) {
    const currentState = this.num.getAndRequireEquals();
    const newState = currentState.add(2);
    this.num.set(newState);

    const calculatedRoot = merklePath.calculateRoot(leaf);
    calculatedRoot.assertEquals(root);
    this.root.set(root);
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
