import './App.css'
import type {Editor} from "./types/Editor.ts";
import {Direction} from "./types/Editor.ts";
import {
    addCharToNode,
    documentResolver,
    findNodeFromId, findNodeInDomFromId,
    removeCharFromNode,
    updateNode
} from "./helpers/NodeHelpers.tsx";
import type {JSX} from "react";
import {Fragment, useEffect, useRef, useState} from "react";
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
        y:0,
        anchorX:0
    },
    currentNode:null
}


interface selectionType {
    startNode : EventTarget | null,
    endNode : EventTarget | null,
    visible:boolean
}


function App() {
    const [editor,setEditor] = useState(editorDefault)
    const [editorView,setEditorView] = useState<null | JSX.Element[] >(null)
    const [caret,setCaret] = useState({x: editor.cursor.x,y:editor.cursor.y})
    const [selection,setSelection] = useState<selectionType>({
        startNode : null,
        endNode : null,
        visible:false
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

        return document.removeEventListener("click",()=>{
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
            cursor:{...prev.cursor,x:caret?.offset || 0},
            currentNode:node
        }))
    }

    function handleKeyPress(pressedKey:KeyboardEvent){
        const {key} = pressedKey

        switch (key){
            case Keys.ArrowLeft: {
                moveWithArrowCursor(Direction.left)
                break
            }
            case Keys.ArrowRight: {
                moveWithArrowCursor(Direction.right)
                break
            }
            case Keys.Backspace:{
                removeCharacter()
                break;
            }
            case Keys.ArrowUp:
                moveUpCursor()
                break
            case Keys.ArrowDown:
            case Keys.Enter:
            case Keys.Escape:
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
            cursor:{...prev.cursor,x:cursor.x + 1,anchorX:cursor.x + 1},
            currentNode:newNode
        }))

        const result = documentResolver(newDoc,true).flat(Infinity)
        setEditorView(result)


        moveCaret(char,Direction.right)
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
            cursor:{...prev.cursor,x:cursor.x - 1,anchorX:cursor.x - 1},
            currentNode:newNode
        }))

        const result = documentResolver(newDoc,true).flat(Infinity)
        setEditorView(result)

        const char = currentNode.content ? currentNode.content[cursor.x - 1] : ''

        moveCaret(char,Direction.left)

    }

    function handleSelection(e:MouseEvent){
        // setSelection((prev)=>({
        //     ...prev,
        //     startNode:e.target,
        //     visible:true
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

    function moveCaret(char:string,dir:Direction){
        const charWidth = getCharWidth(char)
        const newPosition = dir === Direction.right ? caret.x + charWidth : caret.x - charWidth

        setCaret((prev)=>({...prev,x:newPosition}))
    }

    function moveWithArrowCursor(dir: Direction){
        const content = editor.currentNode?.content
        if (!content) return;

        const x = editor.cursor.x
        if (dir === Direction.left && x <= 0) return
        if (dir === Direction.right && x >= content.length) return;

        const newPosition = dir === Direction.right ? x + 1 : x - 1
        const pos = dir === Direction.right ? x : x - 1
        const char = content[pos]

        setEditor((prev)=>({
            ...prev,
            cursor:{...prev.cursor,x:newPosition,anchorX:newPosition}
        }))

        moveCaret(char,dir)
    }

    function moveUpCursor(){
        const { currentNode,doc} = editor

        const previousElement = findNodeInDomFromId(currentNode?.id)?.previousElementSibling
        if (!previousElement) return

        const boundingClientRect = previousElement?.getBoundingClientRect()
        const newNode = findNodeFromId(doc,[],previousElement?.id)

        if (!newNode) return

        setEditor((prev)=>({
            ...prev,
            currentNode: newNode[0]
        }))

        setCaret({x:boundingClientRect.x,y:boundingClientRect.y})

    }

    return (
    <div className="no-select cursor-text editor">
        <div id='caret' className='bg-black px-0 py-2.5 w-0.5 h-1 absolute' style={{ left: `${caret.x}px`, top: `${caret.y}px` }} />
        <div id='selection' className="absolute bg-blue-400/50 rounded -z-50" style={{
            visibility: selection.visible ? 'visible' : 'hidden',
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
