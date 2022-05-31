import express from "express";
import raceRouter from "./routes/race";
import statsRouter from "./routes/stats";
import userRouter from "./routes/users";
import cors from "cors";
import cookieParser from "cookie-parser";
import { verifyIDToken } from "./auth/authenticateToken";
import path from "path";

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
app.use("/stats", statsRouter);
app.use("/user", verifyIDToken, userRouter);
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 500).send(err.text || "Something went wrong");
});

app.use(
  express.static(
    path.join(__dirname.substring(0, __dirname.lastIndexOf("\\")), "/build")
  )
);
