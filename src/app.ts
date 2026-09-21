import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { routes } from "./routes.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "100kb" }));

if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
