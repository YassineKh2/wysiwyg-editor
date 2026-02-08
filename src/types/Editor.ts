import type { Node } from "./Node.ts";

export interface Editor {
  doc: Node;
  cursor: {
    x: number;
    y: number;
    anchorX: number;
  };
  currentNode: Node | null;
  previousNodeId: string | null;
}
