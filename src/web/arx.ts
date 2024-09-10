import { BaseWebARx } from "./base";
import type { ARxConfig, Network } from "../common/types";
import getTokenConfig from "./tokens";

export class WebARx extends BaseWebARx {
  constructor({
    url,
    network,
    token,
    wallet,
    config,
  }: {
    url?: string;
    network?: Network;
    token: string;
    wallet?: { rpcUrl?: string; name?: string; provider: object; [key: string]: any };
    config?: ARxConfig;
  }) {
    super({
      url,
      wallet,
      config,
      network,
      getTokenConfig: (arx) =>
        getTokenConfig({
          arx,
          token: token.toLowerCase(),
          wallet: wallet?.provider ?? wallet,
          providerUrl: config?.providerUrl ?? wallet?.rpcUrl,
          contractAddress: config?.contractAddress,
          providerName: wallet?.name,
          tokenOpts: { ...config?.tokenOpts, ...wallet },
        }),
    });
  }

  public static async init(opts: {
    url: string;
    token: string;
    provider?: string;
    publicKey?: string;
    signingFunction?: (msg: Uint8Array) => Promise<Uint8Array>;
    collectSignatures?: (msg: Uint8Array) => Promise<{ signatures: string[]; bitmap: number[] }>;
    providerUrl?: string;
    timeout?: number;
    contractAddress?: string;
  }): Promise<WebARx> {
    const { url, token, provider, publicKey, signingFunction, collectSignatures, providerUrl, timeout, contractAddress } = opts;
    const ARx = new WebARx({
      url,
      token,
      // @ts-expect-error types
      wallet: { name: "init", provider: signingFunction ? publicKey : provider },
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
export default WebARx;
