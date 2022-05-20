import { Client } from "pg";

export const dbClient = new Client({
  host: "localhost",
  user: "postgres",
  port: 5433,
  password: "sew?Wiz3cut",
  database: "test",
});

dbClient
  .connect()
  .then(() => {
    console.log("DB CONNECTED");
  })
  .catch((err) => {
    console.error(err);
  });
