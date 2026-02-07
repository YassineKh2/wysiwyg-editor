import type { Node } from "../types/Node.ts";
import { NodeTypes } from "../types/Node.ts";
import type { JSX } from "react";

// Takes a document and returns the HTML Part
export function parseDoc(doc: Node) {
  switch (doc.type) {
    case NodeTypes.parapagh:
      return <p id={doc.id}>{doc.content}</p>;

    case NodeTypes.bold:
      return <strong id={doc.id}>{doc.content}</strong>;

    case NodeTypes.image:
      return <img id={doc.id} src={doc.content as string} alt={"image"} />;

    case NodeTypes.listParent:
      return <ol id={doc.id}>{doc.content}</ol>;

    case NodeTypes.listChild:
      return (
        <li className="list-disc list-inside" id={doc.id}>
          {doc.content}
        </li>
      );

    default:
      return <div id={doc.id}></div>;
  }
}

// TODO Fix this it should not be returning nested arrays
export function documentResolver(doc: Node, keepId?: boolean): JSX.Element[] {
  if (!keepId) doc.id = Math.random().toString(36).substring(2, 15);

  if (!doc.children) return [parseDoc(doc)];

  const result: JSX.Element[] = [];
  doc.children.forEach((childDoc) => {
    // @ts-expect-error TODO typing
    result.push(documentResolver(childDoc, keepId));
  });

  result.push(parseDoc(doc));

  return result;
}

export function documentResolverV2(doc: Node, keepId?: boolean) {
  if (!keepId) doc.id = Math.random().toString(36).substring(2, 15);

  if (doc.children?.length === 0) {
    if (doc.styling?.includes("bold"))
      return <strong id={doc.id}>{doc.content}</strong>;
    if (doc.styling?.includes("italic"))
      return <em id={doc.id}>{doc.content}</em>;
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
      <p id={doc.id}>
        {doc.children.map((child) => documentResolverV2(child))}
      </p>
    );
  }
  if (doc.isList && doc.type === NodeTypes.parent) {
    p = (
      <ul id={doc.id}>
        {doc.children.map((child) => documentResolverV2(child))}
      </ul>
    );
  }
  if (doc.isList && doc.type === NodeTypes.listChild) {
    p = (
      <li id={doc.id} className="list-disc list-inside">
        {doc.children.map((child) => documentResolverV2(child))}
      </li>
    );
  }

  if (doc.type === NodeTypes.start) {
    p = <div>{doc.children.map((child) => documentResolverV2(child))}</div>;
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
