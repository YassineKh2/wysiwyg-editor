import "./App.css";
import type { Editor } from "./types/Editor.ts";
import {
  documentResolverV2,
  findNextNode,
  findNodeFromId,
  findPreviousNode,
} from "./helpers/NodeHelpers.tsx";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Keys } from "./types/Keys.ts";
import { NodeTypes } from "./types/Node.ts";
import { getCharWidth } from "./helpers/CaretHelper.ts";

const editorDefault: Editor = {
  doc: {
    type: NodeTypes.start,
    content: "",
    isText: true,
    children: [
      {
        type: NodeTypes.parent,
        content: "",
        children: [
          {
            type: NodeTypes.parapagh,
            content: "hi ",
            children: [],
            isText: true,
          },
          {
            type: NodeTypes.parapagh,
            content: "is bold ",
            children: [],
            isText: true,
            styling: ["bold"],
          },
          {
            type: NodeTypes.parapagh,
            content: "yup",
            children: [],
            isText: true,
          },
        ],
        isText: true,
      },
      {
        type: NodeTypes.parent,
        content: "",
        children: [
          {
            type: NodeTypes.listChild,
            content: "hi i am child number 1",
            children: [],
            isText: false,
          },
          {
            type: NodeTypes.listChild,
            content: "",
            children: [
              {
                type: NodeTypes.parapagh,
                content: "hi ",
                children: [],
                isText: false,
              },
              {
                type: NodeTypes.parapagh,
                content: "i am",
                children: [],
                styling: ["bold"],
                isText: false,
              },
              {
                type: NodeTypes.parapagh,
                content: " an italic Textu ",
                children: [],
                styling: ["italic"],
                isText: false,
              },
              {
                type: NodeTypes.parapagh,
                content: " child number 2",
                children: [],
                isText: false,
              },
            ],
            isText: false,
            isList: true,
          },
          {
            type: NodeTypes.listChild,
            content: "hi i am child number 3",
            children: [],
            isText: false,
          },
        ],
        isText: false,
        isList: true,
      },
      {
        type: NodeTypes.parent,
        content: "",
        children: [
          {
            type: NodeTypes.parapagh,
            content: "sup",
            children: [],
            isText: true,
          },
        ],
        isText: true,
      },
      {
        type: NodeTypes.parent,
        content: "",
        children: [
          {
            type: NodeTypes.parapagh,
            content: "zp1 ",
            children: [],
            isText: true,
          },
          {
            type: NodeTypes.parapagh,
            content: "bold p2 ",
            children: [],
            styling: ["bold"],
            isText: true,
          },
          {
            type: NodeTypes.parapagh,
            content: "3rd",
            children: [],
            isText: true,
          },
        ],
        isText: true,
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
  const [editorView, setEditorView] = useState<
    string | JSX.Element | null | undefined
  >(null);
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
    const result = documentResolverV2(editor.doc);
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

    return () => {
      document.removeEventListener("mousedown", () => {
        console.warn("removed mousedown event");
      });
      document.removeEventListener("mouseup", () => {
        console.warn("removed mouseup event");
      });
    };
  }, []);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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

  function handleMouseClick(x: number, y: number) {
    const caret = document.caretPositionFromPoint(x, y);
    const nodeRect = caret?.getClientRect() || { x: 0, y: 0 };

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
      case Keys.Delete:
      case Keys.Backspace: {
        // removeCharacter();
        break;
      }
      // case Keys.ArrowUp:
      //   moveCursorHorizontal(Keys.ArrowUp);
      //   break;
      // case Keys.ArrowDown:
      //   moveCursorHorizontal(Keys.ArrowDown);
      //   break;
      case Keys.Enter:
      case Keys.Escape:
      case Keys.Tab:
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
      // addCharacter(key);
    }
  }

  function moveWithArrowCursor(direction: Keys) {
    let content = editor.currentNode?.content;
    let newNode = editor.currentNode;

    console.log(content, newNode);

    if (!content || !newNode) return;

    let type = newNode.type;
    const x = editor.cursor.x;

    let newPosition = direction === Keys.ArrowRight ? x + 1 : x - 1;
    const pos = direction === Keys.ArrowRight ? x : x - 1;
    let char = content[pos];

    if (direction === Keys.ArrowLeft && x - 1 == 0) {
      const previousNode = findPreviousNode(editor.doc, editor.currentNode?.id);
      if (!previousNode) return;

      newNode = previousNode.node;
      content = newNode.content;
      if (!content) return;
      newPosition = content.length;
    } else if (direction === Keys.ArrowRight && x + 1 > content.length) {
      const nextNode = findNextNode(editor.doc, editor.currentNode?.id);
      if (!nextNode) return;

      newNode = nextNode.node;
      content = newNode.content;
      if (!content) return;

      type = newNode.type;
      // Cursor index starts from 1
      newPosition = 1;
      char = content[0];
    }

    setEditor((prev) => ({
      ...prev,
      cursor: { ...prev.cursor, x: newPosition, anchorX: newPosition },
      currentNode: newNode,
    }));

    moveCaret(char, direction, type);
  }

  function moveCaret(char: string, direction: Keys, type: NodeTypes) {
    const charWidth = getCharWidth(char, type);
    const newPosition =
      direction === Keys.ArrowRight ? caret.x + charWidth : caret.x - charWidth;

    setCaret((prev) => ({ ...prev, x: newPosition }));
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
      {editorView}
    </div>
  );
  // <p>
  //   hello <strong>this</strong> is bold
  // </p>
}

export default App;
