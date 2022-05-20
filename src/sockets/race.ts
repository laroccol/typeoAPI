import { Matches, Match, MatchState } from "./matchmaking";
import { Server, Socket } from "socket.io";

const PREFIX = "race:";

export const CLIENT_RACE_UPDATE_EVENT = `${PREFIX}race-update`;
export const SERVER_RACE_UPDATE_EVENT = `${PREFIX}server-race-update`;
export const RACER_FINISHED_EVENT = `${PREFIX}racer-finished`;
export const RACE_COMPLETE_EVENT = `${PREFIX}race-complete`;

interface MatchUpdate {
  id: string;
  percentage: number;
  wpm: number;
}

interface RacerFinish {
  id: string;
  place: number;
  wpm: number;
}

export const raceSocketHandler = (io: Server, socket: Socket) => {
  socket.on(CLIENT_RACE_UPDATE_EVENT, (update: string) => {
    if (update && typeof update === "string") {
      if (socket.rooms.size > 1) {
        const socketRoomKeys = socket.rooms.keys();
        socketRoomKeys.next();
        const matchID: string = socketRoomKeys.next().value;

        const match: Match = Matches.get(matchID);
        if (match && match.matchState === MatchState.STARTED) {
          const percentage = update.length / match.passage.length;
          const wpm =
            (update.length / 5 / (Date.now() - match.startTime)) * 60000;
          const matchUpdate: MatchUpdate = {
            id: socket.id,
            percentage: percentage,
            wpm: wpm,
          };

          io.in(matchID).emit(SERVER_RACE_UPDATE_EVENT, matchUpdate);

          if (update === Matches.get(matchID).passage) {
            let place: number;
            if (match.finishers) {
              place = match.finishers.length + 1;
              match.finishers.push(socket.id);
            } else {
              place = 1;
              match.finishers = [socket.id];
            }
            match.players.splice(match.players.indexOf(socket.id), 1);

            const racerFinish: RacerFinish = {
              id: socket.id,
              place: place,
              wpm: wpm,
            };
            io.in(matchID).emit(RACER_FINISHED_EVENT, racerFinish);

            if (match.players.length === 0) {
              io.in(matchID).emit(RACE_COMPLETE_EVENT);
              Matches.delete(matchID);
              io.socketsLeave(matchID);
            }
          }
        }
      }
    }
  });
};
