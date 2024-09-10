import { clientKeys } from "./utils";
import ARx from "../src/node/arx";

const transactionIds = {
  arweave: "zmYY3VGOWqqRN2zA_GdaD4vx0Br7Zj1nXVo3ZvcKKbg",
  ethereum: "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
};
const ARx_URL = "https://devnet.ARx.network/";

const currencies = Object.keys(transactionIds);
jest.setTimeout(20000);
describe("ARx.tokenConfig.getTx", () => {
  describe.each(currencies)("given we use %s", (keyName) => {
    let ARx: ARx;
    beforeAll(async () => {
      const { key, providerUrl } = clientKeys[keyName];
      ARx = new ARx(ARx_URL, keyName, key, { providerUrl });
      await ARx.ready();
    });

    describe("ARx.tokenConfig.getTx", () => {
      it("should return the transaction", async () => {
        const tx = await ARx.tokenConfig.getTx(transactionIds[keyName]);
        expect(tx).toBeDefined();
      });
    });
  });
});
