export interface StatsStructure {
  averages: RaceStats;
  best: RaceStats;
}

export interface RaceStats {
  wpm: number;
  accuracy: number;
  mostMissedCharacter: string;
}

export const TimeframeConversion = [1000, 100, 10];
