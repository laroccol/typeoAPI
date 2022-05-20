export const SettingTypes = {
  TEXT_TYPE: 0,
  GAME_INFO: 1,
};

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
  gameInfo: { type: GameTypes.NONE },
};
