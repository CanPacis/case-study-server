// deno-lint-ignore-file no-explicit-any
import { descriptor } from "./common.ts";

const DEFAULT_SIZE = 4094;
// Create a pre-allocated buffer to avoid memory allocations
const buffer = new Uint8Array(DEFAULT_SIZE);

export class Encoder {
  #buffer: Uint8Array;
  #pointer: number = 0;

  constructor(size: number = DEFAULT_SIZE) {
    if (size > DEFAULT_SIZE) {
      this.#buffer = new Uint8Array(size);
    } else {
      // use the pre-allocated buffer if the size is not practically different from the default size
      this.#buffer = buffer;
    }
  }

  // external encode function that is called by the user
  // returns the byte array
  encode(value: any): Uint8Array {
    this.#pointer = 0;
    this.#encode(value);
    return this.#buffer.slice(0, this.#pointer);;
  }

  // encode and encode variants return the number of bytes written
  // internal encode function that is called recursively
  #encode(value: any): number {
    switch (typeof value) {
      case "string":
        return this.#encodeString(value);
      case "boolean":
        return this.#encodeBoolean(value);
      case "number":
        return this.#encodeNumber(value);
      case "object":
        if (value === null) {
          return this.#encodeNull();
        }

        if (Array.isArray(value)) {
          return this.#encodeArray(value);
        }

        return this.#encodeObject(value);
    }

    return 0;
  }

  #encodeString(value: string): number {
    // write the descriptor
    this.#buffer[this.#pointer++] = descriptor.String;
    // write the content of the string 4 bytes ahead and do not move the pointer
    // use .encodeInto to avoid memory allocations
    const result = new TextEncoder().encodeInto(
      value,
      this.#buffer.subarray(this.#pointer + 4)
    );
    // write the length of the string before the content
    this.#encodeUint32(result.written);
    // move the pointer by the length of the string
    this.#pointer += result.written;

    // return the total length of the string
    return result.written + 4 + 1;
  }

  #encodeBoolean(value: boolean): number {
    this.#buffer[this.#pointer++] = value ? descriptor.True : descriptor.False;
    return 1;
  }

  #encodeNumber(value: number): number {
    this.#buffer[this.#pointer++] = descriptor.Number;
    const view = new DataView(this.#buffer.buffer);
    view.setFloat64(this.#pointer, value, true);
    this.#pointer += 8;

    return 8 + 1;
  }

  #encodeNull(): number {
    this.#buffer[this.#pointer++] = descriptor.Null;

    return 1;
  }

  #encodeArray(value: any[]): number {
    this.#buffer[this.#pointer++] = descriptor.Array;
    let total = 0;
    // leave space for the length of the array
    this.#pointer += 4;
    for (const item of value) {
      total += this.#encode(item);
    }
    // go back to the length of the array and write the total length of the array
    this.#pointer -= total + 4;
    this.#encodeUint32(total);

    // move the pointer by the total length of the array
    this.#pointer += total;

    return total + 1 + 4;
  }

  #encodeObject(value: Record<any, any>): number {
    this.#buffer[this.#pointer++] = descriptor.Object;
    const keys = Object.keys(value);

    let total = 0;
    // leave space for the length of the array
    this.#pointer += 4;

    for (const key of keys) {
      if (typeof key !== "string") {
        continue;
      }
      total += this.#encodeString(key);
      total += this.#encode(value[key]);
    }

    // go back to the length of the object and write the total length of the data
    this.#pointer -= total + 4;
    this.#encodeUint32(total);

    // move the pointer by the total length of the object
    this.#pointer += total;

    return total + 1 + 4;
  }

  // used for length values
  #encodeUint32(value: number): number {
    const view = new DataView(this.#buffer.buffer);
    view.setUint32(this.#pointer, value, true);
    this.#pointer += 4;

    return 4;
  }
}
