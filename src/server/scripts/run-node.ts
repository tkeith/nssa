import "dotenv/config";

import { runScrapingTask } from "@/server/lib/runScrapingTask";

async function main() {
  const task =
    // "Use Google to find Travis Kelce's Twitter, visit it, and return the number of followers he has in integer format. For example, if he has 1.2 million followers, return <answer>1200000</answer>.";
    // "Did Travis Kelce win his latest game? Answer 1 for yes, 2 for no.";
    "What is the price of the cheapest train ticket from Boston to New York on April 2 2024 via Amtrak?";

  const res = await runScrapingTask(task);

  console.log(`Result: ${res}`);
}

void main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
