import express from "express";
import { Passages, CommonWords } from "../constants/passages";
import { TextTypes, GameTypes } from "../constants/settings";
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

const queue = [];

export default router;
