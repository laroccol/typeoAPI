import { RaceStats } from "../constants/stats";
import { db } from "../config/firestore";
import {
  LeaderboardSchema,
  Leaderboard,
} from "../constants/schemas/leaderboard";

export const getLeaderboards = async (): Promise<{
  daily: Leaderboard[];
  allTime: Leaderboard[];
}> => {
  const dailyCollection = db.collection("/daily_leaderboard");
  const allTimeCollection = db.collection("/all_time_leaderboard");
  const dailySnapshot = await dailyCollection
    .orderBy("wpm", "desc")
    .limit(10)
    .get();

  const allTimeSnapshot = await allTimeCollection
    .orderBy("wpm", "desc")
    .limit(10)
    .get();

  const daily = dailySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as LeaderboardSchema),
  }));
  const allTime = allTimeSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as LeaderboardSchema),
  }));

  return { daily, allTime };
};

export const addToLeaderboard = (
  leaderboard: string,
  { id, name, accuracy, wpm }: Leaderboard
) => {
  db.collection(leaderboard).doc(id).set({ name, accuracy, wpm });
};

export const removeFromLeaderboard = (leaderboard: string, id: string) => {
  db.collection(leaderboard).doc(id).delete();
};

export const refreshLeaderboard = (leaderboard: string) => {
  db.collection(leaderboard)
    .listDocuments()
    .then((val) => {
      val.map((val) => {
        val.delete();
      });
    });
};

export const submitRace = async (entry: LeaderboardSchema) => {};
