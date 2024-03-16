export default function getTagContent(input: string, tag: string) {
  const startTag = `<${tag}>`;
  const endTag = `</${tag}>`;

  const startTagIndex = input.indexOf(startTag);
  const endTagIndex = input.indexOf(endTag);
  const secondStartTagIndex = input.indexOf(startTag, startTagIndex + 1);
  const secondEndTagIndex = input.indexOf(endTag, endTagIndex + 1);

  if (startTagIndex === -1 && endTagIndex === -1) {
    return undefined;
  }

  if (
    startTagIndex === -1 ||
    endTagIndex === -1 ||
    startTagIndex >= endTagIndex ||
    secondStartTagIndex !== -1 ||
    secondEndTagIndex !== -1
  ) {
    throw new Error(
      `Invalid input: Missing or improperly placed start or end tag.`,
    );
  }

  const contentStart = startTagIndex + startTag.length;
  const contentEnd = endTagIndex;

  let content = input.slice(contentStart, contentEnd).trim();

  if (content.startsWith("```")) {
    const endOfFirstBackticks = content.indexOf("\n");
    content = content.slice(endOfFirstBackticks + 1);
  }
  if (content.endsWith("```")) {
    content = content.slice(0, -3);
  }

  content = content.trim();

  return content;
}
