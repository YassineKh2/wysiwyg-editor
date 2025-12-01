import type {Node} from "./Node.ts";

export interface Editor {
    doc:Node,
    cursor : {
        x:number,
        y:number,
        anchorX:number
    },
    currentNode:Node|null
}

export enum Direction {
    left=0,
    right=1
}
