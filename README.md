# arx

arx is a sdk/cli that anyone can use to upload permanent data to Arweave. 

## Drop-In Replacement

arx is a drop-in replacement for prior bundle service sdk's, most developers will only have to change two lines:

```javascript
import ARx from '@permaweb/arx'
```

```javascript
const arx = new ARx(...)
``` 


## Quick Start

### Install 

```sh 
npm i -g @permaweb/arx
```

### CLI 

By default the cli use turbo from ardrive, turbo allows you to purchase upload credits to use to provision your data on Arweave. Currently, turbo supports AR, SOL, ETH, and POL. You can also purchase credits using Fiat at app.ardrive.io.

#### Token names

| Token Symbol | Token Option Name |
| ---- | --- |
| AR | arweave |
| ETH | ethereum |
| POL | matic |
| SOL | solana |

#### Get Upload Credits

Purchase credits with AR

```sh 
arx fund ${TOKEN_QUANTITY} -t ${TOKEN} -w ${KEYFILE or PRIVATE_KEY}
```

#### Check Credit Balance

```sh 
arx balance ${PUBLIC_ADDRESS} -t ${TOKEN} 
```

### Upload single file

```sh 
arx upload ${FILENAME} -t ${TOKEN} -w ${KEYFILE or PRIVATE_KEY}
```

### Upload Directory

```sh 
arx upload-dir ${DIRNAME} -t ${TOKEN} -w ${KEYFILE or PRIVATE_KEY} --index-file index.html
```

### Get Credits by Bytes

```sh 
arx price ${BYTES}
``` 

## SDK

### Setup 

```javascript 
import fs from 'node:fs'
import ARx from '@permaweb/arx'

const arx = async () =>
  new ARx({ token: 'arweave', key: JSON.parse(fs.readFileSync("wallet.json", "utf-8")) })
```

### Purchase Credits

```js 
async function main() {
    console.log(
        await arx().fund(10 ** 12)
    )
}

main()

```



### Check Credit Balance

```js 
async function main() {
    console.log(
        await arx().getBalance("XoyCWBAygZ1MBTCkgGKf22627txBjsLu0m2FtGwQi0k")
    )
}

main()

```

### Upload File

```js 
async function main() {
    console.log(
        await arx().upload("myfile.bin", { tags: ... })
    )
}

main()

```


### Upload Directory

```javascript 
async function main() { 
    console.log(
        await arx().uploadFolder("./dist")
    )
}

main()

```

### Get Price

```javascript 
async function main() {
    console.log(
      await arx().getPrice(1024 * 1024)
    )
}

main()
```

## Development

```bash
npm install
npm run prod:build
```


## Support

If you run into any usage issues or found a bug, please create an issue at:

[Github](https://github.com/permaweb/arx) - https://github.com/permaweb/arx

## Resources

- https://arweave.org
- https://wiki.arweave.net
- https://cookbook.arweave.net
- https://cookbook_ao.arweave.net



