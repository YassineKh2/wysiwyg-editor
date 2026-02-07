// Temp storage file

import type { Keys } from "react-hotkeys-hook";
import type { Keys } from "../types/Keys";
import type { NodeTypes } from "../types/Node";
import {
  addCharToNode,
  updateNode,
  documentResolver,
  removeCharFromNode,
  findPreviousNode,
  removeNode,
  findNextNode,
} from "./NodeHelpers";

export function addCharacter(char: string) {
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

export function removeCharacter() {
  const { cursor, doc, currentNode } = editor;

  if (!currentNode) return;

  const content = currentNode.content || "";
  let moveToNextNode = false;

  if (content.length === 1) {
    deleteNode();
    return;
  }

  // In Between Nodes
  if (cursor.x === 0) {
    removeFormNextNode();
    return;
  }

  if (cursor.x === 1) moveToNextNode = true;

  const docCopy = structuredClone(doc);

  const newId = Math.random().toString(36).substring(2, 15);
  const currentNodeCopy = structuredClone(currentNode);
  currentNodeCopy.id = newId;

  let newNode = removeCharFromNode(currentNodeCopy, cursor.x);
  const newDoc = updateNode(docCopy, currentNode, newNode);

  const previousNode = moveToNextNode && findPreviousNode(doc, currentNode.id);

  if (previousNode) newNode = previousNode.node;

  const newContentLength = newNode.content?.length || 1;
  const cursorX = moveToNextNode ? newContentLength : cursor.x - 1;

  setEditor((prev) => ({
    ...prev,
    doc: newDoc,
    cursor: { ...prev.cursor, x: cursorX, anchorX: cursorX },
    currentNode: newNode,
  }));

  const result = documentResolver(newDoc, true).flat(Infinity);
  setEditorView(result);

  const char = content[cursor.x - 1];
  moveCaret(char, Keys.ArrowLeft, currentNode.type);
}

export function deleteNode() {
  const { doc, currentNode } = editor;
  if (!currentNode) return;

  const docCopy = structuredClone(doc);

  const newDoc = removeNode(docCopy, currentNode.id);
  if (!newDoc) return;
  const newNode = findPreviousNode(docCopy, currentNode.id)?.node || null;
  const cursorX = newNode?.content?.length || 1;

  setEditor((prev) => ({
    ...prev,
    doc: newDoc[0],
    cursor: { ...prev.cursor, x: cursorX, anchorX: cursorX },
    currentNode: newNode,
  }));

  const result = documentResolver(newDoc[0], true).flat(Infinity);
  setEditorView(result);

  const char = currentNode.content ? currentNode.content[0] : "";
  moveCaret(char, Keys.ArrowLeft, currentNode.type);
}

export function removeFormNextNode() {
  const { doc, currentNode } = editor;
  if (!currentNode) return;

  const docCopy = structuredClone(doc);

  const previousNode = findPreviousNode(docCopy, currentNode.id)?.node;
  if (!previousNode) return;

  const previousNodeCopy = structuredClone(previousNode);
  const cursorX = previousNodeCopy?.content?.length || 1;

  const newNode = removeCharFromNode(previousNodeCopy, cursorX);
  const newDoc = updateNode(docCopy, previousNode, newNode);

  setEditor((prev) => ({
    ...prev,
    doc: newDoc,
    cursor: { ...prev.cursor, x: cursorX - 1, anchorX: cursorX - 1 },
    currentNode: newNode,
  }));

  const result = documentResolver(newDoc, true).flat(Infinity);
  setEditorView(result);

  const char = previousNode.content ? previousNode.content[cursorX - 1] : "";
  moveCaret(char, Keys.ArrowLeft, newNode.type);
}

export function handleSelection(e: MouseEvent) {
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

export function moveCaret(char: string, direction: Keys, type: NodeTypes) {
  const charWidth = getCharWidth(char, type);
  const newPosition =
    direction === Keys.ArrowRight ? caret.x + charWidth : caret.x - charWidth;

  setCaret((prev) => ({ ...prev, x: newPosition }));
}

export function moveWithArrowCursor(direction: Keys) {
  let content = editor.currentNode?.content;
  let newNode = editor.currentNode;

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

export function getStringWidth(str: string, pos: number, type: NodeTypes) {
  let px = 0;
  for (let i = 0; i < pos; i++) {
    px += getCharWidth(str[i], type);
  }

  return px;
}

export function moveCursorHorizontal(key: Keys) {
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

  if (currentWidth > totalWidth) width = totalWidth;

  // else if (Math.abs(currentWidth - width) > 5) {
  //   for (let i = pos; i <= contentLen; i++) {
  //     width += getCharWidth(content[i], type);
  //     if (width >= currentWidth || Math.abs(currentWidth - width) <= 3) break;

  //     i++;
  //     console.log("sup");
  //   }
  // }

  setEditor((prev) => ({
    ...prev,
    currentNode: node,
    cursor: { ...prev.cursor, x: pos },
  }));

  setCaret({ x: width, y: boundingClientRect.y });
}
