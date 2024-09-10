import BaseNodeARx from "../base";
import EthereumConfig from "../tokens/ethereum";
import type { NodeARxConfig } from "../types";

export class EthereumARx extends BaseNodeARx {
  constructor({ url, key, config }: NodeARxConfig<string>) {
    super({
      url,
      config,
      getTokenConfig: (arx) =>
        new EthereumConfig({
          arx,
          name: "ethereum",
          ticker: "ETH",
          providerUrl: config?.providerUrl ?? "https://cloudflare-eth.com/",
          wallet: key,
          opts: config?.tokenOpts,
        }),
    });
  }
}
