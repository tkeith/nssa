import { z } from "zod";

export const parsedJsonSchema: z.ZodSchema<ParsedJson> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(parsedJsonSchema),
    z.record(parsedJsonSchema),
  ]),
);

export const parsedJsonArraySchema = z.array(parsedJsonSchema);

export const parsedJsonObjectSchema = z.record(parsedJsonSchema);

export type ParsedJsonArray = ParsedJson[];

export type ParsedJsonObject = Record<string, ParsedJson>;

export type ParsedJson =
  | boolean
  | number
  | string
  | null
  | ParsedJson[]
  | { [key: string]: ParsedJson };

export function parseJson(json: string): ParsedJson {
  return parsedJsonSchema.parse(JSON.parse(json));
}
