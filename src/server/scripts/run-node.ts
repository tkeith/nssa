import "dotenv/config";

import { ethers } from "ethers";

import { runScrapingTask } from "../lib/runScrapingTask";

import { env } from "../../env";
import { CHAIN_ID, deployment } from "@/lib/contract-link";

const walletPrivateKey = env.PRIVATE_KEY;
const chainId = CHAIN_ID;
const tmpOracleAddress = process.argv[2];
const oracleAbi = deployment.oracleAbi;
const rpcUrl = deployment.rpcUrl;

if (!tmpOracleAddress) {
  throw new Error("No oracle address specified");
}

const oracleAddress = tmpOracleAddress as `0x${string}`;

async function main() {
  // create wallet here
  const wallet = new ethers.Wallet(walletPrivateKey);
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const connectedWallet = wallet.connect(provider);

  const oracleContract = new ethers.Contract(
    oracleAddress,
    oracleAbi,
    connectedWallet,
  );

  const oracleScript = (await oracleContract.script()) as string;
  console.log(`Oracle Script: ${oracleScript}`);

  while (true) {
    const lastUpdatedAt = (await oracleContract.lastUpdatedAt()).toNumber();
    console.log(`Last Updated At: ${lastUpdatedAt}`);
    const cooloff = (await oracleContract.cooloff()).toNumber();
    console.log(`Cooloff: ${cooloff}`);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    console.log(`Current Timestamp: ${currentTimestamp}`);
    const currentBountiesHeld = (
      await oracleContract.currentBountiesHeld()
    ).toNumber();
    const bountyAmount = (await oracleContract.bountyAmount()).toNumber();
    console.log(`Current Bounties Held: ${currentBountiesHeld}`);
    console.log(`Bounty Amount: ${bountyAmount}`);
    if (
      currentTimestamp >= lastUpdatedAt + cooloff &&
      currentBountiesHeld >= bountyAmount
    ) {
      const res = await runScrapingTask(oracleScript);

      console.log(`Result: ${res}`);

      const updateTransaction = await oracleContract.updateValue(res);
      const receipt = await updateTransaction.wait(1);
      console.log(
        `Transaction confirmed with ${receipt.confirmations} confirmations`,
      );
      console.log(`Update Transaction: ${updateTransaction}`);
    } else {
      console.log(
        "Waiting for the cooloff period to end or sufficient bounties to be held...",
      );
      let waitTimeSeconds = lastUpdatedAt + cooloff - currentTimestamp + 1;
      if (waitTimeSeconds < 5) {
        waitTimeSeconds = 5;
      }
      console.log(`Waiting for ${waitTimeSeconds} seconds`);
      for (let i = 0; i < waitTimeSeconds; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        process.stdout.write(".");
      }
    }
  }
}

void main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
