export interface Doc {
    type:"text"|"bold"|"image"|"parent",
    content:string | null,
    children:Doc[] | null
}