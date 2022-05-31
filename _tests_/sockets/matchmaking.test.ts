import { Server, Socket as ServerSocket } from "socket.io";
import { app } from "../../src/config/app";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { createSocketIOServer } from "../../src/config/io";
import { createHTTPServer } from "../../src/config/http";
import {
  AwaitingMatches,
  Matches,
  Match,
  MatchState,
  MATCH_COUNTDOWN,
} from "../../src/sockets/matchmaking";

import {
  JOIN_QUEUE_EVENT,
  LEAVE_QUEUE_EVENT,
  PLAYER_JOINED_EVENT,
  PLAYER_LEFT_EVENT,
  MATCH_STARTING_EVENT,
  JOINED_MATCH_EVENT,
  MATCH_STARTED_EVENT,
} from "../../src/sockets/matchmaking";

interface ExpectedMatchState {
  players: Array<string>;
  matchState: MatchState;
  timer: boolean;
  startTime: boolean;
}

describe("Matchmaking sockets", () => {
  let io: Server, serverSocket: ServerSocket;
  let clients: Array<ClientSocket>;

  const CheckMatchState = (
    actualMatch: Match,
    matchID: string,
    expectedMatch: ExpectedMatchState
  ) => {
    if (!expectedMatch) {
      expect(actualMatch).toBeUndefined();
    } else {
      expect(actualMatch).not.toBeUndefined();
      expect(actualMatch.players).toHaveLength(expectedMatch.players.length);
      expect(actualMatch.players).toEqual(
        expect.arrayContaining(expectedMatch.players)
      );
      expect(actualMatch.matchState).toBe(expectedMatch.matchState);
      expect(actualMatch.passage).not.toBe("");

      if (expectedMatch.timer) {
        expect(actualMatch.timer).not.toBeNull();
      } else {
        expect(actualMatch.timer).toBeNull();
      }

      if (expectedMatch.startTime) {
        expect(actualMatch.startTime).not.toBe(0);
      } else {
        expect(actualMatch.startTime).toBe(0);
      }
    }

    expect(io.sockets.adapter.rooms.get(matchID)).toEqual(
      new Set(actualMatch.players)
    );
  };

  beforeAll((done) => {
    const server = createHTTPServer(app);
    io = createSocketIOServer(server);

    server.listen(() => {
      const address = server.address();
      const port = typeof address !== "string" ? address.port : address;
      clients = Array.from({ length: 5 }, () =>
        Client(`http://localhost:${port}`)
      );
      io.on("connection", (socket) => {
        serverSocket = socket;
        serverSocket.onAny((eventName, ...args) => {
          if (typeof args[args.length - 1] === "function")
            args[args.length - 1]();
        });
      });

      clients[clients.length - 1].on("connect", done);
    });
  });

  afterAll((done) => {
    io.close((err) => {
      clients.map((client) => {
        client.close();
      });
      done();
    });
  });

  afterEach(() => {
    io.socketsLeave(Array.from(AwaitingMatches.keys()));
    io.socketsLeave(Array.from(Matches.keys()));

    AwaitingMatches.clear();
    Matches.clear();
  });

  test("client join empty queue", (done) => {
    clients[0].emit(JOIN_QUEUE_EVENT, () => {
      try {
        const [matchID, match]: [string, Match] =
          AwaitingMatches.entries().next().value;

        const expectedMatchState: ExpectedMatchState = {
          players: [clients[0].id],
          matchState: MatchState.WAITING,
          timer: false,
          startTime: false,
        };
        CheckMatchState(match, matchID, expectedMatchState);
      } catch (err) {
        done(err);
      }
    });
    clients[0].once(
      PLAYER_JOINED_EVENT,
      (player: string, players: Array<string>) => {
        try {
          expect(player).toEqual(clients[0].id);
          expect(players).toEqual([clients[0].id]);
          done();
        } catch (err) {
          done(err);
        }
      }
    );
  });

  test("match timer starts after 2 clients join", (done) => {
    clients[0].emit(JOIN_QUEUE_EVENT);
    clients[1].emit(JOIN_QUEUE_EVENT, () => {
      try {
        const [matchID, match]: [string, Match] =
          AwaitingMatches.entries().next().value;

        const expectedMatchState: ExpectedMatchState = {
          players: [clients[0].id, clients[1].id],
          matchState: MatchState.STARTING_OPEN,
          timer: true,
          startTime: true,
        };
        CheckMatchState(match, matchID, expectedMatchState);
        clearTimeout(match.timer);
      } catch (err) {
        done(err);
      }
    });
    clients[1].once(
      PLAYER_JOINED_EVENT,
      (player: string, players: Array<string>) => {
        try {
          expect(player).toBe(clients[1].id);
          const expectedPlayers = [clients[0].id, clients[1].id];
          expect(players).toHaveLength(expectedPlayers.length);
          expect(players).toEqual(expect.arrayContaining(expectedPlayers));
        } catch (err) {
          done(err);
        }
      }
    );
    clients[1].once(MATCH_STARTING_EVENT, () => {
      done();
    });
  });

  test("match doesn't start when 3 and 4 players join", (done) => {
    clients[0].emit(JOIN_QUEUE_EVENT);
    clients[1].emit(JOIN_QUEUE_EVENT);
    clients[2].emit(JOIN_QUEUE_EVENT);
    clients[2].once(JOINED_MATCH_EVENT, (timeRemaining: number) => {
      try {
        const [matchID, match]: [string, Match] =
          AwaitingMatches.entries().next().value;
        expect(timeRemaining).toBeGreaterThanOrEqual(
          MATCH_COUNTDOWN - (Date.now() - match.startTime)
        );
      } catch (err) {
        done(err);
      }
    });
    clients[3].emit(JOIN_QUEUE_EVENT, () => {
      try {
        const [matchID, match]: [string, Match] =
          AwaitingMatches.entries().next().value;

        const expectedMatchState: ExpectedMatchState = {
          players: [clients[0].id, clients[1].id, clients[2].id, clients[3].id],
          matchState: MatchState.STARTING_OPEN,
          timer: true,
          startTime: true,
        };
        CheckMatchState(match, matchID, expectedMatchState);
        clearTimeout(match.timer);
      } catch (err) {
        done(err);
      }
    });

    clients[3].once(JOINED_MATCH_EVENT, (timeRemaining: number) => {
      try {
        const [matchID, match]: [string, Match] =
          AwaitingMatches.entries().next().value;
        expect(timeRemaining).toBeGreaterThanOrEqual(
          MATCH_COUNTDOWN - (Date.now() - match.startTime)
        );
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  test("match started when 5 players join", (done) => {
    clients[0].emit(JOIN_QUEUE_EVENT);
    clients[1].emit(JOIN_QUEUE_EVENT);
    clients[2].emit(JOIN_QUEUE_EVENT);
    clients[3].emit(JOIN_QUEUE_EVENT);
    clients[4].emit(JOIN_QUEUE_EVENT, () => {
      try {
        const [matchID, match]: [string, Match] =
          Matches.entries().next().value;

        const expectedMatchState: ExpectedMatchState = {
          players: [
            clients[0].id,
            clients[1].id,
            clients[2].id,
            clients[3].id,
            clients[4].id,
          ],
          matchState: MatchState.STARTING_CLOSED,
          timer: true,
          startTime: true,
        };
        clearTimeout(match.timer);
        CheckMatchState(match, matchID, expectedMatchState);
        done();
      } catch (err) {
        done(err);
      }
    });

    clients[4].once(
      PLAYER_JOINED_EVENT,
      (player: string, players: Array<string>) => {
        try {
          expect(player).toBe(clients[4].id);
          const expectedPlayers = clients.map((client) => client.id);
          expect(players).toHaveLength(expectedPlayers.length);
          expect(players).toEqual(expect.arrayContaining(expectedPlayers));
        } catch (err) {
          done(err);
        }
      }
    );
  });

  test("match timer reset when player count goes below 2", (done) => {
    clients[0].emit(JOIN_QUEUE_EVENT);
    clients[1].emit(JOIN_QUEUE_EVENT);
    clients[1].emit(LEAVE_QUEUE_EVENT, () => {
      try {
        const [matchID, match]: [string, Match] =
          AwaitingMatches.entries().next().value;

        const expectedMatchState: ExpectedMatchState = {
          players: [clients[0].id],
          matchState: MatchState.WAITING,
          timer: false,
          startTime: false,
        };
        CheckMatchState(match, matchID, expectedMatchState);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  test("match deleted when all players leave", (done) => {
    clients[0].emit(JOIN_QUEUE_EVENT);
    clients[0].emit(LEAVE_QUEUE_EVENT, () => {
      try {
        expect(AwaitingMatches.size).toBe(0);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  test("match countdowns finished", (done) => {
    clients[0].emit(JOIN_QUEUE_EVENT);
    clients[1].emit(JOIN_QUEUE_EVENT);
    clients[1].once(MATCH_STARTING_EVENT, () => {
      try {
        const [matchID, match]: [string, Match] =
          AwaitingMatches.entries().next().value;

        const expectedMatchState: ExpectedMatchState = {
          players: [clients[0].id, clients[1].id],
          matchState: MatchState.STARTING_OPEN,
          timer: true,
          startTime: true,
        };
        CheckMatchState(match, matchID, expectedMatchState);
      } catch (err) {
        done(err);
      }
    });
    clients[1].once(MATCH_STARTED_EVENT, () => {
      try {
        const [matchID, match]: [string, Match] =
          Matches.entries().next().value;

        const expectedMatchState: ExpectedMatchState = {
          players: [clients[0].id, clients[1].id],
          matchState: MatchState.STARTED,
          timer: true,
          startTime: true,
        };
        CheckMatchState(match, matchID, expectedMatchState);
        done();
      } catch (err) {
        done(err);
      }
    });
  }, 20000);

  test("players can't join match below 5 seconds", (done) => {
    clients[0].emit(JOIN_QUEUE_EVENT);
    clients[1].emit(JOIN_QUEUE_EVENT);

    setTimeout(() => {
      clients[2].emit(JOIN_QUEUE_EVENT, () => {
        try {
          console.log(AwaitingMatches);
          console.log(Matches);
          expect(AwaitingMatches.size).toBe(1);
          expect(Matches.size).toBe(1);

          const [awaitingMatchID, awaitingMatch]: [string, Match] =
            AwaitingMatches.entries().next().value;

          const [matchID, match]: [string, Match] =
            Matches.entries().next().value;

          clearTimeout(match.timer);

          expect(awaitingMatch.players).toEqual(
            expect.arrayContaining([clients[2].id])
          );
          expect(match.players).toEqual(
            expect.arrayContaining([clients[0].id, clients[1].id])
          );

          done();
        } catch (err) {
          done(err);
        }
      });
    }, MATCH_COUNTDOWN - 4000);
  }, 20000);

  test("can't join queue if already in a match", (done) => {
    clients[0].emit(JOIN_QUEUE_EVENT, () => {
      clients[0].emit(JOIN_QUEUE_EVENT, () => {
        try {
          const [matchID, match]: [string, Match] =
            AwaitingMatches.entries().next().value;

          const expectedMatchState: ExpectedMatchState = {
            players: [clients[0].id],
            matchState: MatchState.WAITING,
            timer: false,
            startTime: false,
          };
          CheckMatchState(match, matchID, expectedMatchState);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});
