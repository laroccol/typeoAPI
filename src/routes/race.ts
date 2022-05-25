import express from "express";
import { CharacterData } from "../constants/race";
import { ResultsData } from "../constants/race";
import { Passages, CommonWords } from "../constants/passages";
import { TextTypes, GameTypes } from "../constants/settings";
import { db } from "../config/firestore";
import { doc } from "prettier";
import { saveRaceStats } from "../db/race";
import { verifyIDToken } from "../auth/authenticateToken";
const router = express.Router();

/* GET users listing. */
router.get("/", (req, res) => {
  res.send("respond with a resource");
});

router.get("/passage", (req, res) => {
  const passageType = req.query.type;
  let newPassage = "";

  if (passageType === `${TextTypes.PASSAGE}`) {
    const nextPassageIndex = Math.floor(Math.random() * Passages.length);
    newPassage = Passages[nextPassageIndex];
  } else if (passageType === `${TextTypes.TOP_WORDS}`) {
    const arr = [];
    const availableWords = [...CommonWords];
    let prevWord = "";
    for (let i = 0; i < 70; i++) {
      const randIndex = Math.floor(Math.random() * availableWords.length);
      const word = availableWords[randIndex];
      arr.push(word);
      availableWords.splice(randIndex, 1);
      if (i !== 0) availableWords.push(prevWord);
      prevWord = word;
    }
    newPassage = arr.join(" ");
  } else {
    res.status(400).send({ error: "Invalid passage type" });
    return;
  }

  res.send({ passage: newPassage });
});

router.post("/statreport", verifyIDToken, async (req: any, res, next) => {
  const { uid } = req["current-user"];

  const resultsData: ResultsData = req.body.resultsData;
  const characterData: Array<CharacterData> = req.body.characterData;
  const wpm = resultsData.dataPoints[resultsData.dataPoints.length - 1].wpm;
  const accuracy = resultsData.accuracy;
  const testType = resultsData.testType;

  const passage = resultsData.passage;

  const characterMap = new Map<string, number>();
  let mostMissedCharacter = "None";
  let maxCount = 0;
  let compoundError = false;
  for (const element of characterData) {
    if (!element.isCorrect && !compoundError) {
      const character = passage[element.charIndex - 1];
      const newCharacterCount = (characterMap.get(character) || 0) + 1;
      characterMap.set(character, newCharacterCount);

      if (newCharacterCount > maxCount) {
        mostMissedCharacter = character;
        maxCount = newCharacterCount;
      }
    } else if (element.isCorrect && compoundError) {
      compoundError = false;
    }
  }

  try {
    await saveRaceStats(uid, { wpm, accuracy, mostMissedCharacter, testType });
  } catch (err) {
    const error: R_ERROR = {
      status: 500,
      text: "Database Error",
    };
    next(error);
  }

  res.status(200).send("Stats Successfully Saved");
});

export default router;
