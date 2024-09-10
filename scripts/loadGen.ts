import ARx from "../src/cjsIndex";
import { checkPath } from "../src/node/upload";
import { genData } from "./genData";
import { promises, readFileSync } from "fs";
import { checkManifestARx } from "./checkManifest";

const keys = JSON.parse(readFileSync("wallet.json").toString());

const w = keys.arweave;

(async function () {
  const nodeUrl = "https://turbo.ardrive.io";
  const testFolder = `./testFolder/${process.pid}`;
  let arx = new ARx({ url: nodeUrl, currency: "arweave", wallet: w });
  await arx.ready();
  console.log(arx.address);

  await promises.rm(`${testFolder}-manifest.json`, { force: true });
  await promises.rm(`${testFolder}-manifest.csv`, { force: true });
  await promises.rm(`${testFolder}-id.txt`, { force: true });

  if (!(await checkPath(`./${testFolder}`))) {
    await genData(`./${testFolder}`, 10_000, 100, 1_000);
  }

  arx.uploader.useChunking = false;
  const resu = await arx.uploadFolder(`./${testFolder}`, {
    batchSize: 20,
    keepDeleted: false,
    logFunction: async (log): Promise<void> => {
      console.log(log);
    },
  });
  console.log(resu);

  /* const checkResults = */ await checkManifestARx(`./${testFolder}`, nodeUrl);
})();
