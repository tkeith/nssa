import { env } from "@/env.mjs";
import "dotenv/config";

import OpenAI from "openai";
import puppeteer, { Browser, Page } from "puppeteer";
import yaml from "yaml";

const openaiApiKey = env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: openaiApiKey });

async function getTask(intent: string) {
  // TODO

  return "Use Google to find Travis Kelce's Twitter, visit it, and return the number of followers he has in integer format. For example, if he has 1.2 million followers, return <answer>1200000</answer>.";
}

async function runTask(task: string): Promise<number> {
  // TODO

  return 12345;
}
