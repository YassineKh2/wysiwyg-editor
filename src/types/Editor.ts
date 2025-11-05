import type {Doc} from "./Doc.ts";

export interface Editor {
    doc:Doc,
    cursor : {
        x:number,
        y:number
    }
}
