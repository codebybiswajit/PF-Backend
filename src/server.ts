import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import authRouter from "./routes/auth";
import usersRouter from "./routes/users";

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body parser ──────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found." });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Unhandled Error]", err);
  res
    .status(500)
    .json({ message: "Internal server error.", error: err.message });
});

// ─── MongoDB connection ───────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "5000", 10);
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGO_USER = process.env.MONGO_USER || "";
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || "";
const MONGO_REST = process.env.MONGO_REST || "";

async function startServer(): Promise<void> {
  if (!MONGODB_URI) {
    console.warn(
      "⚠️  WARNING: MONGODB_URI is not set in .env. " +
        "The server will start, but database operations will fail. " +
        "Set MONGODB_URI to a valid MongoDB connection string.",
    );

    // Start server anyway for development convenience
    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on http://localhost:${PORT} (no DB connection)`,
      );
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
    });
    return;
  }
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(
      `${MONGODB_URI}${MONGO_USER}:${MONGO_PASSWORD}${MONGO_REST}`,
      {
        dbName: "AppDb", // or process.env.DB_NAME
      },
    );
    console.log("✅ MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Accepting requests from: ${frontendUrl}`);
    });
  } catch (err: any) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error(
      "   Check your MONGODB_URI in .env and ensure MongoDB is accessible.",
    );
    process.exit(1);
  }
}

// ─── Handle mongoose connection events ───────────────────────────────────────

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected.");
});

// ─── Handle unhandled rejections & uncaught exceptions ────────────────────────

process.on("unhandledRejection", (reason: unknown) => {
  console.error("⚠️  Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err: Error) => {
  console.error("💥 Uncaught Exception:", err.message);
  process.exit(1);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

process.on("SIGINT", async () => {
  console.log("\n🛑 SIGINT received. Closing MongoDB connection...");
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed. Exiting.");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 SIGTERM received. Closing MongoDB connection...");
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed. Exiting.");
  process.exit(0);
});

startServer();
