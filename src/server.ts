import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { modelWrapper } from "./modelWrapper";

const app = express();
app.use(bodyParser.json());

app.post("/api/message", async (req: Request, res: Response) => {
  const { message } = req.body;
  const response = await modelWrapper(message);
  res.json({ text: response });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
