import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "anon-key";
process.env.JWT_SECRET ??= "test-secret";

const { supabaseAdmin } = await import("../../lib/supabaseClient.ts");
const { storeManagementRepository } = await import(
  "./store-management.repository.ts"
);

afterEach(() => mock.restoreAll());

test("createStore calls the Supabase RPC with members and contacts", async () => {
  const rpcMock = mock.method(supabaseAdmin, "rpc", async () => ({
    data: {
      ok: true,
      store_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      emporium_name: "Emporio Azul",
    },
    error: null,
  }) as never);

  const result = await storeManagementRepository.createStore(
    "99999999-8888-7777-6666-555555555555",
    {
      emporiumName: "Emporio Azul",
      displayName: "Tienda Central",
      members: [{
        username: "encargado",
        tempPassword: "Temporal123",
        role: "owner",
      }],
      contacts: [{ channel: "whatsapp", value: "51999999999" }],
    },
  );

  assert.equal(result.ok, true);
  assert.equal(
    rpcMock.mock.calls[0]?.arguments[0],
    "admin_create_store_with_members",
  );
  assert.deepEqual(
    (rpcMock.mock.calls[0]?.arguments[1] as Record<string, unknown>).p_members,
    [{
      username: "encargado",
      temp_password: "Temporal123",
      role: "owner",
    }],
  );
});

test("listStores returns the RPC data", async () => {
  mock.method(supabaseAdmin, "rpc", async () => ({
    data: {
      ok: true,
      data: { emporium_name: "Emporio Azul", stores: [] },
    },
    error: null,
  }) as never);

  const result = await storeManagementRepository.listStores(
    "99999999-8888-7777-6666-555555555555",
  );

  assert.equal(result.emporium_name, "Emporio Azul");
  assert.deepEqual(result.stores, []);
});

test("repository hides Supabase errors", async () => {
  mock.method(supabaseAdmin, "rpc", async () => ({
    data: null,
    error: { message: "internal.supabase.local" },
  }) as never);

  await assert.rejects(
    storeManagementRepository.listStores(
      "99999999-8888-7777-6666-555555555555",
    ),
    { message: "No se pudieron obtener las tiendas" },
  );
});

test("member and contact operations use dedicated admin RPCs", async () => {
  const rpc = mock.method(supabaseAdmin, "rpc", async () => ({
    data: { ok: true },
    error: null,
  }) as never);
  const adminId = "99999999-8888-7777-6666-555555555555";
  const storeId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  assert.equal(await storeManagementRepository.addMember(
    adminId,
    storeId,
    { username: "manager", tempPassword: "Temporal123" },
  ), true);
  assert.equal(await storeManagementRepository.setMemberActive(
    adminId,
    storeId,
    "manager",
    false,
  ), true);
  assert.equal(await storeManagementRepository.updateContacts(
    adminId,
    storeId,
    [{ channel: "email", value: "demo@example.com" }],
  ), true);

  assert.deepEqual(
    rpc.mock.calls.map((call) => call.arguments[0]),
    [
      "admin_add_store_member",
      "admin_set_store_member_active",
      "admin_update_store_contacts",
    ],
  );
});
