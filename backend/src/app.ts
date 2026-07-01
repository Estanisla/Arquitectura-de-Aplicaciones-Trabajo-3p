import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { vendorRouter } from "./modules/vendors/vendor.routes.js";
import { adminPanelRouter } from "./modules/admin-panel/admin-panel.routes.js";
import { vendorDashboardRouter } from "./modules/vendor-dashboard/vendor-dashboard.routes.js";
import { storeManagementRouter } from "./modules/store-management/store-management.routes.js";
import {
  adminReviewsRouter,
  reviewsRouter,
} from "./modules/reviews/reviews.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendOrigins = env.NODE_ENV === "production"
  ? env.FRONTEND_ORIGIN
  : Array.from(new Set([
      env.FRONTEND_ORIGIN,
      "http://127.0.0.1:5173",
      "http://localhost:5173",
    ]));

export const app = express();
app.use(
  cors({
    origin: frontendOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, message: "API running" });
});
app.use("/api/auth", authRouter);
app.use("/api/vendors", vendorRouter);
app.use("/api/admin/reviews", adminReviewsRouter);
app.use("/api/admin/stores", storeManagementRouter);
app.use("/api/admin", adminPanelRouter);
app.use("/api/vendor", vendorDashboardRouter);
app.use("/api/products", reviewsRouter);

// Serve frontend static files
const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
// SPA fallback - serve index.html for non-API routes
app.use((_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});
