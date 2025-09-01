import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import { listingRoutes } from './routes/listing.js';
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => res.send("Server is running..."));
app.use("/api/auth", authRoutes);
app.use('/api/listings', listingRoutes);

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, statusCode: 404, message: "API Route Not Found" });
});

// General 404 handler
app.use((req, res) => res.status(404).json({ success: false, statusCode: 404, message: "Route Not Found" }));

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal Server Error" });
});

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env file");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
  });