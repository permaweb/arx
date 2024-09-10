import { Account, Aptos, Network } from "@aptos-labs/ts-sdk";
import { NodeARx } from "../src/node";

/**
 * This Example is for signing transactions (for arx uploads & Aptos transfers) using multiple participants
 * it assumes you are familiar with Aptos' MultiSignature terminology/example
 */
(async function () {
  // Genereate 3 key pairs and account instances
  const account1 = Account.generate();
  const account2 = Account.generate();
  const account3 = Account.generate();

  // Initiate aptos instance
  const aptos = new Aptos();

  // Create wallet object
  // note: the order of the participants is important!

  const wallet = { participants: [account1, account2, account3].map((a) => a.publicKey), threshold: 2 };

  // create signature collection function
  // this function is called whenever the client needs to collect signatures for signing
  const collectSignatures = async (message: Uint8Array) => {
    // get account 1 & 3 to sign the message
    const signatures = [account1, account3].map((a) => Buffer.from(a.sign(message).toUint8Array()));
    // bitmap signifies which participants (accounts) signed this message, it's 0 indexed, so this bitmap means account 1 & 3
    // !!this order must be the same as wallet.participants!!
    return { signatures: signatures, bitmap: [0, 2] };
  };

  // Create arx instance
  const arx = new NodeARx({
    url: "https://devnet.arx.xyz",
    token: "multiAptos",
    key: wallet,
    config: {
      providerUrl: Network.DEVNET,
      tokenOpts: { collectSignatures },
    },
  });
  // Ready the instance
  await arx.ready();

  // check the address
  console.log("Account address", arx.address);

  // check your arx balance
  console.log("arx balance", arx.utils.unitConverter(await arx.getLoadedBalance()).toString());

  const data = "Hello, world!";
  // create a transaction for this data
  const tx = arx.createTransaction(data, { tags: [{ name: "Content-type", value: "text/plain" }] });
  // sign the transaction (this will call `collectSignatures`)
  await tx.sign();

  console.log(await tx.isValid());
  // fund the account using the Aptos faucet
  await aptos.fundAccount({ accountAddress: arx.address!, amount: 5_000_000 });

  // check the cost for uploading the tx
  const cost = await arx.getPrice(tx.size);
  console.log("Upload costs", arx.utils.unitConverter(cost).toString());

  // fund arx cost * 1.1, as prices can change between funding & upload completion (especially for larger files)
  await arx.fund(cost.multipliedBy(1.1).integerValue());

  // check your arx balance
  console.log("arx balance", arx.utils.unitConverter(await arx.getLoadedBalance()).toString());

  // upload the data
  const res = await tx.upload();

  // check your arx balance after the upload
  console.log("arx balance", arx.utils.unitConverter(await arx.getLoadedBalance()).toString());

  console.log(`Data uploaded to https://arweave.net/${res.id}`);
  // done!
})();
