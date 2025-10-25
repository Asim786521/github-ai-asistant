import express from "express";
import dotenv from "dotenv";
import { modelWrapper } from "./modelWrapper.js";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/api/message", async (req, res) => {
  const { message } = req.body;
  console.log("Received message:", message);
  const response = await modelWrapper(message);
  res.json({ text: response });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
