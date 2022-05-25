import express from "express";
import { RaceStats, TimeframeConversion } from "../constants/stats";
import { verifyIDToken } from "../auth/authenticateToken";
import { getUserRaces } from "../db/stats";
const router = express.Router();

router.get(`/getstats`, verifyIDToken, async (req: any, res, next) => {
  const { uid } = req["current-user"];

  const timeframe = TimeframeConversion[parseInt(req.query.timeframe)];

  const races = await getUserRaces(uid, timeframe);

  const raceStats = getRaceStatsFromRaces(races);
  console.log(raceStats);

  res.status(200).json(raceStats);
});

const getRaceStatsFromRaces = (races: Array<RaceStats>) => {
  const averages: RaceStats = {
    wpm: 0,
    accuracy: 0,
    mostMissedCharacter: "None",
  };

  let best: RaceStats = {
    wpm: 0,
    accuracy: 0,
    mostMissedCharacter: "None",
  };

  const mostMissedCharacterMap = new Map<string, number>();
  let maxMissedCharacterCount = 0;

  for (const race of races) {
    console.log(race);
    if (race.wpm > best.wpm) {
      const { wpm, accuracy, mostMissedCharacter } = race;
      best = { wpm, accuracy, mostMissedCharacter };
    }
    averages.wpm += race.wpm;
    averages.accuracy += race.accuracy;

    const missedCharacter = race.mostMissedCharacter;
    if (missedCharacter !== "None") {
      const newCharacterCount =
        (mostMissedCharacterMap.get(missedCharacter) || 0) + 1;
      mostMissedCharacterMap.set(missedCharacter, newCharacterCount);

      if (newCharacterCount > maxMissedCharacterCount) {
        averages.mostMissedCharacter = missedCharacter;
        maxMissedCharacterCount = newCharacterCount;
      }
    }
  }

  averages.wpm /= races.length || 1;
  averages.accuracy /= races.length | 1;

  return { averages, best };
};

export default router;
