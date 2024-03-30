import { Mina, PublicKey, fetchAccount } from "o1js";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type {
  MerkleSigPosRangeV1Contract,
  MerkleSigPosRangeV1ContractUpdateArgs,
} from "../../../merkle_sig_pos_range/src/merkle_sig_pos_range_v1";

const state = {
  MerkleSigPosRangeV1Contract: null as
    | null
    | typeof MerkleSigPosRangeV1Contract,
  zkapp: null as null | MerkleSigPosRangeV1Contract,
  transaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      "https://api.minascan.io/node/berkeley/v1/graphql",
    );
    console.log("Berkeley Instance Created");
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { MerkleSigPosRangeV1Contract } = await import(
      "../../../merkle_sig_pos_range/build/src/merkle_sig_pos_range_v1.js"
    );
    state.MerkleSigPosRangeV1Contract = MerkleSigPosRangeV1Contract;
  },
  compileContract: async (args: {}) => {
    await state.MerkleSigPosRangeV1Contract!.compile();
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.MerkleSigPosRangeV1Contract!(publicKey);
  },
  getNum: async (args: {}) => {
    const currentNum = await state.zkapp!.num.get();
    return JSON.stringify(currentNum.toJSON());
  },
  getRoot: async (args: {}) => {
    const root = await state.zkapp!.root.get();
    return JSON.stringify(root.toJSON());
  },
  createUpdateTransaction2: async (args: {}) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.update2();
    });
    state.transaction = transaction;
  },
  createUpdateTransaction: async (
    args: MerkleSigPosRangeV1ContractUpdateArgs,
  ) => {
    const {
      root,
      sigpos,
      merklePath,
      leaf,
      assetSize,
      assetSizeGreaterEqThan,
      assetSizeLessThan,
      nonce,
      proofPubKey,
      serialNo,
    } = args;

    console.log("args", args);

    const transaction = await Mina.transaction(() => {
      state.zkapp!.update(
        root,
        sigpos,
        merklePath,
        leaf,
        assetSize,
        assetSizeGreaterEqThan,
        assetSizeLessThan,
        nonce,
        proofPubKey,
        serialNo,
      );
    });
    console.log("transaction done");

    state.transaction = transaction;
  },
  proveUpdateTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

if (typeof window !== "undefined") {
  addEventListener(
    "message",
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);
      console.log("Return data", returnData);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    },
  );
}

console.log("Web Worker Successfully Initialized.");
