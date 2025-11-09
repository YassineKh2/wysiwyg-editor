export interface Node {
    id?:string,
    type:"text"|"bold"|"image"|"parent",
    content:string | null,
    children:Node[] | null
}