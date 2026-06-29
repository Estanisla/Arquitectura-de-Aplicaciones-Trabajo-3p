import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "anon-key";
process.env.JWT_SECRET ??= "test-secret";

const { storeManagementRepository } = await import(
  "./store-management.repository.ts"
);
const { storeManagementService } = await import(
  "./store-management.service.ts"
);

const adminId = "99999999-8888-7777-6666-555555555555";
const storeId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const validInput = {
  emporiumName: " Emporio Azul ",
  displayName: " Tienda Central ",
  description: " Local principal ",
  members: [
    {
      username: " propietario ",
      tempPassword: "Temporal123",
      role: "owner" as const,
    },
    {
      username: "encargado",
      tempPassword: "Temporal456",
      role: "manager" as const,
    },
  ],
  contacts: [{ channel: "whatsapp" as const, value: " 51999999999 " }],
};

afterEach(() => {
  mock.restoreAll();
});

test("createStore validates, normalizes and uses the Supabase repository", async () => {
  const createMock = mock.method(
    storeManagementRepository,
    "createStore",
    async (_adminId, input) => {
      assert.equal(input.emporiumName, "Emporio Azul");
      assert.equal(input.displayName, "Tienda Central");
      assert.equal(input.members[0]?.username, "propietario");
      assert.equal(input.contacts[0]?.value, "51999999999");
      return {
        ok: true,
        store_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        emporium_name: "Emporio Azul",
      };
    },
  );

  const result = await storeManagementService.createStore(adminId, validInput);

  assert.equal(createMock.mock.callCount(), 1);
  assert.equal(result.emporiumName, "Emporio Azul");
});

test("createStore rejects stores without exactly one owner", async () => {
  await assert.rejects(
    storeManagementService.createStore(adminId, {
      ...validInput,
      members: validInput.members.map((member) => ({
        ...member,
        role: "manager" as const,
      })),
    }),
    { status: 400 },
  );
});

test("createStore rejects duplicated usernames and contacts", async () => {
  await assert.rejects(
    storeManagementService.createStore(adminId, {
      ...validInput,
      members: [
        validInput.members[0]!,
        {
          username: "PROPIETARIO",
          tempPassword: "Temporal456",
          role: "manager",
        },
      ],
    }),
    { status: 400 },
  );

  await assert.rejects(
    storeManagementService.createStore(adminId, {
      ...validInput,
      contacts: [
        validInput.contacts[0]!,
        { channel: "whatsapp", value: "51888888888" },
      ],
    }),
    { status: 400 },
  );
});

test("listStores returns the emporium stores from Supabase", async () => {
  mock.method(
    storeManagementRepository,
    "listStores",
    async () => ({ emporium_name: "Emporio Azul", stores: [] }),
  );

  const result = await storeManagementService.listStores(adminId);
  assert.equal(result.emporium_name, "Emporio Azul");
});

test("admin can add and deactivate a store manager", async () => {
  const add = mock.method(
    storeManagementRepository,
    "addMember",
    async () => true,
  );
  const status = mock.method(
    storeManagementRepository,
    "setMemberActive",
    async () => true,
  );

  await storeManagementService.addMember(
    adminId,
    storeId,
    " manager ",
    "Temporal123",
  );
  await storeManagementService.setMemberActive(
    adminId,
    storeId,
    "manager",
    false,
  );

  assert.equal(add.mock.calls[0]?.arguments[2].username, "manager");
  assert.equal(status.mock.calls[0]?.arguments[3], false);
});

test("contact updates validate channels before the repository", async () => {
  const update = mock.method(
    storeManagementRepository,
    "updateContacts",
    async () => true,
  );

  await storeManagementService.updateContacts(adminId, storeId, [{
    channel: "email",
    value: " demo@example.com ",
  }]);
  assert.equal(update.mock.calls[0]?.arguments[2][0]?.value, "demo@example.com");

  await assert.rejects(
    storeManagementService.updateContacts(adminId, storeId, [
      { channel: "email", value: "demo@example.com" },
      { channel: "email", value: "other@example.com" },
    ]),
    { status: 400 },
  );
});
