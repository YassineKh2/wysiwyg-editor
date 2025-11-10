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

export function findNodeFromId(doc:Node ,id: string,res:Node[]){
    if (!id) return;
    if (doc.id === id) res.push(doc)

    doc.children?.forEach(childDoc => {
        findNodeFromId(childDoc,id,res)
    })

    return res
}
export function addCharToNode(node:Node , char:string , pos: number){
    const newNode = {...node}
    const content = newNode.content;
    const s1 = content?.slice(0,pos);
    const s2 = content?.slice(pos,content?.length)
    newNode.content = s1 + char + s2;
    return newNode;
}

export function updateNode(doc:Node, oldNode:Node, newNode: Node){
    if (doc.id === oldNode.id) {
        doc = newNode
        return
    }

    doc.children?.forEach(childDoc => {
        updateNode(childDoc,oldNode,newNode)
    })

    return
}
