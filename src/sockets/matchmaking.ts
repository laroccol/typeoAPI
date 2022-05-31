import { Server, Socket } from "socket.io";
import { io } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { v4 as uuidv4 } from "uuid";
import { Passages } from "../../src/constants/passages";

const PREFIX = "matchmaking:";

export const JOIN_QUEUE_EVENT = `${PREFIX}join-queue`;
export const LEAVE_QUEUE_EVENT = `${PREFIX}leave-queue`;

export const PLAYER_JOINED_EVENT = `${PREFIX}player-joined`;
export const PLAYER_LEFT_EVENT = `${PREFIX}player-left`;

export const MATCH_STARTING_EVENT = `${PREFIX}match-starting`;
export const JOINED_EXISTING_MATCH_EVENT = `${PREFIX}joined-match`;
export const MATCH_STARTED_EVENT = `${PREFIX}match-started`;
export const MATCH_CANCELED_EVENT = `${PREFIX}match-canceled`;

export enum MatchState {
  WAITING,
  STARTING_OPEN,
  STARTING_CLOSED,
  STARTED,
}

export interface Match {
  players: Array<{ uid: string; displayName: string }>;
  matchState: MatchState;
  passage: string;
  timer: NodeJS.Timer;
  createdTime: number;
  startTime: number;
  finishers?: Array<string>;
}

export const MATCH_COUNTDOWN = 12000;
export const MATCH_STARTED_COUNTDOWN = 5000;

//const Queue = new Set<string>();
export const AwaitingMatches = new Map<string, Match>();
export const Matches = new Map<string, Match>();

const matchmakingSocketHandler = (io: Server, socket: Socket) => {
  socket.on(JOIN_QUEUE_EVENT, async () => {
    if (socket.rooms.size > 1) {
      for (const room of socket.rooms) {
        if (room !== socket.id) socket.leave(room);
      }
    }

    // If there is already a match waiting for a player, join it
    if (AwaitingMatches.size > 0) {
      const [matchID, matchData]: [string, Match] =
        AwaitingMatches.entries().next().value;
      matchData.players.push({
        uid: socket.data.user_id,
        displayName: socket.data.displayName,
      });
      await socket.join(matchID);
      io.in(matchID).emit(
        PLAYER_JOINED_EVENT,
        socket.data.user_id,
        matchData.players,
        matchData.passage
      );

      if (matchData.players.length === 2) {
        matchData.matchState = MatchState.STARTING_OPEN;
        matchData.createdTime = Date.now();
        matchData.timer = setTimeout(() => {
          StartMatch(matchID);
        }, MATCH_COUNTDOWN - MATCH_STARTED_COUNTDOWN);
        io.in(matchID).emit(MATCH_STARTING_EVENT);
      } else if (matchData.players.length > 2) {
        socket.emit(
          JOINED_EXISTING_MATCH_EVENT,
          matchData.createdTime &&
            MATCH_COUNTDOWN - (Date.now() - matchData.createdTime)
        );
      }

      if (matchData.players.length === 5) {
        StartMatch(matchID);
      }
    } else {
      const newMatch: Match = {
        players: [
          { uid: socket.data.user_id, displayName: socket.data.displayName },
        ],
        matchState: MatchState.WAITING,
        passage: Passages[Math.floor(Math.random() * Passages.length)],
        timer: null,
        createdTime: 0,
        startTime: 0,
      };
      const newMatchID: string = uuidv4();
      AwaitingMatches.set(newMatchID, newMatch);
      await socket.join(newMatchID);
      io.in(newMatchID).emit(
        PLAYER_JOINED_EVENT,
        socket.data.user_id,
        newMatch.players,
        newMatch.passage
      );
    }
  });

  socket.on(LEAVE_QUEUE_EVENT, () => {
    OnPlayerLeave(io, socket);
  });

  const StartMatch = (matchID: string) => {
    const match = AwaitingMatches.get(matchID);
    if (match) {
      clearTimeout(match.timer);
      match.matchState = MatchState.STARTING_CLOSED;

      match.timer = setTimeout(() => {
        match.matchState = MatchState.STARTED;
        match.startTime = Date.now();
        io.in(matchID).emit(MATCH_STARTED_EVENT);
      }, MATCH_STARTED_COUNTDOWN);

      Matches.set(matchID, match);
      AwaitingMatches.delete(matchID);
    }
  };
};

const OnPlayerLeave = (io: Server, socket: Socket) => {
  if (socket.rooms.size <= 1) return;
  const matchID = Array.from(socket.rooms)[1];
  socket.leave(matchID);

  const match = AwaitingMatches.get(matchID) || Matches.get(matchID);
  if (match) {
    const playerIndex = match.players
      .map((player) => {
        return player.uid;
      })
      .indexOf(socket.data.user_id);
    match.players.splice(playerIndex, 1);

    io.to(matchID).emit(PLAYER_LEFT_EVENT, socket.data.user_id, match.players);

    if (match.players.length < 1) {
      AwaitingMatches.delete(matchID);
      Matches.delete(matchID);
      io.socketsLeave(matchID);
    } else if (match.players.length < 2) {
      if (AwaitingMatches.get(matchID)) {
        match.matchState = MatchState.WAITING;
        io.in(matchID).emit(MATCH_CANCELED_EVENT);
        clearTimeout(match.timer);
        match.timer = null;
        match.createdTime = 0;
      }
    }
  }
  //socket.disconnect();
};

export const matchmakingDisconnectingHandler = (io: Server, socket: Socket) => {
  OnPlayerLeave(io, socket);
};

export default matchmakingSocketHandler;
