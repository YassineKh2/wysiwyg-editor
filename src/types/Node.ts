export interface Node {
  id?: string;
  type: NodeTypes;
  content: string | null;
  children: Node[] | null;
}

export enum NodeTypes {
  parapagh = "parapagh",
  bold = "bold",
  image = "image",
  listParent = "listParent",
  listChild = "listChild",
  parent = "parent",
}
