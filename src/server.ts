import express from "express";
import dotenv from "dotenv";
import { modelWrapper } from "./modelWrapper.js";
// @ts-ignore

import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*", // or specify: "http://localhost:5173"
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.post("/api/message", async (req, res) => {
  const { message } = req.body;
  console.log("Received message:", message);
  const response = await modelWrapper(message);
  res.json({ text: response });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
