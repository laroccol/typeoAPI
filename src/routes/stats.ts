import express from "express";
import { RaceStats, Timeframes } from "../constants/stats";
import { verifyIDToken } from "../auth/authenticateToken";
import { getUserRaces } from "../db/stats";
const router = express.Router();

router.get(`/getstats`, verifyIDToken, async (req: any, res, next) => {
  const { uid } = req["current-user"];

  const timeframe = parseInt(req.query.timeframe);

  const races = await getUserRaces(uid, timeframe);

  const racesData = races.map((race) => ({
    ...race,
    timestamp: race.timestamp.toDate(),
  }));

  res.status(200).json({ races: racesData });
});

export default router;
