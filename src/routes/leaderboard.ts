import express from "express";
import { Leaderboard } from "../constants/schemas/leaderboard";
import { verifyIDToken } from "../auth/authenticateToken";
import {
  addToLeaderboard,
  getLeaderboards,
  refreshLeaderboard,
  removeFromLeaderboard,
} from "../db/leaderboard";
const router = express.Router();

export let daily_leaderboard: Leaderboard[] = [];
export let all_time_leaderboard: Leaderboard[] = [];

getLeaderboards().then(({ daily, allTime }) => {
  daily_leaderboard = daily.sort((a, b) => b.wpm - a.wpm);
  all_time_leaderboard = allTime.sort((a, b) => b.wpm - a.wpm);
});

let initialCountdown = true;

function timeTolocalMidnight() {
  const date = new Date();
  const easternDate = new Date(
    date.toLocaleString("en-US", {
      timeZone: "America/New_York",
    })
  );
  return (
    new Date(easternDate).setHours(24, 0, 0, 0) -
    new Date(easternDate).getTime()
  );
}

console.log(timeTolocalMidnight() / 1000 / 60 / 60);

setInterval(
  () => {
    daily_leaderboard = [];
    refreshLeaderboard("daily_leaderboard");
    initialCountdown = false;
  },
  initialCountdown ? timeTolocalMidnight() : 86400000
);

export const checkLeaderboard = (
  leaderboard: Leaderboard[],
  leaderboardName: string,
  { id, name, accuracy, wpm }: Leaderboard
) => {
  const existingEntryIndex = leaderboard.findIndex((entry) => entry.id === id);

  if (existingEntryIndex !== -1) {
    if (wpm > leaderboard[existingEntryIndex].wpm) {
      leaderboard[existingEntryIndex] = { id, name, accuracy, wpm };
      leaderboard.sort((a, b) => b.wpm - a.wpm);
      addToLeaderboard(leaderboardName, { id, name, accuracy, wpm });
    }
  } else {
    if (leaderboard.length < 10) {
      leaderboard.push({ id, name, accuracy, wpm });
      leaderboard.sort((a, b) => b.wpm - a.wpm);
      addToLeaderboard(leaderboardName, { id, name, accuracy, wpm });
    } else if (wpm > leaderboard[9].wpm) {
      removeFromLeaderboard(leaderboardName, leaderboard[9].id);
      leaderboard.pop();
      leaderboard.push({ id, name, accuracy, wpm });
      leaderboard.sort((a, b) => b.wpm - a.wpm);
      addToLeaderboard(leaderboardName, { id, name, accuracy, wpm });
    }
  }
};

router.get(`/get-leaderboard`, async (req: any, res, next) => {
  res
    .status(200)
    .json({ daily: daily_leaderboard, allTime: all_time_leaderboard });
});

export default router;
