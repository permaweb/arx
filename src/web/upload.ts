import Uploader from "../common/upload";
import type WebARx from "./arx";
import type { CreateAndUploadOptions, Manifest, UploadOptions, UploadResponse } from "../common/types";
import type { DataItem, JWKInterface, Tag } from "@dha-team/arbundles";
import { ArweaveSigner } from "@dha-team/arbundles";

export type TaggedFile = File & {
  tags?: Tag[];
};

export class WebUploader extends Uploader {
  protected arx: WebARx;
  constructor(arx: WebARx) {
    super(arx.api, arx.utils, arx.token, arx.tokenConfig, arx.ARxTransaction);
    this.arx = arx;
  }

  /**
   * Uploads a tagged file object, automatically adding the content-type tag if it's not present
   * @param file - File object to upload
   * @param opts - optional options for the upload / data item creation
   * @returns
   */
  public async uploadFile(file: File, opts?: CreateAndUploadOptions): Promise<UploadResponse> {
    const hasContentType = opts?.tags ? opts.tags.some(({ name }) => name.toLowerCase() === "content-type") : false;
    const tags = hasContentType ? opts?.tags : [...(opts?.tags ?? []), { name: "Content-Type", value: file.type }];
    return this.uploadData(Buffer.from(await file.arrayBuffer()), { tags, ...opts });
  }

  /**
   * Uploads a list of `File` objects & a generated folder manifest as a nested bundle using a temporary signing key.
   *
   * @param files list of `File` objects to upload - note: this code determines the paths via the File's `name` property - if it's undefined, it falls back to `webkitRelativePath`
   * @param {string} [opts.indexFileRelPath] Relative path for the index file, i.e `folder/index.html`
   * @param {Tag[]} [opts.manifestTags] List of tags to add onto the manifest transaction
   * @param {JWKInterface} [opts.throwawayKey] Provide your own throwaway JWK to use for signing the items in the bundle
   * @param {boolean} [opts.separateManifestTx=false] Whether upload the manifest as a separate tx (not in the nested bundle) - note: transactions in a nested bundle are not indexed by GQL - if you have tags you want to use to find the manifest, set this option to true
   *
   * @returns Standard upload response from the bundler node, plus the throwaway key & address, manifest, manifest TxId and the list of generated transactions
   */
  public async uploadFolder(
    files: TaggedFile[],
    opts?: UploadOptions & {
      indexFileRelPath?: string;
      manifestTags?: Tag[];
      throwawayKey?: JWKInterface;
      separateManifestTx?: boolean;
    },
  ): Promise<
    UploadResponse & {
      throwawayKey: JWKInterface;
      txs: DataItem[];
      throwawayKeyAddress: string;
      manifest: Manifest;
      manifestId: string;
    }
  > {
    const txs: DataItem[] = [];
    const txMap = new Map();
    const throwawayKey = opts?.throwawayKey ?? (await this.arx.arbundles.getCryptoDriver().generateJWK());
    const ephemeralSigner = new ArweaveSigner(throwawayKey);
    for (const file of files) {
      const path = file.name ?? file.webkitRelativePath;
      const hasContentType = file.tags ? file.tags.some(({ name }) => name.toLowerCase() === "content-type") : false;

      const tags = hasContentType ? file.tags : [...(file.tags ?? []), { name: "Content-Type", value: file.type }];

      const tx = this.arx.arbundles.createData(Buffer.from(await file.arrayBuffer()), ephemeralSigner, {
        tags,
      });
      await tx.sign(ephemeralSigner);
      txs.push(tx);
      txMap.set(path, tx.id);
    }
    // generate manifest, add to bundle
    const manifest = await this.generateManifest({ items: txMap, indexFile: opts?.indexFileRelPath });
    const manifestTx = this.arx.arbundles.createData(
      JSON.stringify(manifest),
      opts?.separateManifestTx ? this.arx.tokenConfig.getSigner() : ephemeralSigner,
      {
        tags: [
          { name: "Type", value: "manifest" },
          { name: "Content-Type", value: "application/x.arweave-manifest+json" },
          ...(opts?.manifestTags ?? []),
        ],
      },
    );
    if (opts?.separateManifestTx === true) {
      await manifestTx.sign(this.arx.tokenConfig.getSigner());
      await this.uploadTransaction(manifestTx, { ...opts });
    } else {
      await manifestTx.sign(ephemeralSigner);
      txs.push(manifestTx);
    }
    // upload bundle
    const bundleRes = await this.uploadBundle(txs, { ...opts });

    return {
      ...bundleRes.data,
      manifestId: manifestTx.id,
      manifest,
      throwawayKey: bundleRes.throwawayKey,
      throwawayKeyAddress: bundleRes.throwawayKeyAddress,
      txs: bundleRes.txs,
    };
  }
}
