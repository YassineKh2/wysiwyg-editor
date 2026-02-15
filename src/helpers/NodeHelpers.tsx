import type { JSX } from "react";
import type { Node } from "../types/Node.ts";
import { NodeTypes } from "../types/Node.ts";

function parseDoc(
  children?: string | JSX.Element,
  style?: string,
  id?: string,
  isParent?: boolean,
) {
  switch (style) {
    case "bold":
      return (
        <strong className={isParent ? "parent" : ""} id={id}>
          {children}
        </strong>
      );

    case "italic":
      return (
        <em className={isParent ? "parent" : ""} id={id}>
          {children}
        </em>
      );

    case "sup":
      return (
        <sup className={isParent ? "parent" : ""} id={id}>
          {children}
        </sup>
      );

    default:
      return (
        <p className={isParent ? "parent" : ""} id={id}>
          {children}
        </p>
      );
  }
}

export function documentResolver(doc: Node, keepId?: boolean) {
  const ApplyStyles = (
    content: string,
    styles: string[],
    id?: string,
    isParent?: boolean,
  ): JSX.Element => {
    if (styles.length === 1) return parseDoc(content, styles[0], id, isParent);

    const style = styles.pop();
    const element = ApplyStyles(content, styles);
    return parseDoc(element, style, id, isParent);
  };

  if (!keepId) doc.id = Math.random().toString(36).substring(2, 15);

  if (doc.children?.length === 0) {
    if (doc.styling)
      return ApplyStyles(doc.content || "", doc.styling, doc.id, true);
    if (doc.type === NodeTypes.listChild)
      return (
        <li id={doc.id} className="list-disc list-inside">
          {doc.content}
        </li>
      );
    else return doc.content;
  }

  let p;
  if (doc.isText && doc.type === NodeTypes.parent) {
    p = (
      <p id={doc.id}>{doc.children.map((child) => documentResolver(child))}</p>
    );
  }
  if (doc.isList && doc.type === NodeTypes.parent) {
    p = (
      <ul id={doc.id}>
        {doc.children.map((child) => documentResolver(child))}
      </ul>
    );
  }
  if (doc.isList && doc.type === NodeTypes.listChild) {
    p = (
      <li id={doc.id} className="list-disc list-inside">
        {doc.children.map((child) => documentResolver(child))}
      </li>
    );
  }

  if (doc.type === NodeTypes.start) {
    p = <div>{doc.children.map((child) => documentResolver(child))}</div>;
  }

  return p;
}

export function findNodeFromId(doc: Node, res: Node[], id?: string) {
  if (!id) return;
  if (doc.id === id) res.push(doc);

  doc.children?.forEach((childDoc) => {
    findNodeFromId(childDoc, res, id);
  });

  return res;
}
export function addCharToNode(node: Node, char: string, pos: number) {
  const content = node.content;
  const s1 = content?.slice(0, pos) || "";
  const s2 = content?.slice(pos, content?.length) || "";
  node.content = s1?.concat(char, s2);
  return node;
}

export function removeCharFromNode(node: Node, pos: number) {
  const content = node.content;
  const position = pos - 1 > 0 ? pos - 1 : 0;
  const s1 = content?.slice(0, position) || "";
  const s2 = content?.slice(pos, content?.length) || "";
  node.content = s1 + s2;
  return node;
}

export function updateNode(doc: Node, oldNode: Node, newNode: Node) {
  if (doc.id === oldNode.id) {
    return newNode;
  }
  if (!doc.children?.length) return doc;

  for (let i = 0; i < doc.children?.length; i++) {
    doc.children[i] = updateNode(doc.children[i], oldNode, newNode);
  }

  return doc;
}

export function findNodeInDomFromId(id?: string) {
  if (!id) return null;

  return document.getElementById(id);
}

export function findPreviousNode(doc: Node, id?: string) {
  const previousElement = findNodeInDomFromId(id)?.previousElementSibling;
  if (!previousElement) return;

  const node = findNodeFromId(doc, [], previousElement?.id);
  if (!node) return;

  return { node: node[0], domNode: previousElement };
}
export function findNextNode(doc: Node, id?: string) {
  const nextElement = findNodeInDomFromId(id)?.nextElementSibling;
  if (!nextElement) return;

  const node = findNodeFromId(doc, [], nextElement?.id);
  if (!node) return;

  return { node: node[0], domNode: nextElement };
}

export function removeNode(doc: Node, id?: string) {
  if (doc.id === id) {
    if (doc.children?.length) return doc.children;
    else return null;
  }

  if (!doc.children?.length) return [doc];

  const childrenArr = [];

  for (let i = 0; i < doc.children?.length; i++) {
    const result = removeNode(doc.children[i], id);
    if (!result) continue;

    childrenArr.push(result.flat(1));
  }

  doc.children = childrenArr.flat(1);

  return [doc];
}

export function getNodeFromPreviousNode(
  doc: Node,
  previousNodeId: string,
  previousNode: Node | undefined,
): Node | null {
  if (previousNode?.id === previousNodeId) {
    return doc;
  }
  for (let i = 0; i < doc.children.length; i++) {
    const found = getNodeFromPreviousNode(
      doc.children[i],
      previousNodeId,
      doc.children[i - 1],
    );
    if (found) return found;
  }

  return null;
}
