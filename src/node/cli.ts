#!/usr/bin/env node
// Note: DO NOT REMOVE/ALTER THE ABOVE LINE - it is called a 'shebang' and is vital for CLI execution.
import BigNumber from "bignumber.js";
import { Command } from "commander";
import { readFileSync } from "fs";
import inquirer from "inquirer";
import type NodeARx from "./arx";
import ARx from "./arx";
import { checkPath } from "./upload";

export const program = new Command();

let balpad, walpad; // padding state variables

// Define the CLI flags for the program
program
  .option("-h, --host <string>", "ARx node hostname/URL (eg https://turbo.ardrive.io)")
  .option("-n, --network <string>", "The network to use", "mainnet")
  .option("-w, --wallet <string>", "Path to keyfile or the private key itself", "default")
  .option("-t, --token <string>", "The token to use")
  .option("--timeout <number>", "The timeout (in ms) for API HTTP requests - increase if you get timeouts for upload")
  .option("--no-confirmation", "Disable confirmations for certain actions")
  .option("--tags [value...]", "Tags to include, format <name> <value>")
  .option(
    "--multiplier <number>",
    "Adjust the multiplier used for tx rewards - the higher the faster the network will process the transaction.",
    "1.00",
  )
  .option(
    "--batch-size <number>",
    "Adjust the upload-dir batch size (process more items at once - uses more resources (network, memory, cpu) accordingly!)",
    "5",
  )
  .option("-d, --debug", "Increases verbosity of errors and logs additional debug information. Used for troubleshooting.", false)
  .option("--index-file <string>", "Name of the file to use as an index for upload-dir manifests (relative to the path provided to upload-dir).")
  .option("--provider-url <string>", "Override the provider URL")
  .option("--contract-address <string>", "Override the contract address")
  .option("--content-type <string>", "Override the content type for *ALL* files uploaded")
  .option("--remove-deleted", "Removes previously uploaded (but now deleted) items from the manifest")
  .option("--force-chunking", "Forces usage of chunking for all files regardless of size");
// Define commands
// uses NPM view to query the package's version.
program.version(ARx.VERSION, "-v, --version", "Gets the current package version of the ARx client");

// Balance command - gets the provided address' balance on the specified bundler
program
  .command("balance")
  .description("Gets the specified user's balance for the current ARx node")
  .argument("<address>", "address")
  .action(async (address: string) => {
    try {
      options.address = balpad ? address.substring(1) : address;
      const arx = await init(options, "balance");
      const balance = await arx.utils.getBalance(options.address);
      // console.log(`Balance: ${balance} ${arx.tokenConfig.base[0]} (${arx.utils.unitConverter(balance).toFixed()} ${arx.token})`);
      console.log(`Balance: ${balance} winc (${arx.utils.unitConverter(balance).toFixed()} turbo credits)`);
    } catch (err: any) {
      console.error(`Error whilst getting balance: ${options.debug ? err.stack : err.message} `);
      return;
    }
  });

// Upload command - Uploads a specified file to the specified bundler using the loaded wallet.
program
  .command("upload")
  .description("Uploads a specified file")
  .argument("<file>", "relative path to the file you want to upload")
  .action(async (file: string) => {
    try {
      const arx = await init(options, "upload");
      const tags = parseTags(options?.tags);
      const res = await arx.uploadFile(file, { tags: tags ?? [] });
      console.log(`Uploaded to https://arweave.net/${res?.id}`);
    } catch (err: any) {
      console.error(`Error whilst uploading file: ${options.debug ? err.stack : err.message} `);
      return;
    }
  });

// program
//   .command("withdraw")
//   .description("Sends a fund withdrawal request")
//   .argument("<amount>", "amount to withdraw in token base units")
//   .action(async (_amount: string) => {
//     console.log("Withdraws are handled manually, please contact ar.io for further support");
//   });

program
  .command("upload-dir")
  .description("Uploads a folder (with a manifest)")
  .argument("<folder>", "relative path to the folder you want to upload")
  .action(async (folder: string) => {
    await uploadDir(folder);
  });

async function uploadDir(folder: string): Promise<void> {
  try {
    const arx = await init(options, "upload");
    const tags = parseTags(options?.tags);
    const res = await arx.uploadFolder(folder, {
      indexFile: options.indexFile,
      batchSize: +options.batchSize,
      interactivePreflight: options.confirmation,
      keepDeleted: !options.removeDeleted,
      manifestTags: tags ?? [],
      logFunction: async (log): Promise<void> => {
        console.log(log);
      },
      itemOptions: {
        upload: {},
      },
    });
    if (!res) return console.log("Nothing to upload");
    console.log(`Uploaded to https://arweave.net/${res.id}`);
  } catch (err: any) {
    console.error(`Error whilst uploading ${folder} - ${options.debug ? err.stack : err.message}`);
  }
}

const parseTags = (arr: string[]): { name: string; value: string }[] | undefined => {
  if (!arr) return;
  if (arr.length % 2 !== 0) throw new Error(`Tags key is missing a value!`);
  return arr.reduce<{ name: string; value: string }[]>((a, v, i) => {
    (i + 1) % 2 === 0 ? (a.at(-1)!.value = v) : a.push({ name: v, value: "" });
    return a;
  }, []);
};

program
  .command("fund")
  .description("Funds your account with the specified amount of atomic units")
  .argument("<amount>", "Amount to add in atomic units")
  .action(async (amount: string) => {
    try {
      if (isNaN(+amount)) throw new Error("Amount must be an integer");
      const arx = await init(options, "fund");
      const confirmed = await confirmation(
        `Confirmation: send ${amount} ${arx.tokenConfig.base[0]} (${arx.utils.unitConverter(amount).toFixed()} ${arx.token}) to ${arx.api.config.url.host
        } (${await arx.utils.getBundlerAddress(arx.token)})?\n Y / N`,
      );
      if (confirmed) {
        const tx = await arx.fund(new BigNumber(amount), options.multiplier);
        console.log(`Funding receipt: \nAmount: ${tx.quantity} with Fee: ${tx.reward} to ${tx.target} \nTransaction ID: ${tx.id} `);
      } else {
        console.log("confirmation failed");
      }
    } catch (err: any) {
      console.error(`Error whilst funding: ${options.debug ? err.stack : err.message} `);
      return;
    }
  });

program
  .command("price")
  .description("Check how much of a specific token is required for an upload of <amount> bytes")
  .argument("<bytes>", "The number of bytes to get the price for")
  .action(async (bytes: string) => {
    try {
      if (isNaN(+bytes)) throw new Error("Amount must be an integer");
      const arx = await init(options, "price");
      const cost = await arx.utils.getPrice(options.token, +bytes);
      console.log(
        `Price for ${bytes} bytes in winc is ${cost.toFixed(0)} ${arx.tokenConfig.base[0]} (${arx.utils
          .unitConverter(cost)
          .toFixed()} turbo credits)`,
      );
    } catch (err: any) {
      console.error(`Error whilst getting price: ${options.debug ? err.stack : err.message} `);
      return;
    }
  });

/**
 * Interactive CLI prompt allowing a user to confirm an action
 * @param message the message specifying the action they are asked to confirm
 */
async function confirmation(message: string): Promise<boolean> {
  if (!options?.confirmation) {
    return true;
  }
  const answers = await inquirer.prompt([{ type: "input", name: "confirmation", message }]);
  return answers.confirmation.toLowerCase() == "y";
}

/**
 * Initialisation routine for the CLI, mainly for initialising a ARx instance
 * @param opts the parsed options from the cli
 * @returns a new ARx instance
 */
async function init(opts, operation): Promise<ARx> {
  let wallet;
  let arx: NodeARx;
  // every option needs a host/network and token so ensure they're present
  if (!(opts.host || opts.network)) {
    throw new Error("Host (-h) or network (-n) parameter is required!");
  }
  if (!opts.token) {
    throw new Error("token flag (-t, --token) is required!");
  }
  // some operations do not require a wallet
  if (!["balance", "price"].includes(operation)) {
    // require a wallet
    if (opts.wallet === "default") {
      // default to wallet.json under the right conditions
      if (opts.token === "arweave" && (await checkPath("./wallet.json"))) {
        wallet = await loadWallet("./wallet.json");
      } else {
        throw new Error("Wallet (-w) required for this operation!");
      }
    } else {
      // remove padding if present
      wallet = await loadWallet(walpad ? opts.wallet.substring(1) : opts.wallet);
    }
  }
  try {
    // create and ready the ARx instance
    arx = new ARx({
      url: opts.host,
      network: opts.network,
      token: opts.token.toLowerCase(),
      key: wallet ?? "",
      config: {
        providerUrl: opts.providerUrl,
        contractAddress: opts.contractAddress,
        timeout: opts.timeout,
        debug: opts.debug,
      },
    });
    await arx.ready();
  } catch (err: any) {
    throw new Error(`Error initialising ARx client - ${options.debug ? err.stack : err.message}`);
  }
  // log the loaded address
  if (wallet && arx.address) {
    console.log(`Loaded address: ${arx.address}`);
  }

  if (opts.contentType) {
    arx.uploader.contentType = opts.contentType;
  }
  if (opts.forceChunking) {
    arx.uploader.useChunking = true;
  }

  return arx;
}

/**
 * Loads a wallet file from the specified path into a JWK interface
 * @param path path to the JWK file
 * @returns JWK interface
 */
async function loadWallet(path: string): Promise<any> {
  if (await checkPath(path)) {
    if (options.debug) {
      console.log("Loading wallet file");
    }
    return JSON.parse(readFileSync(path).toString());
  } else {
    if (options.debug) {
      console.log("Assuming raw key instead of keyfile path");
    }
    return path;
  }
}

const options = program.opts();
if (options.currency) options.token = options.currency;

const isScript = require.main === module;
if (isScript) {
  // to debug CLI: log process argv, load into var, and run in debugger.

  // console.log(JSON.stringify(process.argv));
  // process.exit(1);

  // replace this with dumped array. (make sure to append/include --no-confirmation)
  const argv = process.argv;

  // padding hack
  // this is because B64URL strings can start with a "-" which makes commander think it's a flag
  // so we pad it with a char that is not part of the B64 char set to prevent wrongful detection
  // and then remove it later.

  const bal = argv.indexOf("balance") + 1;
  if (bal != 0 && argv[bal] && /-{1}[a-z0-9_-]{42}/i.test(argv[bal])) {
    balpad = true;
    argv[bal] = "[" + argv[bal];
  }
  // padding hack to wallet addresses as well
  const wal = (!argv.includes("-w") ? argv.indexOf("--wallet") : argv.indexOf("-w")) + 1;
  if (wal != 0 && argv[wal] && /-{1}.*/i.test(argv[wal])) {
    walpad = true;
    argv[wal] = "[" + argv[wal];
  }
  // pass the CLI our argv
  program.parse(argv);
}

export const exportForTesting = {
  path: __filename,
};
