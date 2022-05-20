import express from "express";
import raceRouter from "../routes/race";
import userRouter from "../routes/users";
import cors from "cors";
import cookieParser from "cookie-parser";
import { verifyIDToken } from "../auth/authenticateToken";

export const app = express();

declare global {
  interface R_ERROR {
    status: number;
    text: string;
  }
}

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());
app.use(express.json());
app.use("/race", raceRouter);
app.use("/user", verifyIDToken, userRouter);
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 500).send(err.text || "Something went wrong");
});

app.get("/", function (req, res) {
  res.json("{}");
});

app.get("/test", verifyIDToken, async (req, res) => {
  res.json({ test: "test" });
});
