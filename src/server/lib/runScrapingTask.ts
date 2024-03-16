import assert from "assert";

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import puppeteer from "puppeteer";

import { env } from "@/env";
import getTagContent from "@/lib/getTagContent";
import { getPageContentForAi } from "@/server/lib/getPageContentForAI";
import { ACTIONS_PROMPT, SYSTEM_PROMPT } from "@/server/lib/prompts";


const MODEL_TO_USE: "openai" | "anthropic" = "openai";

const openaiApiKey = env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: openaiApiKey });

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export async function runScrapingTask(task: string): Promise<number> {
  const browser = await puppeteer.launch({
    defaultViewport: { height: 2000, width: 1000 },
    headless: false,
    // devtools: true,
  });

  let hasNavigated = false;

  const messages: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [
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

    let accumulatedResponse = "";

    console.log("\n--- " + MODEL_TO_USE + " ---");

    if (MODEL_TO_USE === "openai") {
      const openaiStream = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        temperature: 1,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          ...messages,
        ],
        stream: true,
      });

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
    } else if (MODEL_TO_USE === "anthropic") {
      const anthropicStream = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        temperature: 0.3,
        stream: true,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_tokens: 4096,
      });

      let step = 0;

      for await (const event of anthropicStream) {
        if (event.type === "message_start") {
          assert(step === 0);
          step++;
        } else if (event.type === "content_block_start") {
          assert(step === 1);
          step++;
        } else if (event.type === "content_block_delta") {
          assert(step === 2);
          assert(event.delta.type === "text_delta");
          accumulatedResponse += event.delta.text;
          process.stdout.write(event.delta.text);
        } else if (event.type === "content_block_stop") {
          assert(step === 2);
          step++;
        } else if (event.type === "message_delta") {
          assert(step === 3);
          step++;
          // if (event.delta.stop_reason === "stop_sequence") {
          //   accumulatedResponse += event.delta.stop_sequence;
          // }
        } else if (event.type === "message_stop") {
          assert(step === 4);
        }
      }
      if (!accumulatedResponse.endsWith("\n")) {
        console.log("");
      }
    } else {
      throw new Error("Invalid model");
    }
    console.log("-----------\n");

    messages.push({
      role: "assistant" as const,
      content: accumulatedResponse,
    });

    const possibleActions = [
      "goto",
      "click",
      "type-without-pressing-enter",
      "type-and-press-enter",
      "answer",
    ];

    let tookAction = false;
    let waitSeconds = 0;
    let errorMessage: string | undefined = undefined;

    for (const action of possibleActions) {
      const tagContent = getTagContent(accumulatedResponse, action);
      try {
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
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        errorMessage = (e as any).message as string;
      }
    }
    if (errorMessage) {
      messages.push({
        role: "user",
        content: errorMessage,
      });
    } else if (!tookAction) {
      messages.push({
        role: "user",
        content: `I'm not sure what to do. Please request one of these actions:\n\n${ACTIONS_PROMPT}`,
      });
    } else {
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
}
