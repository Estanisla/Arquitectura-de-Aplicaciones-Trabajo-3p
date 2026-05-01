import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/auth.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, message: "API running" });
});

app.use("/api/auth", authRouter);
