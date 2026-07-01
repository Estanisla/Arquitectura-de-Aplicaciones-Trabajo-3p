import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "anon-key";
process.env.JWT_SECRET ??= "test-secret";

const { vendorDashboardRepository } = await import(
  "./vendor-dashboard.repository.ts"
);
const { reviewsService } = await import("../reviews/reviews.service.ts");
const { vendorDashboardService } = await import("./vendor-dashboard.service.ts");

afterEach(() => mock.restoreAll());

const userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const storeId = "11111111-2222-3333-4444-555555555555";
const productId = "99999999-8888-7777-6666-555555555555";
const dashboard = {
  store_id: storeId,
  display_name: "Tienda",
  description: null,
  is_active: true,
  member_role: "manager" as const,
  products: [],
  contacts: [],
};

test("getMyProfile resolves the first managed store", async () => {
  mock.method(vendorDashboardRepository, "listManagedStores", async () => [{
    store_id: storeId,
    display_name: "Tienda",
    member_role: "manager" as const,
  }]);
  mock.method(vendorDashboardRepository, "getStoreDashboard", async () => dashboard);

  assert.deepEqual(await vendorDashboardService.getMyProfile(userId), dashboard);
});

test("list and dashboard validate ids and permission boundaries", async () => {
  await assert.rejects(
    vendorDashboardService.listManagedStores("invalid"),
    { status: 400 },
  );
  mock.method(vendorDashboardRepository, "getStoreDashboard", async () => null);
  await assert.rejects(
    vendorDashboardService.getStoreDashboard(userId, storeId),
    { status: 404 },
  );
});

test("createProduct validates input and returns its identifier", async () => {
  mock.method(vendorDashboardRepository, "getStoreDashboard", async () => dashboard);
  mock.method(vendorDashboardRepository, "createProduct", async () => productId);

  assert.equal(
    await vendorDashboardService.createProduct(userId, storeId, {
      name: "  Producto  ",
    }),
    productId,
  );
  await assert.rejects(
    vendorDashboardService.createProduct(userId, storeId, { name: "" }),
    { status: 400 },
  );
});

test("profile, contact and product writes propagate safe failures", async () => {
  mock.method(vendorDashboardRepository, "getStoreDashboard", async () => dashboard);
  mock.method(vendorDashboardRepository, "updateStoreProfile", async () => true);
  mock.method(vendorDashboardRepository, "updateStoreContacts", async () => true);
  mock.method(vendorDashboardRepository, "updateProduct", async () => false);
  mock.method(vendorDashboardRepository, "removeProduct", async () => false);

  await vendorDashboardService.updateStoreProfile(userId, storeId, {
    displayName: "Tienda nueva",
  });
  await vendorDashboardService.updateStoreContacts(userId, storeId, [{
    channel: "email",
    value: "tienda@example.com",
  }]);
  await assert.rejects(
    vendorDashboardService.updateProduct(userId, productId, { name: "Producto" }),
    { status: 404 },
  );
  await assert.rejects(
    vendorDashboardService.removeProduct(userId, productId),
    { status: 404 },
  );
});

test("store reviews require membership before reading MongoDB", async () => {
  mock.method(vendorDashboardRepository, "getStoreDashboard", async () => dashboard);
  mock.method(reviewsService, "getReviewsForVendor", async () => [{
    id: "review",
    product_id: productId,
    vendor_id: storeId,
    product_name: "Producto",
    rating: 5,
    comment: "Excelente",
    created_at: "2026-06-29T00:00:00.000Z",
  }]);

  const reviews = await vendorDashboardService.getStoreReviews(userId, storeId);
  assert.equal(reviews[0]?.comment, "Excelente");
});
