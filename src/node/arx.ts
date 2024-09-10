import type { ARxConfig, Network } from "../common/types";
import { BaseNodeARx } from "./base";
import getTokenConfig from "./tokens";

export class NodeARx extends BaseNodeARx {
  /**
   * Constructs a new ARx instance, as well as supporting subclasses
   * @param url - URL to the bundler
   * @param key - private key (in whatever form required)
   */
  constructor({ url, token, network, key, config }: { url?: string; network?: Network; token: string; key?: any; config?: ARxConfig }) {
    super({
      url,
      config,
      network,
      getTokenConfig: (arx) => {
        return getTokenConfig(
          arx,
          token.toLowerCase(),
          key,
          arx.api.getConfig().url.toString(),
          config?.providerUrl,
          config?.contractAddress,
          config?.tokenOpts,
        );
      },
    });
  }

  public static async init(opts: {
    url: string;
    token: string;
    privateKey?: string;
    publicKey?: string;
    signingFunction?: (msg: Uint8Array) => Promise<Uint8Array>;
    collectSignatures?: (msg: Uint8Array) => Promise<{ signatures: string[]; bitmap: number[] }>;
    providerUrl?: string;
    timeout?: number;
    contractAddress?: string;
  }): Promise<NodeARx> {
    const { url, token, privateKey, publicKey, signingFunction, collectSignatures, providerUrl, timeout, contractAddress } = opts;
    const ARx = new NodeARx({
      url,
      token,
      key: signingFunction ? publicKey : privateKey,
      config: {
        providerUrl,
        timeout,
        contractAddress,
        tokenOpts: { signingFunction, collectSignatures },
      },
    });
    await ARx.ready();
    return ARx;
  }
}
export default NodeARx;
