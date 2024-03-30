import {
  Field,
  SmartContract,
  state,
  State,
  method,
  MerkleWitness,
} from 'o1js';

class MerkleWitness32 extends MerkleWitness(32) { }

export class MerkleSigPosRangeV1Contract extends SmartContract {
  @state(Field) merkleRoot = State<Field>();

  @method initState(initialRoot: Field) {
    this.merkleRoot.set(initialRoot);
  }

  @method update(
    merkleRoot: Field,
    merklePath: MerkleWitness32,
    leafVal: Field
  ) {
    // const initialRoot = this.treeRoot.get();
    // this.treeRoot.requireEquals(initialRoot);

    // 1 incrementAmount.assertLessThan(Field(10));

    // leafs in new trees start at a state of 0
    // const _rootBefore = leafWitness.calculateRoot(Field(0));
    // rootBefore.assertEquals(root);

    // compute the root after incrementing
    const rootAfter = merklePath.calculateRoot(
      leafVal,
    );

    rootAfter.assertEquals(merkleRoot);

    // set the new root
    this.merkleRoot.set(merkleRoot);
  }
}
