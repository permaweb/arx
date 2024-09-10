// eslint-disable-file @typescript-eslint/no-unused-vars
import ARx from "../src/cjsIndex";
import { promises, readFileSync } from "fs";
import Crypto from "crypto";
import { checkPath } from "../src/node/upload";
import { genData } from "./genData";
import { checkManifestARx } from "./checkManifest";

const profiling = true;
async function main() {
  try {
    if (profiling) console.profile();
    const keys = JSON.parse(readFileSync("wallet.json").toString());

    const nodeUrl = "http://devnet.arx.xyz";
    const testFolder = "testFolder";

    const { key, providerUrl } = keys.testnet.ethereum;

    // let arx = await arx.init({ url: nodeUrl, currency: "aptos", publicKey: account.pubKey().toString(), signingFunction });
    // let arx = arx.init({ url: nodeUrl, currency: "aptos", privateKey: key })

    const arx = new ARx({ url: nodeUrl, token: "ethereum", key: key, config: { providerUrl } });
    await arx.ready();
    console.log(arx.address);

    let res;
    let tx;

    console.log(`balance: ${await arx.getLoadedBalance()}`);
    const bAddress = await arx.utils.getBundlerAddress(arx.token);
    console.log(`arx address: ${bAddress}`);

    tx = arx.createTransaction("Hello, world!", { tags: [{ name: "Content-type", value: "text/plain" }] });
    await tx.sign();
    console.log(await tx.isValid());

    tx = arx.transaction.fromRaw(tx.getRaw());

    const now = performance.now();
    res = await tx.upload({ getReceiptSignature: true });
    // tx = arx;
    // res = await arx.upload("Hello, world!", { upload: { getReceiptSignature: true } });
    console.log(performance.now() - now);
    const r3 = await res.verify();

    console.log(r3);
    console.log(res);

    const transaction = arx.createTransaction("Hello, world!", { tags: [{ name: "Content-type", value: "text/plain" }] });
    await transaction.sign();
    res = await transaction.upload({ getReceiptSignature: false });

    const signingInfo = await transaction.getSignatureData();
    const signed = await arx.tokenConfig.sign(signingInfo);
    transaction.setSignature(Buffer.from(signed));

    console.log(transaction.id);
    console.log(await transaction.isValid());

    res = await transaction.upload();
    console.log(`Upload: ${JSON.stringify(res)}`);

    const ctx = arx.createTransaction(Crypto.randomBytes(15_000_000).toString("base64"));
    await ctx.sign();
    console.log(ctx.isSigned());

    const uploader = arx.uploader.chunkedUploader;
    uploader.on("chunkUpload", (chunkInfo) => {
      console.log(chunkInfo);
    });
    res = uploader.setChunkSize(600_000).setBatchSize(2).uploadTransaction(ctx, { getReceiptSignature: false });

    await new Promise((r) => uploader.on("chunkUpload", r));
    uploader.pause();
    const uploadInfo = uploader.getResumeData();
    const uploader2 = arx.uploader.chunkedUploader;

    uploader2.on("chunkError", (e) => {
      console.error(`Error uploading chunk number ${e.id} - ${e.res.statusText}`);
    });
    uploader2.on("chunkUpload", (chunkInfo) => {
      console.log(
        `Uploaded Chunk with ID ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded}`,
      );
    });

    res = await uploader2.setResumeData(uploadInfo).setChunkSize(600_000).uploadTransaction(ctx);
    console.log(res);

    await promises.rm(`${testFolder}-manifest.json`, { force: true });
    await promises.rm(`${testFolder}-manifest.csv`, { force: true });
    await promises.rm(`${testFolder}-id.txt`, { force: true });

    if (!(await checkPath(`./${testFolder}`))) {
      await genData(`./${testFolder}`, 1_000, 100, 10_000);
    }

    const resu = await arx.uploadFolder(`./${testFolder}`, {
      batchSize: 20,
      keepDeleted: false,
      logFunction: async (log): Promise<void> => {
        console.log(log);
      },
    });
    console.log(resu);

    /* const checkResults = */ await checkManifestARx(`./${testFolder}`, nodeUrl);

    res = await arx.uploadFile(`./${testFolder}/0.json`);
    console.log(JSON.stringify(res));

    console.log(`balance: ${await arx.getLoadedBalance()}`);

    tx = await arx.fund(1, 1);
    console.log(tx);
    console.log(`balance: ${await arx.getLoadedBalance()}`);

    let resw = await arx.withdrawBalance(1);
    console.log(`withdrawal: ${JSON.stringify(resw)}`);
    console.log(`balance: ${await arx.getLoadedBalance()}`);
  } catch (e) {
    console.log(e);
  } finally {
    if (profiling) console.profileEnd();
    console.log("Done!");
  }
}

if (require.main === module) {
  const trap = (con, err) => {
    if (profiling) console.profileEnd();
    console.error(`Trapped error ${con}: ${JSON.stringify(err)}`);
  };
  // process.on("beforeExit", trap.bind(this, "beforeExit"))
  // process.on("exit", trap.bind(this, "exit"))
  process.on("uncaughtException", trap.bind(this, "uncaughtException"));
  process.on("unhandledRejection", trap.bind(this, "unhandledRejection"));
  main();
}
