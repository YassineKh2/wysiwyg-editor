import './App.css'
import type {Editor} from "./types/Editor.ts";
import {documentResolver} from "./Helpers/NodeHelpers.tsx";
import { useEffect, useState} from "react";

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
    }
}

function handleMouseClick(x:number,y:number){
    const caret = document.caretPositionFromPoint(x,y)
    console.log(caret)
}

function App() {
    const editor = editorDefault
    const result = documentResolver(editor.doc)
    const [caret,setCaret] = useState({x: editor.cursor.x,y:editor.cursor.y})

    useEffect(() => {
        document.addEventListener("click", (e:MouseEvent) => {
            const {clientX, clientY} = e
            handleMouseClick(clientX,clientY)
            setCaret({x:clientX, y:clientY})
        });

        return removeEventListener("click",()=>{
            console.log("removed event");
        })
    }, []);

    return (
    <div>
        <div id='caret' className='bg-black px-0 py-2.5 w-0.5 h-1 absolute' style={{ left: `${caret.x}px`, top: `${caret.y}px` }} />
        {result}
    </div>
    )
}

export default App
