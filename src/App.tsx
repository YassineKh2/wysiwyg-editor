import './App.css'
import type {Editor} from "./types/Editor.ts";
import {addCharToNode, documentResolver, findNodeFromId, findNodeInDomFromId, removeCharFromNode, updateNode} from "./helpers/NodeHelpers.tsx";
import { Fragment, useEffect, useRef, useState} from "react";
import type { JSX } from "react";
import {useHotkeys} from "react-hotkeys-hook";
import {Keys} from "./types/Keys.ts";

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


interface selectionType {
    startNode : EventTarget | null,
    endNode : EventTarget | null,
    visibile:boolean
}


function App() {
    const [editor,setEditor] = useState(editorDefault)
    const [editorView,setEditorView] = useState<null | JSX.Element[] >(null)
    const [caret,setCaret] = useState({x: editor.cursor.x,y:editor.cursor.y})
    const [selection,setSelection] = useState<selectionType>({
        startNode : null,
        endNode : null,
        visibile:false
    })

    const editorRef = useRef(editor);

    useHotkeys('*', (key) => handleKeyPress(key))

    useEffect(() => {
        const result = documentResolver(editor.doc).flat(Infinity)
        setEditorView(result)

         document.addEventListener("mousedown", (e:MouseEvent) => {
            const {clientX, clientY} = e
            handleMouseClick(clientX,clientY)
            handleSelection(e)
        });
        //  document.addEventListener("mousemove", (e:MouseEvent) => {
        //     console.log(e)
        // });
         document.addEventListener("mouseup", (e:MouseEvent) => {
            console.log(e)
        });

        return removeEventListener("click",()=>{
            console.warn("removed event");
        })
    }, []);

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);


    function handleMouseClick(x:number,y:number){
        const caret = document.caretPositionFromPoint(x,y)
        const nodeRect = caret?.getClientRect() || {x:0,y:0}
        setCaret({x:nodeRect.x, y:nodeRect.y})

        const id = caret?.offsetNode.parentElement?.id
        const results = findNodeFromId(editorRef.current.doc,[],id)
        const node = results ? results[0] : null

        setEditor((prev)=>({
            ...prev,
            cursor:{x:caret?.offset || 0,y:0},
            currentNode:node
        }))
    }

    function handleKeyPress(pressedKey:KeyboardEvent){
        const {key} = pressedKey

        switch (key){
            case Keys.ArrowLeft: {
                setEditor((prev)=>({
                    ...prev,
                    cursor:{x:prev.cursor.x - 1,y:prev.cursor.y},
                }))
                break
            }
            case Keys.ArrowRight: {
                setEditor((prev)=>({
                    ...prev,
                    cursor:{x:prev.cursor.x + 1,y:prev.cursor.y},
                }))
                break
            }
            case Keys.ArrowUp:
            case Keys.ArrowDown:
            case Keys.Enter:
            case Keys.Escape:
            case Keys.Backspace:{
                removeCharacter()
                break;
            }
            case Keys.Tab:
            case Keys.Delete:
            case Keys.Shift:
            case Keys.Control:
            case Keys.Alt:
            case Keys.Meta:
            case Keys.CapsLock:
            case Keys.PageUp:
            case Keys.PageDown:
            case Keys.End:
            case Keys.Home:
            case Keys.Insert:
            case Keys.NumLock:
            case Keys.ScrollLock:
            break;



            default:addCharacter(key)

        }


    }


    function addCharacter(char:string){
        const {cursor,doc,currentNode} = editor;

        if(!currentNode) return;

        const docCopy = structuredClone(doc)

        const newId = Math.random().toString(36).substring(2, 15);
        const currentNodeCopy = structuredClone(currentNode);
        currentNodeCopy.id = newId;

        const newNode = addCharToNode(currentNodeCopy, char, cursor.x)
        const newDoc = updateNode(docCopy, currentNode,newNode)

        setEditor((prev)=>({
            ...prev,
            doc:newDoc,
            cursor:{x:cursor.x + 1,y:cursor.y},
            currentNode:newNode
        }))

        const result = documentResolver(newDoc,true).flat(Infinity)
        setEditorView(result)


        const charWidth = getCharWidth(char)
        setCaret((prev)=>({...prev,x:prev.x + charWidth}))

    }

     function removeCharacter(){
        const {cursor,doc,currentNode} = editor;

        if(!currentNode) return;

        const docCopy = structuredClone(doc)

        const newId = Math.random().toString(36).substring(2, 15);
        const currentNodeCopy = structuredClone(currentNode);
        currentNodeCopy.id = newId;

        const newNode = removeCharFromNode(currentNodeCopy, cursor.x)
        const newDoc = updateNode(docCopy, currentNode,newNode)

        setEditor((prev)=>({
            ...prev,
            doc:newDoc,
            cursor:{x:cursor.x - 1,y:cursor.y},
            currentNode:newNode
        }))

        const result = documentResolver(newDoc,true).flat(Infinity)
        setEditorView(result)

        const char = currentNode.content ? currentNode.content[cursor.x - 1] : ''


        const charWidth = getCharWidth(char)
        console.log(char)
        setCaret((prev)=>({...prev,x:prev.x - charWidth}))

    }

    function handleSelection(e:MouseEvent){
        // setSelection((prev)=>({
        //     ...prev,
        //     startNode:e.target,
        //     visibile:true
        // }))
    }


    const getCharWidth = (char:string) => {
        // Replace spaces by their HTML Code

        char = char === Keys.Space ? "&nbsp;" : char

        const span = document.createElement('span');
        span.innerHTML = char;
        document.body.appendChild(span);
        const boundingClientRect = span.getBoundingClientRect();
        document.body.removeChild(span);
        return boundingClientRect.width
    }



    return (
    <div className="no-select cursor-text editor">
        <div id='caret' className='bg-black px-0 py-2.5 w-0.5 h-1 absolute' style={{ left: `${caret.x}px`, top: `${caret.y}px` }} />
        <div id='selection' className="absolute bg-blue-400/50 rounded -z-50" style={{
            visibility: selection.visibile ?'visible' : 'hidden',
            width:300,
            height:300
        }}/>
        {editorView?.map((Element,index) => (
            <Fragment key={index}>
                {Element}
            </Fragment>
        ))}
    </div>
    )
}

export default App
