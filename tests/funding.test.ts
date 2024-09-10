import ARx from "../src/node/arx";
import { clientKeys } from "./utils";

jest.setTimeout(40000);
// for each token to test, include here the precalculated public key
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ARx_DEVNET_URL = "https://devnet.ARx.network/";

async function handleConfirmation(_token: string): Promise<void> {
  // do some stuff to make sure the transaction is confirmed
  // this is specific for each token and needs to be implemented
}

describe("given we some devnet wallets", () => {
  const currenciesToTestAgainst = Object.keys(clientKeys["devnet"]);
  const tokenConfigs = clientKeys["devnet"];

  describe.each(currenciesToTestAgainst)("and given we have a %s ARx wallet", (tokenName) => {
    const testBalance = 13;
    const tokenConfig: {
      key: string;
      provider: string;
    } = tokenConfigs[tokenName];
    let ARx: ARx;

    beforeEach(async () => {
      ARx = new ARx(ARx_DEVNET_URL, tokenName, tokenConfig.key, { providerUrl: tokenConfig.provider });
      await ARx.ready();
    });

    describe("and we want to fund the node", () => {
      it("should succeed", async () => {
        const fundResponse = await ARx.fund(testBalance, 1);
        expect(fundResponse).toBeDefined();
      });
      it("should have all the required response fields", async () => {
        const fundResponse = await ARx.fund(testBalance, 1);
        expect(fundResponse.reward).toBeDefined();
        expect(fundResponse.target).toBeDefined();
        expect(fundResponse.quantity).toBe(testBalance.toString());
        expect(fundResponse.id).toBeDefined();
      });

      it("should fund the node correctly", async () => {
        const balanceBefore = await ARx.getLoadedBalance();
        const fundResponse = await ARx.fund(testBalance, 1);
        expect(fundResponse).toBeDefined();

        await handleConfirmation(tokenName);
        const balanceAfter = await ARx.getLoadedBalance();
        expect(balanceAfter).toEqual(balanceBefore.plus(testBalance));
      });
      it("the fund method should put the correct amount onto the chain", async () => {
        const fundResponse = await ARx.fund(testBalance, 1);
        expect(fundResponse).toBeDefined();

        await handleConfirmation(tokenName);
        const transactionDetails = await ARx.tokenConfig.getTx(fundResponse.id);
        expect(transactionDetails).toBeDefined();
        expect(transactionDetails.amount.isEqualTo(testBalance)).toBeTruthy();
      });
    });
  });
});
