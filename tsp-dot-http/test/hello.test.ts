import { deepStrictEqual } from "node:assert";
import { describe, it } from "node:test";
import { emit } from "./test-host.js";

describe("hello", () => {
  it("emit output.txt with content hello world", async () => {
    const results = await emit(`op test(): void;`);
    deepStrictEqual(results, {
      "test.http": "### test",
    });
  });
});
