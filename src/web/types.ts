import type { ARxConfig, Token } from "../common/types";

export interface WebToken extends Token {
  getPublicKey(): Promise<string | Buffer>;
  ready(): Promise<void>;
  inheritsRPC: boolean;
}

export type WebARxConfig<Provider = any> = {
  url: "node1" | "node2" | "devnet" | string;
  wallet: { name?: string; provider: Provider };
  config?: ARxConfig | undefined;
};
