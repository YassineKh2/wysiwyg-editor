import type {Node} from "../types/Node.ts";
import {JSX} from "react";

// Takes a document and returns the HTML Part
export function parseDoc (doc: Node) {
    switch (doc.type){
        case "text":
            return <p id={doc.id}>{doc.content}</p>

        case "bold":
            return <strong id={doc.id}>{doc.content}</strong>

        case "image":
            return <img src={doc.content as string} alt={"image"}/>
    }
}

// TODO Fix this it should not be returning nested arrays
export function documentResolver (doc: Node):JSX.Element[] {
    doc.id = Math.random().toString(36).substring(2, 15);

    if(!doc.children)
        return [parseDoc(doc)]

    const result:JSX.Element[] = []
    doc.children.forEach(childDoc => {
        result.push(documentResolver(childDoc) as JSX.Element)
    })

    result.push(parseDoc(doc))

    return result
}

export function findNodeFromText(doc:Node ,id: string, offset: number,res:Node[]){
    if (!id) return;
    if (doc.id === id) res.push(doc)


    doc.children?.forEach(childDoc => {
        findNodeFromText(childDoc,id,offset,res)
    })

    return res

}
