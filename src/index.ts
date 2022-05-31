if (process.env.NODE_ENV !== "production") {
  import("dotenv").then((dotenv) => {
    dotenv.config();
  });
}

import { app } from "./config/app";
import { createHTTPServer } from "./config/http";
import { createSocketIOServer } from "./config/io";

const server = createHTTPServer(app);

const io = createSocketIOServer(server);

server.listen(process.env.PORT, () => {
  console.log("Listening on port 8080");
});
// const indexRouter = require("./routes/index");
// const usersRouter = require("./routes/users");
// const testAPIRouter = require("./routes/testAPI");

//mongoose.connect("mongodb://mongo:27017/mongo-test", {useNewUrlParser: true, useUnifiedTopology: true});

//const db = mongoose.connection;

//db.on('error', (err) => {
//console.error(err);
//});

// db.on("open", () => {
//   console.log("Connected to Mongoose");
// });

// app.use("/", indexRouter);
// app.use("/users", usersRouter);
// app.use("/testAPI", testAPIRouter);

//app.use(express.static(path.join(__dirname, "build")));
