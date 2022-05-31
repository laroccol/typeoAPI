import { Server } from "socket.io";
import { decodeSocketIDToken } from "../auth/authenticateToken";
import matchmakingSocketHandler, {
  matchmakingDisconnectingHandler,
} from "../sockets/matchmaking";
import { raceSocketHandler } from "../sockets/race";
import { chatSocketHandler } from "../sockets/chat";

interface ServerToClientEvents {
  noArg: () => void;
}

interface ClientToServerEvents {
  "matchmaking:join-queue": () => void;
  "matchmaking:leave-queue": () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  user_id: string;
  displayName: string;
}

export const userIDMappings = new Map();

export const createSocketIOServer = (server: any): Server => {
  const io = new Server<
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.use(decodeSocketIDToken);

  io.on("connection", (socket) => {
    userIDMappings.set(socket.data.user_id, socket.id);
    matchmakingSocketHandler(io, socket);
    raceSocketHandler(io, socket);
    chatSocketHandler(io, socket);

    socket.on("disconnecting", (reason) => {
      matchmakingDisconnectingHandler(io, socket);
    });

    socket.on("disconnect", (reason) => {
      userIDMappings.delete(socket.data.user_id);
    });
  });

  return io;
};
