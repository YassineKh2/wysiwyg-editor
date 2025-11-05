import './App.css'
import type {Editor} from "./types/Editor.ts";
import {documentResolver} from "./Helpers/NodeHelpers.tsx";
import {use, useEffect, useState} from "react";
import type {JSX} from "react";

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



function handleMouseClick(x,y){
    const caret = document.caretPositionFromPoint(x,y)
    console.log(caret)
}


function App() {
    const editor = editorDefault
    const result = documentResolver(editor.doc)
    const [caret,setCaret] = useState({x: 0,y:0})


    useEffect(() => {
        document.addEventListener("click", (e:JSX) => {
            const {clientX, clientY} = e
            handleMouseClick(clientX,clientY)
            setCaret({x:clientX, y:clientY})
        });

        return removeEventListener("click",()=>{
            console.log("removed event");
        })
    }, []);


    return (
    <>
        {result}
    </>
    )
}

export default App
