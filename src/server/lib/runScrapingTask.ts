import { env } from "@/env";
import { SYSTEM_PROMPT } from "@/server/lib/prompts";
import { getPageContentForAi } from "@/server/lib/getPageContentForAI";
import OpenAI from "openai";
import puppeteer, { Browser, Page } from "puppeteer";
import yaml from "yaml";
import getTagContent from "@/lib/getTagContent";
import assert from "assert";

const openaiApiKey = env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: openaiApiKey });

export async function runScrapingTask(task: string): Promise<number> {
  const browser = await puppeteer.launch({
    defaultViewport: { height: 2000, width: 1000 },
    headless: false,
    // devtools: true,
  });

  let hasNavigated = false;

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `User task:\n\n${task}\n\nCurrent URL: <no page loaded>\n\nCurrent page content:\n<no page loaded>`,
    },
  ];

  while (true) {
    // the most recent page is the current page
    // this correctly handles cases where the AI clicks on something that opens in a new tab
    const pages = await browser.pages();
    const page = pages[pages.length - 1];
    if (!page) {
      throw new Error("no pages");
    }

    const openaiStream = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      temperature: 1,
      messages,
      stream: true,
    });

    let accumulatedResponse = "";

    console.log("\n--- GPT ---");

    for await (const chunk of openaiStream) {
      const newChunkContent = chunk.choices[0]?.delta?.content;
      if (newChunkContent) {
        accumulatedResponse += newChunkContent;
        process.stdout.write(newChunkContent);
      }
    }
    if (!accumulatedResponse.endsWith("\n")) {
      console.log("");
    }
    console.log("-----------\n");

    const possibleActions = [
      "goto",
      "click",
      "type-without-pressing-enter",
      "type-and-press-enter",
      "answer",
    ];

    let tookAction = false;
    let waitSeconds = 0;

    for (const action of possibleActions) {
      const tagContent = getTagContent(accumulatedResponse, action);
      if (tagContent) {
        if (action === "goto") {
          const url = tagContent;
          await page.goto(url);
          hasNavigated = true;
          waitSeconds = 2;
        } else if (action === "click") {
          const pointer = getTagContent(tagContent, "pointer");
          assert(pointer, "click action did not contain a pointer");
          const el = await page.$(`[data-tk-pointer="${pointer}"]`);
          if (!el) {
            throw new Error(`element with pointer ${pointer} not found`);
          }
          await el.click();
          waitSeconds = 5;
        } else if (action === "type-without-pressing-enter") {
          const pointer = getTagContent(tagContent, "pointer");
          assert(
            pointer,
            "type-without-pressing-enter action did not contain a pointer",
          );
          const text = getTagContent(tagContent, "text");
          assert(
            text,
            "type-without-pressing-enter action did not contain text",
          );
          const el = await page.$(`[data-tk-pointer="${pointer}"]`);
          if (!el) {
            throw new Error(`element with pointer ${pointer} not found`);
          }
          for (let i = 0; i < 3; i++) {
            await el.click();
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          await el.type(text);
          waitSeconds = 2;
        } else if (action === "type-and-press-enter") {
          const pointer = getTagContent(tagContent, "pointer");
          assert(
            pointer,
            "type-and-press-enter action did not contain a pointer",
          );
          const text = getTagContent(tagContent, "text");
          assert(text, "type-and-press-enter action did not contain text");
          const el = await page.$(`[data-tk-pointer="${pointer}"]`);
          if (!el) {
            throw new Error(`element with pointer ${pointer} not found`);
          }
          for (let i = 0; i < 3; i++) {
            await el.click();
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          await el.type(text);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await el.press("Enter");
          waitSeconds = 5;
        } else if (action === "answer") {
          const answer = parseInt(tagContent);
          return answer;
        }

        tookAction = true;
        break;
      }
    }
    if (!tookAction) {
      throw new Error(
        `GPT response did not contain any of the possible actions: ${possibleActions.join(
          ", ",
        )}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));

    const currentUrl = hasNavigated ? page.url() : "<no page loaded>";

    const pageContentForAi = hasNavigated
      ? await getPageContentForAi(page)
      : "<no page loaded>";

    messages.push({
      role: "user",
      content: `Current URL: ${currentUrl}\n\nCurrent page content:\n${pageContentForAi}`,
    });
  }
}
