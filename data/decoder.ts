// deno-lint-ignore-file
import { descriptor, descriptorMap } from "./common.ts";

export class Decoder {
  #errors: string[] = [];
  #data!: Uint8Array;
  #offset: number = 0;

  // external decode function that is called by the user
  decode<T>(data: Uint8Array): T {
    this.#data = data;
    const value = this.#decode();
    if (this.#errors.length > 0) {
      let message = this.#errors[0];
      if (this.#errors.length > 1) {
        message += ` and ${this.#errors.length - 1} more errors`;
      }
      throw new Error(message);
    }
    return value;
  }

  // internal decode function that is called recursively
  #decode(): any {
    switch (this.#data[this.#offset]) {
      case descriptor.String:
        return this.#decodeString();
      case descriptor.True:
      case descriptor.False:
        return this.#decodeBoolean();
      case descriptor.Null:
        return this.#decodeNull();
      case descriptor.Number:
        return this.#decodeNumber();
      case descriptor.Array:
        return this.#decodeArray();
      case descriptor.Object:
        return this.#decodeObject();
      default:
        this.#errors.push(`unknown descriptor ${this.#data[this.#offset]}`);
        return undefined;
    }
  }

  #decodeString(): string {
    if (!this.#expect(descriptor.String)) {
      return "";
    }
    this.#offset++;

    const length = this.#decodeUint32();

    // read the string from the buffer up until the length
    const text = new TextDecoder().decode(
      this.#data.slice(this.#offset, this.#offset + length)
    );
    this.#offset += length;

    return text;
  }

  #decodeBoolean(): boolean {
    if (!this.#expect([descriptor.True, descriptor.False])) {
      return false;
    }

    const value = this.#data[this.#offset] === 1;
    this.#offset++;

    return value;
  }

  #decodeNull(): null {
    if (!this.#expect(descriptor.Null)) {
      return null;
    }
    this.#offset++;

    return null;
  }

  #decodeNumber(): number {
    if (!this.#expect(descriptor.Number)) {
      return 0;
    }
    this.#offset++;

    // read 64 bit float from the buffer as little endian
    const value = new DataView(this.#data.buffer).getFloat64(
      this.#offset,
      true
    );
    this.#offset += 8;

    return value;
  }

  #decodeArray(): any[] {
    if (!this.#expect(descriptor.Array)) {
      return [];
    }
    this.#offset++;

    const length = this.#decodeUint32();
    
    const result: any[] = [];
    const startOffset = this.#offset;
    
    // while we haven't reached the end of the array
    while (this.#offset < startOffset + length) {
      const elem = this.#decode()
      result.push(elem);
    }

    return result;
  }

  #decodeObject(): Record<string, any> {
    if (!this.#expect(descriptor.Object)) {
      return {};
    }
    this.#offset++;

    const length = this.#decodeUint32();

    const result: Record<string, any> = {};
    const startOffset = this.#offset;

    // while we haven't reached the end of the object
    while (this.#offset < startOffset + length) {
      // decode the key
      const key = this.#decodeString();
      // decode the value
      const value = this.#decode();

      result[key] = value;
    }

    return result;
  }

  // helper function to decode a 32 bit unsigned integer
  // this is used as length values internally
  #decodeUint32(): number {
    const value = new DataView(this.#data.buffer).getUint32(this.#offset, true);
    this.#offset += 4;
    return value;
  }

  // helper function to check if the descriptor is correct
  // accepts a single number or an array of numbers and checks if the buffer
  // at the pointer matches any of the numbers
  #expect(
    d: keyof typeof descriptorMap | (keyof typeof descriptorMap)[]
  ): boolean {
    const check = (d: number) => this.#data[this.#offset] === d;

    if (Array.isArray(d)) {
      if (!d.some((v) => check(v))) {
        const expected = d.map((v) => descriptorMap[v]).join(", ");
        this.#errors.push(
          `malformed descriptor, expected any of ${expected} but got ${
            descriptorMap[
              this.#data[this.#offset] as keyof typeof descriptorMap
            ]
          }`
        );
        return false;
      }
    } else {
      if (!check(d)) {
        this.#errors.push(
          `malformed descriptor, expected ${descriptorMap[d]} but got ${
            descriptorMap[
              this.#data[this.#offset] as keyof typeof descriptorMap
            ]
          }`
        );
        return false;
      }
    }

    return true;
  }
}
