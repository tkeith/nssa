import { Page } from "puppeteer";
import yaml from "yaml";
import fs from "fs";
import os from "os";
import path from "path";

import { ParsedJson } from "@/lib/json-util";

type NonStringStructuredElement = {
  pointer: number;
  tag: string;
  classes: string[];
  id: string;
  children: StructuredElement[];
};

type StructuredElement =
  | string
  | NonStringStructuredElement
  | StructuredElement[];

async function getStructuredPage(page: Page): Promise<StructuredElement> {
  const structuredRepresentation: StructuredElement = await page.evaluate(
    (): StructuredElement => {
      function isVisible(element: Element): boolean {
        let style;
        try {
          style = window.getComputedStyle(element);
        } catch (e) {
          return element.checkVisibility();
        }
        return (
          (style == null || style.display !== "none") &&
          style.visibility !== "hidden" &&
          element.checkVisibility()
        );
      }

      let currentPointer = 1;

      function elementToStructuredObj(
        node: ChildNode,
      ): StructuredElement | undefined {
        if (!isVisible(node as Element)) {
          return;
        }
        if (node.nodeType == 3 /* text */) {
          // Text node
          let text = node.textContent;
          if (!text) {
            return;
          }
          // replace all whitespace with a single space
          text = text.replaceAll(/\s+/g, " ");
          // remove leading and trailing whitespace
          text = text.trim();
          if (text.length === 0) {
            return;
          }
          return text;
        } else if (
          node.nodeType === 1 /* element */ ||
          node.nodeType === 9 /* document */
        ) {
          const element = node as Element;

          const IGNORE_TAGS = [
            "SCRIPT",
            "STYLE",
            "NOSCRIPT",
            "HEAD",
            "META",
            "LINK",
            "HR",
          ];

          if (IGNORE_TAGS.includes(element.tagName)) {
            return;
          }

          const tag = element.tagName.toUpperCase();
          const classes = Array.from(element.classList);
          const id = element.id;
          const children: StructuredElement[] = [];

          // if there is a "value", add it as the first child
          const value = element.getAttribute("value");
          if (value) {
            children.push(value);
          }

          element.childNodes.forEach((child) => {
            const structuredChild = elementToStructuredObj(child);
            if (structuredChild) {
              children.push(structuredChild);
            }
          });

          let res: StructuredElement | undefined;

          // if image
          if (tag === "IMG" || tag === "SVG") {
            // get alt text
            const alt = element.getAttribute("alt");
            if (!alt) {
              res = undefined;
            } else {
              res = alt;
            }
          } else if (tag === "HTML" || tag === "BODY") {
            res = children;
            if (res.length === 0) {
              res = undefined;
            } else if (res.length === 1) {
              res = (res as StructuredElement[])[0]!;
            }
          } else {
            element.setAttribute("data-tk-pointer", currentPointer.toString());
            res = {
              pointer: currentPointer++,
              tag,
              classes,
              id,
              children,
            };
          }

          return res;
        }
      }

      const rootElement = document.documentElement;

      const res = elementToStructuredObj(rootElement); // Start from the root element
      if (!res) {
        throw new Error(
          "UNEXPECTED: expected elementToStructuredObj(rootElement) to not be undefined",
        );
      }
      if (typeof res === "string") {
        throw new Error(
          "UNEXPECTED: expected elementToStructuredObj(rootElement) to not be a string",
        );
      }
      return res;
    },
  );

  return structuredRepresentation;
}

function cleanStructuredElement(
  structuredElement: StructuredElement,
): ParsedJson {
  if (typeof structuredElement === "string") {
    return structuredElement;
  }

  if (Array.isArray(structuredElement)) {
    const children = structuredElement
      .map(cleanStructuredElement)
      .filter((x) => x != null);
    if (children.length === 0) {
      return null;
    }
    return children;
  }

  const children = structuredElement.children
    .map(cleanStructuredElement)
    .filter((x) => x != null);
  const res: ParsedJson = {};
  res.pointer = structuredElement.pointer;
  res.tag = structuredElement.tag;
  // if (structuredElement.classes.length > 0) {
  //   res.classes = structuredElement.classes;
  // }
  // if (structuredElement.id) {
  //   res.id = structuredElement.id;
  // }
  if (children.length > 0) {
    res.children = children;
  }

  // if span or div
  if (
    ["SPAN", "DIV", "CENTER", "UL", "P", "FOOTER", "SECTION", "SMALL"].includes(
      structuredElement.tag,
    )
  ) {
    if (children.length === 1) {
      return children[0] ?? null;
    }
    if (children.length === 0) {
      return null;
    }
  }

  return res;
}

export async function getPageContentForAi(page: Page): Promise<string> {
  let res = cleanStructuredElement(await getStructuredPage(page));
  // if not array, put it in an array
  if (!Array.isArray(res)) {
    res = [res];
  }
  const resString = yaml.stringify(res);

  const dateTime = new Date().toISOString().replace(/:/g, "-");
  const randomFileName = `browser_content_${dateTime}.yaml`;
  const tempFilePath = path.join(os.tmpdir(), randomFileName);
  await fs.promises.writeFile(tempFilePath, resString);
  console.log(`Content: ${tempFilePath}`);

  return resString;
}
