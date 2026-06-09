import assert from "node:assert/strict";
import test from "node:test";

const { parseAuthResponse } = await import("./parseAuthResponse.ts");

test("parseAuthResponse parses a valid JSON body", async () => {
  const response = new Response(
    JSON.stringify({
      ok: true,
      message: "Login correcto",
      user_id: "vendor-1",
    }),
    { status: 200 },
  );

  const result = await parseAuthResponse(response, "Login");

  assert.deepEqual(result, {
    ok: true,
    message: "Login correcto",
    user_id: "vendor-1",
  });
});

test("parseAuthResponse rejects an empty body", async () => {
  const response = new Response("", { status: 500 });

  await assert.rejects(
    parseAuthResponse(response, "Register"),
    /Register response without body \(status 500\)/,
  );
});

test("parseAuthResponse rejects invalid JSON", async () => {
  const response = new Response("not-json", { status: 200 });

  await assert.rejects(
    parseAuthResponse(response, "Login"),
    /Login response invalid JSON \(status 200\)/,
  );
});
