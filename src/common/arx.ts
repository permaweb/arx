import type { DataItemCreateOptions, Signer } from "@dha-team/arbundles";
import type BigNumber from "bignumber.js";
import type { Readable } from "stream";
import type Api from "./api";
import type Fund from "./fund";
import type { Provenance } from "./provenance";
import buildARxTransaction from "./transaction";
import type { Transaction } from "./transactions";
import type {
  Arbundles,
  CreateAndUploadOptions,
  Token,
  FundResponse,
  ARxTransaction,
  ARxTransactionCreateOptions,
  ARxTransactonCtor,
  UploadReceipt,
  UploadReceiptData,
  UploadResponse,
  Network,
} from "./types";
import type Uploader from "./upload";
import Utils from "./utils";

export default abstract class ARx {
  public api!: Api;
  public utils!: Utils;
  public uploader!: Uploader;
  public funder!: Fund;
  public _address: string | undefined;
  public token!: string;
  public tokenConfig!: Token;
  public provenance!: Provenance;
  public transactions!: Transaction;
  protected _readyPromise: Promise<void> | undefined;
  public url: URL;
  public arbundles: Arbundles;
  public ARxTransaction: ARxTransactonCtor;
  static VERSION = "REPLACEMETVERSION";
  public debug = false;

  constructor({ url, network, arbundles }: { url?: string; network?: Network; arbundles: Arbundles }) {
    switch (network) {
      // case undefined:
      case "mainnet":
        url = "https://turbo.ardrive.io";
        break;
      case "devnet":
        url = "https://turbo.ardrive.io";
        break;
    }
    if (!url) throw new Error(`Missing required ARx constructor parameter: URL or valid Network`);
    const parsed = new URL(url);

    this.url = parsed;
    this.arbundles = arbundles;
    this.ARxTransaction = buildARxTransaction(this);
  }

  get address(): string {
    if (!this._address) throw new Error("Address is undefined, please provide a wallet or run `await arx.ready()`");
    return this._address;
  }

  set address(address: string) {
    this._address = address;
  }

  get signer(): Signer {
    return this.tokenConfig.getSigner();
  }

  /**
   * Gets the balance for the loaded wallet
   * @returns balance (in winston)
   */
  async getLoadedBalance(): Promise<BigNumber> {
    if (!this.address) throw new Error("address is undefined");
    return this.utils.getBalance(this.address);
  }
  /**
   * Gets the balance for the specified address
   * @param address address to query for
   * @returns the balance (in winston)
   */
  async getBalance(address: string): Promise<BigNumber> {
    return this.utils.getBalance(address);
  }

  /**
   * Sends amount atomic units to the specified bundler
   * @param amount amount to send in atomic units
   * @returns details about the fund transaction
   */
  async fund(amount: BigNumber.Value, multiplier?: number): Promise<FundResponse> {
    return this.funder.fund(amount, multiplier);
  }

  /**
   * Calculates the price for [bytes] bytes for the loaded token and ARx node.
   * @param bytes
   * @returns
   */
  public async getPrice(bytes: number): Promise<BigNumber> {
    return this.utils.getPrice(this.token, bytes);
  }

  public async verifyReceipt(receipt: UploadReceiptData): Promise<boolean> {
    return Utils.verifyReceipt(this.arbundles, receipt);
  }

  /**
   * Create a new ARxTransactions (flex token arbundles dataItem)
   * @param data
   * @param opts - dataItemCreateOptions
   * @returns - a new ARxTransaction instance
   */
  createTransaction(data: string | Buffer, opts?: ARxTransactionCreateOptions): ARxTransaction {
    return new this.ARxTransaction(data, this, opts);
  }

  async withdrawBalance(_amount: BigNumber.Value | "all"): Promise<void> {
    console.log("Withdraws are handled manually, please contact ar.io for further support");
  }

  async withdrawAll(): Promise<void> {
    console.log("Withdraws are handled manually, please contact ar.io for further support");
  }

  /**
   * Returns the signer for the loaded token
   */
  getSigner(): Signer {
    return this.tokenConfig.getSigner();
  }

  async upload(data: string | Buffer | Readable, opts?: CreateAndUploadOptions): Promise<UploadResponse> {
    return this.uploader.uploadData(data, opts);
  }

  /**
   * @deprecated - use upload instead
   */
  async uploadWithReceipt(data: string | Buffer | Readable, opts?: DataItemCreateOptions): Promise<UploadReceipt> {
    return this.uploader.uploadData(data, { ...opts }) as Promise<UploadReceipt>;
  }

  async ready(): Promise<this> {
    this.tokenConfig.ready ? await this.tokenConfig.ready() : true;
    this.address = this.tokenConfig.address!;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  get transaction() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const oThis = this;
    return {
      fromRaw(rawTransaction: Uint8Array): ARxTransaction {
        return new oThis.ARxTransaction(rawTransaction, oThis, { dataIsRawTransaction: true });
      },
    };
  }
}
