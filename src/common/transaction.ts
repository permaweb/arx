import type { Signer } from "@dha-team/arbundles";
import type BigNumber from "bignumber.js";
import Crypto from "crypto";
import type ARx from "./arx";
import type {
  ARxTransaction as IARxTransaction,
  ARxTransactionCreateOptions,
  ARxTransactonCtor,
  UploadOptions,
  UploadReceipt,
  UploadResponse,
} from "./types";

/**
 * Extended DataItem that allows for seamless ARx operations, such as signing and uploading.
 * Takes the same parameters as a regular DataItem.
 */

export default function buildARxTransaction(arx: Pick<ARx, "uploader" | "tokenConfig" | "arbundles" | "utils">): ARxTransactonCtor {
  class ARxTransaction extends arx.arbundles.DataItem implements IARxTransaction {
    public ARx: Pick<ARx, "uploader" | "tokenConfig" | "arbundles" | "utils">;
    public signer: Signer;

    constructor(
      data: string | Uint8Array,
      arx: Pick<ARx, "uploader" | "tokenConfig" | "arbundles" | "utils">,
      opts?: ARxTransactionCreateOptions,
    ) {
      super(
        opts?.dataIsRawTransaction === true
          ? Buffer.from(data)
          : arx.arbundles
              .createData(data, arx.tokenConfig.getSigner(), {
                ...opts,
                anchor: opts?.anchor ?? Crypto.randomBytes(32).toString("base64").slice(0, 32),
              })
              .getRaw(),
      );
      this.ARx = arx;
      this.signer = arx.tokenConfig.getSigner();
    }

    public sign(): Promise<Buffer> {
      return super.sign(this.signer);
    }

    get size(): number {
      return this.getRaw().length;
    }

    /**
     * @deprecated use upload
     */
    async uploadWithReceipt(opts?: UploadOptions): Promise<UploadReceipt> {
      return (await this.ARx.uploader.uploadTransaction(this, opts)).data;
    }

    // parent type union not strictly required, but might be if this type gets extended
    upload(opts: UploadOptions & { getReceiptSignature: true }): Promise<UploadReceipt>;
    upload(opts?: UploadOptions): Promise<UploadResponse>;
    async upload(opts?: UploadOptions): Promise<UploadResponse> {
      return (await this.ARx.uploader.uploadTransaction(this, opts)).data;
    }

    // static fromRaw(rawTransaction: Buffer, ARxInstance: ARx): ARxTransaction {
    //   return new ARxTransaction(rawTransaction, ARxInstance, { dataIsRawTransaction: true });
    // }

    async getPrice(): Promise<BigNumber> {
      return this.ARx.utils.getPrice(this.ARx.tokenConfig.name, this.size);
    }

    async isValid(): Promise<boolean> {
      return arx.arbundles.DataItem.verify(this.getRaw());
    }
  }
  return ARxTransaction;
}

// export abstract class ARxTransaction extends DataItem {}

// export interface ARxTransaction extends DataItem {
//   size: number;
//   uploadWithReceipt(opts?: UploadOptions): Promise<UploadReceipt>;
//   upload(opts: UploadOptions & { getReceiptSignature: true }): Promise<UploadReceipt>;
//   upload(opts?: UploadOptions): Promise<UploadResponse>;
// }
