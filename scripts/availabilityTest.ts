import ARx from "../src/cjsIndex";
import { readFileSync } from "fs";
import axios from "axios";
import Crypto from "crypto";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function a() {
  try {
    const JWK = JSON.parse(readFileSync("arweave.json").toString());
    const arx = new ARx({ url: "https://turbo.ardrive.io", token: "arweave", key: JWK });
    console.log(arx.address);
    for (let i = 0; i < 400; i++) {
      try {
        // await sleep(10_000);
        const transaction = await arx.createTransaction(Crypto.randomBytes(32).toString("base64"));
        await transaction.sign();
        console.log(transaction.id);
        const burl = `https://arweave.net/${transaction.id}/data`;
        const aurl = `https://g8way.io/${transaction.id}/data`;
        console.log("uploading");
        await transaction.upload();
        const resb2 = await axios.get(burl, { responseType: "arraybuffer", responseEncoding: "binary" });
        const resa2 = await axios.get(aurl, { responseType: "arraybuffer", responseEncoding: "binary" });
        const result = Buffer.compare(resb2.data, resa2.data);
        console.log(result);
      } catch (e: any) {
        console.log(e);
      }
    }
    console.log("done");
  } catch (e: any) {
    console.log(e);
  }
}
a();
