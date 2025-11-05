export interface Node {
    type:"text"|"bold"|"image"|"parent",
    content:string | null,
    children:Node[] | null
}