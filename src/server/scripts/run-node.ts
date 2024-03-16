import "dotenv/config";

import { runScrapingTask } from "@/server/lib/runScrapingTask";

async function main() {
  const task =
    "Use Google to find Travis Kelce's Twitter, visit it, and return the number of followers he has in integer format. For example, if he has 1.2 million followers, return <answer>1200000</answer>.";

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
