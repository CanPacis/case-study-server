// deno-lint-ignore-file no-explicit-any
import { Decoder } from "./decoder.ts";
import { Encoder } from "./encoder.ts";

export { Encoder } from "./encoder.ts";
export { Decoder } from "./decoder.ts";

export function encode(value: any): Uint8Array {
  const encoder = new Encoder();
  return encoder.encode(value);
}

export function decode<T>(buffer: Uint8Array): T {
  const decoder = new Decoder();
  return decoder.decode(buffer);
}