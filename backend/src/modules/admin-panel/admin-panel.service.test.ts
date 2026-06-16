import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { adminPanelService } = await import("./admin-panel.service.ts");
const { adminPanelRepository } = await import("./admin-panel.repository.ts");
const { AppError } = await import("../../shared/AppError.ts");

afterEach(() => {
  mock.restoreAll();
});

const validUuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

test("createVendor rejects non-UUID adminId with AppError 400", async () => {
  await assert.rejects(
    adminPanelService.createVendor("not-a-uuid", {
      username: "test",
      tempPassword: "temp123456",
      displayName: "Test",
    }),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      return true;
    },
  );
});

test("createVendor rejects empty username with AppError 400", async () => {
  await assert.rejects(
    adminPanelService.createVendor(validUuid, {
      username: "",
      tempPassword: "temp123456",
      displayName: "Test",
    }),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      assert.equal(error.message, "username requerido");
      return true;
    },
  );
});

test("createVendor rejects short tempPassword with AppError 400", async () => {
  await assert.rejects(
    adminPanelService.createVendor(validUuid, {
      username: "test",
      tempPassword: "short",
      displayName: "Test",
    }),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      assert.equal(error.message, "La contrasena temporal debe tener al menos 6 caracteres");
      return true;
    },
  );
});

test("createVendor rejects short displayName with AppError 400", async () => {
  await assert.rejects(
    adminPanelService.createVendor(validUuid, {
      username: "test",
      tempPassword: "temp123456",
      displayName: "X",
    }),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      assert.equal(error.message, "display_name minimo 2 caracteres");
      return true;
    },
  );
});

test("createVendor throws AppError 409 when username already exists", async () => {
  mock.method(adminPanelRepository, "createVendor", async () => ({
    ok: false,
    message: "El username ya existe",
  }));

  await assert.rejects(
    adminPanelService.createVendor(validUuid, {
      username: "exists",
      tempPassword: "temp123456",
      displayName: "Ya Existe",
    }),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 409);
      return true;
    },
  );
});

test("createVendor returns userId and vendorId on success", async () => {
  mock.method(adminPanelRepository, "createVendor", async () => ({
    ok: true,
    message: "Vendedor creado correctamente",
    user_id: "new-user-id",
    vendor_id: "new-vendor-id",
  }));

  const result = await adminPanelService.createVendor(validUuid, {
    username: "newvendor",
    tempPassword: "temp123456",
    displayName: "Mi Tienda",
  });

  assert.equal(result.userId, "new-user-id");
  assert.equal(result.vendorId, "new-vendor-id");
});

test("listVendors rejects invalid adminId with AppError 400", async () => {
  await assert.rejects(
    adminPanelService.listVendors("bad-id"),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      return true;
    },
  );
});

test("listVendors returns vendor array on success", async () => {
  const vendors = [
    {
      user_id: "user-1",
      username: "vendor1",
      display_name: "Tienda 1",
      vendor_id: "vendor-1",
      is_active: true,
      is_deleted: false,
      must_change_password: true,
      created_at: "2025-01-01T00:00:00Z",
    },
  ];

  mock.method(adminPanelRepository, "listVendors", async () => vendors);

  const result = await adminPanelService.listVendors(validUuid);

  assert.deepEqual(result, vendors);
});

test("deactivateVendor rejects invalid adminId", async () => {
  await assert.rejects(
    adminPanelService.deactivateVendor("bad-id", validUuid),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      return true;
    },
  );
});

test("deactivateVendor rejects invalid vendorId", async () => {
  await assert.rejects(
    adminPanelService.deactivateVendor(validUuid, "bad-id"),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      return true;
    },
  );
});

test("deactivateVendor throws AppError 404 when vendor not found", async () => {
  mock.method(adminPanelRepository, "deactivateVendor", async () => ({
    ok: false,
    message: "Vendedor no encontrado",
  }));

  await assert.rejects(
    adminPanelService.deactivateVendor(validUuid, validUuid),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 404);
      return true;
    },
  );
});
