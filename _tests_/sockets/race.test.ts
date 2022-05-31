import { Server, Socket as ServerSocket } from "socket.io";
import { app } from "../../src/config/app";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { createSocketIOServer } from "../../src/config/io";
import { createHTTPServer } from "../../src/config/http";
import {
  CLIENT_RACE_UPDATE_EVENT,
  SERVER_RACE_UPDATE_EVENT,
  RACER_FINISHED_EVENT,
  RACE_COMPLETE_EVENT,
} from "../../src/sockets/race";
import {
  Matches,
  Match,
  MatchState,
  PLAYER_JOINED_EVENT,
  PLAYER_LEFT_EVENT,
} from "../../src/sockets/matchmaking";

const TEST_PASSAGE = "This is a test passage.";

describe("Race Sockets", () => {
  let io: Server, serverSocket: ServerSocket;
  let clients: Array<ClientSocket>;

  beforeAll((done) => {
    const server = createHTTPServer(app);
    io = createSocketIOServer(server);

    server.listen(() => {
      const address = server.address();
      const port = typeof address !== "string" ? address.port : address;
      clients = Array.from({ length: 3 }, () =>
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

  beforeEach(() => {
    const match: Match = {
      players: [clients[0].id, clients[1].id, clients[2].id],
      passage: TEST_PASSAGE,
      matchState: MatchState.STARTED,
      timer: null,
      createdTime: 0,
      startTime: 0,
    };

    Matches.set("match_1", match);

    io.socketsJoin("match_1");
  });

  afterEach(() => {
    io.socketsLeave(Array.from(Matches.keys()));

    Matches.clear();
  });

  test("clients receive server update following client update", (done) => {
    clients[0].emit(CLIENT_RACE_UPDATE_EVENT, "This");
    clients[1].once(SERVER_RACE_UPDATE_EVENT, (serverUpdate) => {
      try {
        expect(serverUpdate).toBeTruthy();
        expect(serverUpdate.id).toBe(clients[0].id);
        expect(serverUpdate.percentage).toBe(5.75);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  test("no server update when missing client data", (done) => {
    const timeout = setTimeout(() => {
      clients[1].removeListener(SERVER_RACE_UPDATE_EVENT);
      done();
    }, 2000);

    clients[0].emit(CLIENT_RACE_UPDATE_EVENT, () => {
      clients[1].once(SERVER_RACE_UPDATE_EVENT, () => {
        try {
          throw new Error("Should not have received Server Event");
        } catch (err) {
          clearTimeout(timeout);
          done(err);
        }
      });
    });
  });

  test("client placings and finish", (done) => {
    clients[0].emit(CLIENT_RACE_UPDATE_EVENT, TEST_PASSAGE, () => {
      clients[1].once(RACER_FINISHED_EVENT, (finished) => {
        try {
          expect(finished).toBeTruthy();
          expect(finished).toEqual({ id: clients[0].id, place: 1 });

          clients[1].emit(CLIENT_RACE_UPDATE_EVENT, TEST_PASSAGE, () => {
            clients[1].once(RACER_FINISHED_EVENT, (finished) => {
              try {
                expect(finished).toBeTruthy();
                expect(finished).toEqual({ id: clients[1].id, place: 2 });

                clients[2].emit(CLIENT_RACE_UPDATE_EVENT, TEST_PASSAGE, () => {
                  clients[1].once(RACER_FINISHED_EVENT, (finished) => {
                    try {
                      expect(finished).toBeTruthy();
                      expect(finished).toEqual({ id: clients[2].id, place: 3 });
                      expect(Matches.size).toBe(0);
                      expect(
                        io.sockets.adapter.rooms.get("match_1")
                      ).toBeFalsy();
                      done();
                    } catch (err) {
                      done(err);
                    }
                  });
                });
              } catch (err) {
                done(err);
              }
            });
          });
        } catch (err) {
          done(err);
        }
      });
    });
  });

  test("client race disconnect", (done) => {
    const client0ID = clients[0].id;
    clients[0].disconnect();
    clients[1].once(PLAYER_LEFT_EVENT, (player: string) => {
      try {
        expect(player).toBeTruthy();
        expect(player).toBe(client0ID);
        expect(io.sockets.adapter.rooms.get("match_1")).toEqual(
          new Set([clients[1].id, clients[2].id])
        );
        clients[0].connect();
        clients[0].once("connect", done);
      } catch (err) {
        done(err);
      }
    });
  });

  test("race ends if last players typing leave the race", (done) => {
    clients[0].emit(CLIENT_RACE_UPDATE_EVENT, TEST_PASSAGE, () => {
      clients[1].disconnect();
      clients[2].disconnect();

      setTimeout(() => {
        clients[1].connect();
        clients[2].connect();
        clients[2].once("connect", () => {
          try {
            expect(Matches.size).toBe(0);
            expect(io.sockets.adapter.rooms.get("match_1")).toBeFalsy();
            done();
          } catch (err) {
            done(err);
          }
        });
      }, 2000);
    });
  });

  test("all clients disconnect", (done) => {
    clients[0].disconnect();
    clients[1].disconnect();
    clients[2].disconnect();

    setTimeout(() => {
      try {
        expect(Matches.size).toBe(0);
        expect(io.sockets.adapter.rooms.get("match_1")).toBeFalsy();
        done();
      } catch (err) {
        done(err);
      }
    }, 2000);
  });
});
