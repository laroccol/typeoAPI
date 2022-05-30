import admin, { auth } from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
//import serviceAccount from "./firebaseadminsdk.json";

export const verifyIDToken = async (req: any, res: any, next: any) => {
  const header = req.headers?.authorization;
  try {
    if (
      header !== "Bearer null" &&
      req.headers?.authorization?.startsWith("Bearer ")
    ) {
      const idToken = req.headers.authorization.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req["current-user"] = await admin.auth().getUser(decodedToken.uid);
      next();
    } else {
      throw Error();
    }
  } catch (err) {
    const error: R_ERROR = { status: 401, text: "Invalid Token" };
    return next(error);
  }
};

export const decodeSocketIDToken = async (socket: any, next: any) => {
  const idToken = socket.handshake.auth.token;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    socket.data.user_id = decodedToken.uid;
  } catch (err) {
    socket.data.user_id = idToken;
  }

  next();
};
