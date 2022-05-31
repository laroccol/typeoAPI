if (process.env.NODE_ENV !== "production") {
  import("dotenv").then((dotenv) => {
    dotenv.config();
  });
}

import { app } from "./app";
import { createHTTPServer } from "./config/http";
import { createSocketIOServer } from "./config/io";

const server = createHTTPServer(app);

const io = createSocketIOServer(server);

server.listen(process.env.PORT || 8080, () => {
  console.log(`Listening on port ${process.env.PORT || 8080}`);
});
