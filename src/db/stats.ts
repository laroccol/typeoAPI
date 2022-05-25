import { RaceStats } from "../constants/stats";
import { db } from "../config/firestore";
import { RaceSchema } from "../constants/schemas/race";

export const getUserRaces = async (
  uid: string,
  amount: number
): Promise<Array<RaceStats>> => {
  const userRacesCollection = db.collection(`/users/${uid}/races`);
  const racesSnapshot = await userRacesCollection
    .orderBy("timestamp", "desc")
    .limit(amount)
    .get();

  return racesSnapshot.docs.map((doc) => {
    return doc.data() as RaceSchema;
  });
};
