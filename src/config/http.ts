import { createServer } from "http";
import { app } from "../app";
import { Express } from "express";

export const createHTTPServer = (app: Express) => createServer(app);
