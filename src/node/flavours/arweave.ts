import type { JWKInterface } from "@dha-team/arbundles/node";
import BaseNodeARx from "../base";
import ArweaveConfig from "../tokens/arweave";
import type { NodeARxConfig } from "../types";

export class ArweaveARx extends BaseNodeARx {
  constructor({ url, key, config }: NodeARxConfig<JWKInterface>) {
    super({
      url,
      config,
      getTokenConfig: (arx) =>
        new ArweaveConfig({
          arx,
          name: "arweave",
          ticker: "AR",
          minConfirm: 10,
          providerUrl: config?.providerUrl ?? "https://arweave.net",
          wallet: key,
          isSlow: true,
          opts: config?.tokenOpts,
        }),
    });
  }
}
