import "./App.css";
import type { Editor } from "./types/Editor.ts";
import {
  addCharToNode,
  documentResolver,
  findNextNode,
  findNodeFromId,
  findPreviousNode,
  removeCharFromNode,
  updateNode,
} from "./helpers/NodeHelpers.tsx";
import type { JSX } from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Keys } from "./types/Keys.ts";
import { NodeTypes } from "./types/Node.ts";

const editorDefault: Editor = {
  doc: {
    type: NodeTypes.parapagh,
    content: "Hello this a text",
    children: [
      {
        type: NodeTypes.parapagh,
        content: "1st",
        children: [
          {
            type: NodeTypes.parapagh,
            content: "1st sub node text",
            children: [
              {
                type: NodeTypes.parapagh,
                content: "1st sub sub sub text",
                children: [],
              },
            ],
          },
        ],
      },
      {
        type: NodeTypes.bold,
        content: "2nd children",
        children: [
          {
            type: NodeTypes.parapagh,
            content: "2nd sub node text",
            children: [],
          },
        ],
      },
      {
        type: NodeTypes.parapagh,
        content: "3rd",
        children: [],
      },
      {
        type: NodeTypes.listParent,
        content: "",
        children: [
          {
            type: NodeTypes.listChild,
            content: "hi i am child number 1",
            children: [],
          },
          {
            type: NodeTypes.listChild,
            content: "hi i am child number 2",
            children: [],
          },
          {
            type: NodeTypes.listChild,
            content: "hi i am child number 3",
            children: [],
          },
        ],
      },
    ],
  },
  cursor: {
    x: 0,
    y: 0,
    anchorX: 0,
  },
  currentNode: null,
};

interface selectionType {
  startNode: EventTarget | null;
  endNode: EventTarget | null;
  startPos: number | null;
  endPos: number | null;
  visible: boolean;
}

function App() {
  const [editor, setEditor] = useState(editorDefault);
  const [editorView, setEditorView] = useState<null | JSX.Element[]>(null);
  const [caret, setCaret] = useState({
    x: editor.cursor.x,
    y: editor.cursor.y,
  });
  const [selection, setSelection] = useState<selectionType>({
    startNode: null,
    endNode: null,
    startPos: null,
    endPos: null,
    visible: false,
  });

  const editorRef = useRef(editor);

  useHotkeys("*", (key) => handleKeyPress(key));

  useEffect(() => {
    const result = documentResolver(editor.doc).flat(Infinity);
    setEditorView(result);

    document.addEventListener("mousedown", (e: MouseEvent) => {
      const { clientX, clientY } = e;
      handleMouseClick(clientX, clientY);
      handleSelection(e);
    });
    //  document.addEventListener("mousemove", (e:MouseEvent) => {
    //     console.log(e)
    // });
    document.addEventListener("mouseup", (e: MouseEvent) => {
      handleSelection(e);
    });

    return document.removeEventListener("click", () => {
      console.warn("removed event");
    });
  }, []);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    console.log(selection);
  }, [selection]);

  function handleMouseClick(x: number, y: number) {
    const caret = document.caretPositionFromPoint(x, y);
    const nodeRect = caret?.getClientRect() || { x: 0, y: 0 };

    console.log(x, nodeRect.x);
    setCaret({ x: nodeRect.x, y: nodeRect.y });

    const id = caret?.offsetNode.parentElement?.id;
    const results = findNodeFromId(editorRef.current.doc, [], id);
    const node = results ? results[0] : null;
    const offset = caret?.offset || 0;

    setEditor((prev) => ({
      ...prev,
      cursor: { ...prev.cursor, x: offset, anchorX: offset },
      currentNode: node,
    }));
  }

  function handleKeyPress(pressedKey: KeyboardEvent) {
    const { key } = pressedKey;

    switch (key) {
      case Keys.ArrowLeft: {
        moveWithArrowCursor(Keys.ArrowLeft);
        break;
      }
      case Keys.ArrowRight: {
        moveWithArrowCursor(Keys.ArrowRight);
        break;
      }
      case Keys.Backspace: {
        removeCharacter();
        break;
      }
      case Keys.ArrowUp:
        moveCursorHorizontal(Keys.ArrowUp);
        break;
      case Keys.ArrowDown:
        moveCursorHorizontal(Keys.ArrowDown);
        break;
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

      default:
        addCharacter(key);
    }
  }

  function addCharacter(char: string) {
    const { cursor, doc, currentNode } = editor;

    if (!currentNode) return;

    const docCopy = structuredClone(doc);

    const newId = Math.random().toString(36).substring(2, 15);
    const currentNodeCopy = structuredClone(currentNode);
    currentNodeCopy.id = newId;

    const newNode = addCharToNode(currentNodeCopy, char, cursor.x);
    const newDoc = updateNode(docCopy, currentNode, newNode);

    setEditor((prev) => ({
      ...prev,
      doc: newDoc,
      cursor: { ...prev.cursor, x: cursor.x + 1, anchorX: cursor.x + 1 },
      currentNode: newNode,
    }));

    const result = documentResolver(newDoc, true).flat(Infinity);
    setEditorView(result);

    moveCaret(char, Keys.ArrowRight, currentNode.type);
  }

  function removeCharacter() {
    const { cursor, doc, currentNode } = editor;

    if (!currentNode) return;

    const docCopy = structuredClone(doc);

    const newId = Math.random().toString(36).substring(2, 15);
    const currentNodeCopy = structuredClone(currentNode);
    currentNodeCopy.id = newId;

    const newNode = removeCharFromNode(currentNodeCopy, cursor.x);
    const newDoc = updateNode(docCopy, currentNode, newNode);

    setEditor((prev) => ({
      ...prev,
      doc: newDoc,
      cursor: { ...prev.cursor, x: cursor.x - 1, anchorX: cursor.x - 1 },
      currentNode: newNode,
    }));

    const result = documentResolver(newDoc, true).flat(Infinity);
    setEditorView(result);

    const char = currentNode.content ? currentNode.content[cursor.x - 1] : "";

    moveCaret(char, Keys.ArrowLeft, currentNode.type);
  }

  function handleSelection(e: MouseEvent) {
    const caret = document.caretPositionFromPoint(e.clientX, e.clientY);
    const pos = caret?.offset || 0;
    if (e.type === "mousedown")
      setSelection({
        startNode: e.target,
        startPos: pos,
        endNode: null,
        endPos: null,
        visible: false,
      });
    else
      setSelection((prev) => ({
        ...prev,
        endNode: e.target,
        endPos: pos,
      }));
  }

  const getCharWidth = (char: string, type: NodeTypes) => {
    // Replace spaces by their HTML Code
    char = char === Keys.Space ? "&nbsp;" : char;

    let span;
    switch (type) {
      case NodeTypes.bold:
        span = document.createElement("strong");
        break;
      default:
        span = document.createElement("span");
    }
    span.innerHTML = char;
    document.body.appendChild(span);
    const boundingClientRect = span.getBoundingClientRect();
    document.body.removeChild(span);
    return boundingClientRect.width;
  };

  function moveCaret(char: string, key: Keys, type: NodeTypes) {
    const charWidth = getCharWidth(char, type);
    const newPosition =
      key === Keys.ArrowRight ? caret.x + charWidth : caret.x - charWidth;

    setCaret((prev) => ({ ...prev, x: newPosition }));
  }

  function moveWithArrowCursor(key: Keys) {
    const content = editor.currentNode?.content;
    const type = editor.currentNode?.type || NodeTypes.parapagh;
    if (!content) return;

    const x = editor.cursor.x;
    if (key === Keys.ArrowLeft && x <= 0) return;
    if (key === Keys.ArrowRight && x >= content.length) return;

    const newPosition = key === Keys.ArrowRight ? x + 1 : x - 1;
    const pos = key === Keys.ArrowRight ? x : x - 1;
    const char = content[pos];

    setEditor((prev) => ({
      ...prev,
      cursor: { ...prev.cursor, x: newPosition, anchorX: newPosition },
    }));

    moveCaret(char, key, type);
  }

  function getStringWidth(str: string, pos: number, type: NodeTypes) {
    let px = 0;
    for (let i = 0; i < pos; i++) {
      px += getCharWidth(str[i], type);
    }

    return px;
  }

  function moveCursorHorizontal(key: Keys) {
    const { currentNode, doc, cursor } = editor;

    let newNode = null;
    if (key === Keys.ArrowDown) newNode = findNextNode(doc, currentNode?.id);
    else if (key === Keys.ArrowUp)
      newNode = findPreviousNode(doc, currentNode?.id);

    if (!newNode) {
      console.warn("Node or dom node not found !");
      return;
    }

    const { node, domNode } = newNode;

    const boundingClientRect = domNode.getBoundingClientRect();
    const contentLen = node.content?.length || 0;
    const pos = cursor.anchorX > contentLen ? contentLen : cursor.anchorX;
    const content = node?.content || "";
    const type = node?.type;

    let width = getStringWidth(content, pos, type);
    const totalWidth = getStringWidth(content, contentLen, type);
    const currentWidth = caret.x;

    console.log(Math.abs(currentWidth - width));

    if (currentWidth > totalWidth) width = totalWidth;
    else if (Math.abs(currentWidth - width) > 5) {
      for (let i = pos; i <= contentLen; i++) {
        width += getCharWidth(content[i], type);
        if (width >= currentWidth || Math.abs(currentWidth - width) <= 3) break;

        i++;
        console.log("sup");
      }
    }

    setEditor((prev) => ({
      ...prev,
      currentNode: node,
      cursor: { ...prev.cursor, x: pos },
    }));

    setCaret({ x: width, y: boundingClientRect.y });
  }

  return (
    <div className="no-select cursor-text editor">
      <div
        id="caret"
        className="bg-black px-0 py-2.5 w-0.5 h-1 absolute"
        style={{ left: `${caret.x}px`, top: `${caret.y}px` }}
      />
      <div
        id="selection"
        className="absolute bg-blue-400/50 rounded -z-50"
        style={{
          visibility: selection.visible ? "visible" : "hidden",
          width: 300,
          height: 300,
        }}
      />
      {editorView?.map((Element, index) => (
        <Fragment key={index}>{Element}</Fragment>
      ))}
    </div>
  );
}

export default App;
