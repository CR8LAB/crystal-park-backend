require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const unitsRouter = require("./routes/units");
const enquiriesRouter = require("./routes/enquiries");
const adminRouter = require("./routes/admin");
const scansRouter = require("./routes/scans");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured.");
}

const app = express();
const PORT = process.env.PORT || 3000;

// Render reverse proxy
app.set("trust proxy", 1);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS."));
    },
  }),
);

app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "Crystal Park API",
    status: "online",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiting to API endpoints
app.use("/api", apiLimiter);

app.use("/api/units", unitsRouter);
app.use("/api/enquiries", enquiriesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/scans", scansRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found.",
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);

  if (err.message === "Origin not allowed by CORS.") {
    return res.status(403).json({
      error: err.message,
    });
  }

  res.status(500).json({
    error: "Internal server error.",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Crystal Park API listening on port ${PORT}`);
});
