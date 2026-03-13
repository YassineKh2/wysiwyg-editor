import { type JSX } from "react";
import type { Node } from "../types/Node.ts";
import { NodeTypes, Styles } from "../types/Node.ts";

export function parseDoc(
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

    case "bullet-list":
      return (
        <li
          id={id}
          className={`list-disc list-inside ${isParent ? "parent" : ""}`}
        >
          {children}
        </li>
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

    const stylesCopy = [...styles];
    const style = stylesCopy.pop();
    const element = ApplyStyles(content, stylesCopy);
    return parseDoc(element, style, id, isParent);
  };

  if (!keepId) doc.id = Math.random().toString(36).substring(2, 15);

  // TODO Make this more readable , remove if elses make it into switch
  if (doc.children?.length === 0) {
    if (doc.styling)
      return ApplyStyles(doc.content || "", doc.styling, doc.id, true);
    else return doc.content;
  }

  let p;
  const { isText, isList, isChildList } = doc.attributes || {};

  if (isText && doc.type === NodeTypes.parent) {
    p = (
      <p id={doc.id}>
        {doc.children.map((child) => documentResolver(child, keepId))}
      </p>
    );
  }
  if (isList && doc.type === NodeTypes.parent) {
    p = (
      <ul id={doc.id}>
        {doc.children.map((child) => documentResolver(child, keepId))}
      </ul>
    );
  }

  if (isChildList && doc.type === NodeTypes.parent) {
    p = (
      <li id={doc.id} className="list-disc list-inside">
        {doc.children.map((child) => documentResolver(child, keepId))}
      </li>
    );
  }

  if (doc.type === NodeTypes.start) {
    p = (
      <div>{doc.children.map((child) => documentResolver(child, keepId))}</div>
    );
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
  const newNode = structuredClone(node);

  const content = newNode.content;
  const s1 = content?.slice(0, pos) || "";
  const s2 = content?.slice(pos, content?.length) || "";
  newNode.content = s1?.concat(char, s2);
  return newNode;
}

export function removeCharFromNode(node: Node, pos: number) {
  const newNode = structuredClone(node);

  const content = newNode.content;
  const position = pos - 1 > 0 ? pos - 1 : 0;
  const s1 = content?.slice(0, position) || "";
  const s2 = content?.slice(pos, content?.length) || "";
  newNode.content = s1 + s2;
  return newNode;
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

export function findChildPreviousNode(doc: Node, currentNodeId: string) {
  let previousNode: Node | null = null;

  const findNode: (node: Node) => Node | null = (node: Node) => {
    if (node.id === currentNodeId) return previousNode;
    if (node.type !== NodeTypes.parent) previousNode = node;

    for (const child of node.children) {
      const found = findNode(child);
      if (found) return found;
    }

    return null;
  };

  return findNode(doc);
}

export function findParentNode(doc: Node, currentNodeId: string) {
  const nodesDepth = findNodesDepth(doc);

  const currentNodeLevel =
    nodesDepth.find((node) => node.node.id === currentNodeId)?.level || 1;

  const index = nodesDepth.findIndex((node) => node.node.id === currentNodeId);

  const nodeList = nodesDepth.slice(0, index);
  const parentList = nodeList.filter(
    (node) =>
      node.level === currentNodeLevel - 1 &&
      node.node.type === NodeTypes.parent,
  );

  const node = parentList.pop()?.node;

  return node;
}

// Returns the Node while ignoring the currentNode Parent
export function findPreviousNode(
  doc: Node,
  currentNodeId: string,
  parentId: string,
) {
  let previousNode: Node | null = null;

  const findNode: (node: Node) => Node | null = (node: Node) => {
    if (node.id === currentNodeId) return previousNode;
    if (node.id !== parentId) previousNode = node;

    for (const child of node.children) {
      const found = findNode(child);
      if (found) return found;
    }

    return null;
  };

  return findNode(doc);
}

export function findPreviousAdjacentNode(doc: Node, currentNodeId: string) {
  const nodesDepth = findNodesDepth(doc);

  const currentNodeLevel = nodesDepth.find(
    (node) => node.node.id === currentNodeId,
  )?.level;

  const nodeList = nodesDepth.filter((node) => node.level === currentNodeLevel);
  const index = nodeList.findIndex((node) => node.node.id === currentNodeId);
  const { node } = nodeList[index - 1];

  return node;
}

export function findNodesDepth(root: Node) {
  if (!root) return [];

  const result: { node: Node; level: number }[] = [];

  const queue: { node: Node; level: number }[] = [{ node: root, level: 1 }];

  while (queue.length > 0) {
    const { node, level } = queue.shift()!;

    result.push({ node, level });

    for (const child of node.children) {
      queue.push({ node: child, level: level + 1 });
    }
  }

  return result;
}

// Only returns child nodes
export function findNextChildNode(doc: Node, currentNodeId?: string) {
  let found = false;

  const findNode: (node: Node) => Node | null = (node: Node) => {
    if (node.id === currentNodeId) {
      found = true;
      return null;
    }

    if (node.type !== NodeTypes.parent && found) return node;

    for (const child of node.children) {
      const result = findNode(child);
      if (result) return result;
    }

    return null;
  };

  return findNode(doc);
}

export function getCurrentNode(
  doc: Node,
  currentNode: Node,
  previousNodeId: string | null,
) {
  let node = structuredClone(currentNode);

  // Look for text in child
  const result = getNodeFromPreviousNode(doc, previousNodeId || "", undefined);
  // If result is null we already have the node , otherwise get the current node
  node = result ? result : node;

  if (!node) {
    console.warn("Current Node Not Found!");
    return null;
  }

  // If no other node was found , and we have a parent node , that means that this parent only has 1 children
  if (node.type === NodeTypes.parent) node = node.children[0];

  return node;
}

/* Merges 2 Nodes into 1 node
TODO Documentation
@Param previousNode: The previous node that we will merge in could be child node or parent
@Param ParentNode: The parent node to be merged
*/
export function mergeNodes(previousNode: Node, ParentNode: Node) {
  const node = structuredClone(previousNode);
  const nodeToMerge = structuredClone(ParentNode);
  console.log(node, nodeToMerge);

  const compareStyles = (Style1: string[] = [], Style2: string[] = []) => {
    // Remove styles that have no visible effect
    const filteredStyle1 = Style1?.filter(
      (style) => style !== Styles.BULLET_LIST,
    );
    const filteredStyle2 = Style2?.filter(
      (style) => style !== Styles.BULLET_LIST,
    );

    return filteredStyle1?.toString() === filteredStyle2?.toString();
  };

  // If previousNode is a child node and they have the same styling
  if (
    node.type !== NodeTypes.parent &&
    nodeToMerge.children.length === 1 &&
    compareStyles(node.styling, nodeToMerge.children[0].styling)
  ) {
    node.content = node.content?.concat(nodeToMerge.children[0].content!) || "";
    return node;
  }

  // If PreviousNode Last element and CurrentNode same element have the same styling
  if (
    node.type === NodeTypes.parent &&
    compareStyles(
      node.children[node.children.length - 1].styling,
      nodeToMerge.children[0].styling,
    )
  ) {
    const firstNode = nodeToMerge.children[0];
    const lastNode = node.children[node.children.length - 1];

    lastNode.content = lastNode.content?.concat(firstNode?.content || "") || "";
  }

  // Same Parent
  if (node.id === nodeToMerge.id) return node;

  nodeToMerge?.children.forEach((child) => {
    node.children.push(child);
  });

  return node;
}
