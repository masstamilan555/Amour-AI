// index.js (entry)
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import aiRoutes from "./routes/ai.route.js";
import paymentRoutes from "./routes/payment.route.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { protectRoute } from "./middleware/protectRoutes.js";
import { isAdmin } from "./middleware/isAdmin.js";

const app = express();

const CLIENT_URL = ["http://localhost:8080","https://amour123.netlify.app","https://amour-delta.vercel.app","https://amour-gb3dlao5a-masstamilan555s-projects.vercel.app" ];
 //process.env.CLIENT_URL || "http://localhost:8080";
// const CLIENT_URL =  "https://wondrous-haupia-3142c3.netlify.app";
 const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // <-- allow cookies
  })
);
// app.use(
//   cors({
//     origin: '*',
//   })
// );

app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/ai", protectRoute, aiRoutes);
app.use("/api/payment", protectRoute, paymentRoutes);
app.use("/api/admin", protectRoute, adminRoutes);


app.get("/", (req, res) => {
  res.json({ ok: true, message: "Auth API running" });
});

app.use(errorHandler);

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
