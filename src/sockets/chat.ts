import { Server, Socket } from "socket.io";
import { userIDMappings } from "../../src/config/io";

const PREFIX = "chat:";

export const SEND_CHAT_EVENT = `${PREFIX}send-message`;
export const RECEIVED_CHAT_EVENT = `${PREFIX}message`;

export const chatSocketHandler = (io: Server, socket: Socket) => {
  socket.on(SEND_CHAT_EVENT, ({ message, to }) => {
    socket.emit(RECEIVED_CHAT_EVENT, {
      to,
      message,
      from: socket.data.user_id,
    });
    socket.to(userIDMappings.get(to)).emit(RECEIVED_CHAT_EVENT, {
      message,
      to,
      from: socket.data.user_id,
    });
  });
};
