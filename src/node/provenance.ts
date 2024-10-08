import { Provenance } from "../common/provenance";
import type { UploadReceipt } from "../common/types";
import type { CreateAndUploadOptions } from "../common/types";
import type NodeARx from "./arx";

export class NodeProvenance extends Provenance {
  declare arx: NodeARx;
  constructor(arx: NodeARx) {
    super(arx);
  }

  public async uploadFile(path: string, opts?: CreateAndUploadOptions): Promise<UploadReceipt> {
    return this.arx.uploadFile(path, { ...opts, upload: { ...opts?.upload } }) as Promise<UploadReceipt>;
  }

  public async uploadFolder(
    path: string,
    {
      batchSize = 10,
      keepDeleted = true,
      indexFile,
      interactivePreflight,
      logFunction,
      manifestTags,
      itemOptions,
    }: {
      batchSize: number;
      keepDeleted: boolean;
      indexFile?: string;
      interactivePreflight?: boolean;
      logFunction?: (log: string) => Promise<void>;
      manifestTags?: { name: string; value: string }[];
      itemOptions?: CreateAndUploadOptions;
    } = { batchSize: 10, keepDeleted: true },
  ): Promise<UploadReceipt & { receipts: Map<string, UploadReceipt> }> {
    return this.arx.uploadFolder(path, {
      batchSize,
      keepDeleted,
      indexFile,
      interactivePreflight,
      logFunction,
      manifestTags,
      itemOptions: { ...itemOptions, upload: { ...itemOptions?.upload } },
    }) as Promise<UploadReceipt & { receipts: Map<string, UploadReceipt> }>;
  }
}
