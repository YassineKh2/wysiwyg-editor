import './App.css'
import type {Editor} from "./types/Editor.ts";
import {addCharToNode, documentResolver, findNodeFromId, findNodeInDomFromId, updateNode} from "./helpers/NodeHelpers.tsx";
import { useEffect, useState} from "react";
import {useHotkeys} from "react-hotkeys-hook";

const editorDefault : Editor = {
    doc:{
        type:'text',
        content:"Hello this is a text",
        children:[{
            type:'text',
            content:"1st",
            children:[{
                type:'text',
                content:"1st sub text",
                children:[
                    {
                        type:'text',
                        content:"1st sub sub sub text",
                        children:[]
                    }
                ]
            }]
        },
        {
            type:'bold',
            content:"2nd children",
            children:[{
                type:'text',
                content:'2nd sub text',
                children:[]
            }]
        }
        ,{
                type:'text',
                content:"3rd",
                children:[]
            }
            ]
    },
    cursor:{
        x:0,
        y:0
    },
    currentNode:null
}

function App() {
    const [editor,setEditor] = useState(editorDefault)
    const [caret,setCaret] = useState({x: editor.cursor.x,y:editor.cursor.y})
    useHotkeys('*', (key) => handleKeyPress(key))

    useEffect(() => {
        document.addEventListener("click", (e:MouseEvent) => {
            const {clientX, clientY} = e
            handleMouseClick(clientX,clientY)
        });

        return removeEventListener("click",()=>{
            console.log("removed event");
        })
    }, []);

    function handleMouseClick(x:number,y:number){
        const caret = document.caretPositionFromPoint(x,y)
        const nodeRect = caret?.getClientRect() || {x:0,y:0}
        setCaret({x:nodeRect.x, y:nodeRect.y})

        const id = caret?.offsetNode.parentElement?.id
        const results = findNodeFromId(editor.doc,[],id)
        const node = results ? results[0] : null
        setEditor((prev)=>({
            ...prev,
            cursor:{x:caret?.offset || 0,y:0},
            currentNode:node
        }))
    }

    function handleKeyPress(pressedKey:KeyboardEvent){
        const key = pressedKey.key
        const {cursor,doc,currentNode} = editor;

        if (!currentNode) return

        const newNode = addCharToNode(currentNode, key, cursor.x)
        const newDoc = updateNode(doc, newNode, currentNode)

        setEditor((prev)=>({
        ...prev,
        doc:newDoc,
        cursor:{x:cursor.x + 1,y:cursor.y},
        currentNode:newNode
        }))

        const span = document.createElement('span');
        span.innerHTML = key;
        document.body.appendChild(span);
        const width = caret.x + span.offsetWidth;
        document.body.removeChild(span);

        setCaret((prev)=>({...prev,x:width}))
    }

    const result = documentResolver(editor.doc)
    return (
    <div className="no-select cursor-text">
        <div id='caret' className='bg-black px-0 py-2.5 w-0.5 h-1 absolute' style={{ left: `${caret.x}px`, top: `${caret.y}px` }} />
        {result}
    </div>
    )
}

export default App
