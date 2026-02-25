import "./App.css";
import type { Editor } from "./types/Editor.ts";
import {
  documentResolver,
  findNextNode,
  findNodeFromId,
  findPreviousNode,
  getNodeFromPreviousNode,
} from "./helpers/NodeHelpers.tsx";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Keys } from "./types/Keys.ts";
import { NodeTypes, type AttributeTypes } from "./types/Node.ts";
import { getCharWidth } from "./helpers/CaretHelper.ts";

const editorDefault: Editor = {
  doc: {
    type: NodeTypes.start,
    content: "",
    children: [
      {
        type: NodeTypes.parent,
        content: "",
        children: [
          {
            type: NodeTypes.parapagh,
            content: "hi ",
            children: [],
          },
          {
            type: NodeTypes.parapagh,
            content: "is bold ",
            children: [],
            styling: ["bold"],
          },
          {
            type: NodeTypes.parapagh,
            content: "yup",
            children: [],
          },
        ],
        attributes: { isText: true } as AttributeTypes,
      },
      {
        type: NodeTypes.parent,
        content: "",
        children: [
          {
            type: NodeTypes.parapagh,
            content: "hi i am child number 1",
            children: [],
            styling: ["bullet-list"],
          },
          {
            type: NodeTypes.parent,
            content: "",
            children: [
              {
                type: NodeTypes.parapagh,
                content: "hi ",
                children: [],
              },
              {
                type: NodeTypes.parapagh,
                content: "i am",
                children: [],
                styling: ["bold"],
              },
              {
                type: NodeTypes.parapagh,
                content: " an italic Textu ",
                children: [],
                styling: ["italic"],
              },
              {
                type: NodeTypes.parapagh,
                content: " an Boldeuuu and italic Textu and suuuuup",
                children: [],
                styling: ["bold", "sup", "italic"],
              },
              {
                type: NodeTypes.parapagh,
                content: " child number 2",
                children: [],
              },
            ],
            styling: ["bullet-list"],
            attributes: { isChildList: true } as AttributeTypes,
          },
          {
            type: NodeTypes.parapagh,
            content: "hi i am child number 3",
            styling: ["bullet-list"],
            children: [],
          },
        ],
        attributes: { isList: true } as AttributeTypes,
      },
      {
        type: NodeTypes.parent,
        content: "",
        children: [
          {
            type: NodeTypes.parapagh,
            content: "sup",
            children: [],
          },
        ],
        attributes: { isText: true } as AttributeTypes,
      },
      {
        type: NodeTypes.parent,
        content: "",
        children: [
          {
            type: NodeTypes.parapagh,
            content: "zp1 ",
            children: [],
          },
          {
            type: NodeTypes.parapagh,
            content: "bold p2 ",
            children: [],
            styling: ["bold"],
          },
          {
            type: NodeTypes.parapagh,
            content: "3rdddddd",
            children: [],
          },
        ],
        attributes: { isText: true } as AttributeTypes,
      },
    ],
  },
  cursor: {
    x: 0,
    y: 0,
    anchorX: 0,
  },
  currentNode: null,
  previousNodeId: null,
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
    const result = documentResolver(editor.doc);
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
    const offsetNode = caret?.offsetNode as Element;

    setCaret({ x: nodeRect.x, y: nodeRect.y });

    let id = offsetNode.parentElement?.id;
    if (!id) id = offsetNode.parentElement?.closest(".parent")?.id;

    if (!id) {
      console.warn("no id found for clicked element");
      return;
    }

    const previousNodeId = offsetNode.previousElementSibling?.id || null;
    const results = findNodeFromId(editorRef.current.doc, [], id);
    const node = results ? results[0] : null;
    const offset = caret?.offset || 0;

    setEditor((prev) => ({
      ...prev,
      cursor: { ...prev.cursor, x: offset, anchorX: offset },
      currentNode: node,
      previousNodeId,
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
    let currentNode = editor.currentNode;
    if (!currentNode) return;

    // Look for text in child
    const result = getNodeFromPreviousNode(
      editor.doc,
      editor.previousNodeId || "",
      undefined,
    );
    // If result is null we already have the node , otherwise get the current node
    currentNode = result ? result : currentNode;
    let content = currentNode.content;
    if (!content) return;

    const x = editor.cursor.x;

    let cursorPosition = direction === Keys.ArrowRight ? x + 1 : x - 1;
    const contentPos = direction === Keys.ArrowRight ? x : x - 1;
    let char = content[contentPos];

    if (direction === Keys.ArrowLeft && x - 1 === 0) {
      const previousNode = findPreviousNode(editor.doc, currentNode.id!);
      if (!previousNode) return;

      currentNode = previousNode;
      content = currentNode.content;
      if (!content) return;

      cursorPosition = content.length;
    } else if (direction === Keys.ArrowRight && x + 1 > content.length) {
      const nextNode = findNextNode(editor.doc, editor.currentNode?.id);
      if (!nextNode) return;

      currentNode = nextNode.node;
      content = currentNode.content;
      if (!content) return;
      // Cursor index starts from 1
      cursorPosition = 1;
      char = content[0];
    }

    console.log(char, contentPos, x);
    setEditor((prev) => ({
      ...prev,
      cursor: { ...prev.cursor, x: cursorPosition, anchorX: cursorPosition },
      currentNode: currentNode,
      previousNodeId: null,
    }));

    moveCaret(char, direction, currentNode.styling || []);
  }

  function moveCaret(char: string, direction: Keys, styling: string[]) {
    const charWidth = getCharWidth(char, styling);
    const newPosition =
      direction === Keys.ArrowRight ? caret.x + charWidth : caret.x - charWidth;

    const nodeRect = document
      .caretPositionFromPoint(newPosition, caret.y)
      ?.getClientRect();

    setCaret((prev) => ({ ...prev, x: nodeRect?.x || 0 }));
  }

  return (
    <div className="no-select cursor-text editor">
      <div
        id="caret"
        className="bg-black px-0 py-2.5 w-0.25 h-1 absolute"
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
