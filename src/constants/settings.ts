export const GameTypes = {
  NONE: 0,
  TIMED: 1,
  WORDS: 2,
  ERRORS: 3,
};

export const TextTypes = {
  PASSAGE: 0,
  TOP_WORDS: 1,
};

export const DefaultGameSettings = {
  textType: TextTypes.PASSAGE,
  gameInfo: { type: GameTypes.TIMED, amount: 30 },
};
