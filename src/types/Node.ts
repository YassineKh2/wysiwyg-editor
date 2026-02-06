export interface Node {
  id?: string;
  type: NodeTypes;
  content: string | null;
  children: Node[];
  isText: boolean;
  isList?: boolean;
  styling?: string[];
}

export enum NodeTypes {
  start = "start",
  parapagh = "parapagh",
  bold = "bold",
  image = "image",
  listParent = "listParent",
  listChild = "listChild",
  parent = "parent",
}
