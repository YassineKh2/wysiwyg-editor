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

  for (let i = 0; i < parentList.length; i++) {
    if (parentList[i].node.children.find((child) => child.id === currentNodeId))
      return parentList[i].node;
  }

  console.log("findParentNode : Parent not found ");
  return null;
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

  if (!currentNodeLevel) {
    console.warn("findPreviousAdjacentNode : Current Node Level not found");
    return;
  }

  let nodeList = nodesDepth.filter((node) => node.level === currentNodeLevel);
  let index = nodeList.findIndex((node) => node.node.id === currentNodeId);

  // Makes sure that element isn't the last adjacent node
  if (index !== 0) {
    const { node } = nodeList[index - 1];
    return node;
  }

  //TODO Makes this a while loop
  nodeList = nodesDepth.filter((node) => node.level === currentNodeLevel - 1);
  const parent = findParentNode(doc, currentNodeId);
  index = nodeList.findIndex((node) => node.node.id === parent?.id);

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
@Param ParentNode: The parent of the node to be merged
@Param nodeId: The Id of the node to be merged
*/
export function mergeNodes(
  previousNode: Node,
  ParentNode: Node,
  nodeId: string,
) {
  const node = structuredClone(previousNode);
  const nodeToMerge = structuredClone(ParentNode);

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
    const contentToMerge = nodeToMerge.children[0].content || "";
    const content = node.content?.concat(contentToMerge);

    if (!content) {
      console.warn("mergeNodes: Error merging");
      return;
    }

    node.content = content;
    return node;
  }

  const sameParent = nodeToMerge.children.find((child) => child.id === node.id);

  // If PreviousNode Last element and CurrentNode same element have the same styling and don't have the same parent
  if (
    node.type === NodeTypes.parent &&
    !sameParent &&
    compareStyles(
      node.children[node.children.length - 1].styling,
      nodeToMerge.children[0].styling,
    )
  ) {
    const firstNode = nodeToMerge.children[0];
    const lastNode = node.children[node.children.length - 1];

    const firstNodeContent = firstNode.content || "";
    const lastNodeContent = lastNode.content?.concat(firstNodeContent) || "";

    if (!lastNodeContent) console.warn("mergeNodes : No content to merge");

    lastNode.content = lastNodeContent;
  }

  // If PreviousNode Last element and CurrentNode same element have the same styling and have the same parent
  if (
    node.type === NodeTypes.parent &&
    sameParent &&
    compareStyles(
      node.children[node.children.length - 1].styling,
      nodeToMerge.children[0].styling,
    )
  ) {
    const foundNode = nodeToMerge.children.find((child) => child.id === nodeId);
    const lastNode = node.children[node.children.length - 1];

    if (!foundNode) {
      console.warn("mergeNodes : No Node Found !");
      return;
    }

    const foundNodeContent = foundNode.content || "";
    const lastNodeContent = lastNode.content?.concat(foundNodeContent) || "";

    if (!lastNodeContent) console.warn("mergeNodes : No content to merge");

    if (lastNode) lastNode.content = lastNodeContent;
  }

  nodeToMerge?.children.forEach((child) => {
    node.children.push(child);
  });

  return node;
}
