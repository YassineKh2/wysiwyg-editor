import type {Doc} from "../types/Doc.ts";
import {JSX} from "react";

// Takes a document and returns the HTML Part
export function parseDoc (doc: Doc) {
    switch (doc.type){
        case "text":
            return <p>{doc.content}</p>

        case "bold":
            return <strong>{doc.content}</strong>

        case "image":
            return <img src={doc.content as string} alt={"image"}/>
    }
}

// TODO Fix this it should not be returning nested arrays
export function documentResolver (doc: Doc):JSX.Element[] {
    if(!doc.children)
        return [parseDoc(doc)]

    const result:JSX.Element[] = []
    doc.children.forEach(childDoc => {
        result.push(documentResolver(childDoc) as JSX.Element)
    })

    result.push(parseDoc(doc))

    return result
}

export function findNodeFromText(){

}
