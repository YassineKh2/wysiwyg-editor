import type { Keys } from "./Keys";

type CaretType = {
  x: number;
  y: number;
};

type CaretMovementType = {
  char: string;
  direction: Keys;
  styling?: string[];
} | null;

export type { CaretType, CaretMovementType };
