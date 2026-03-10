export interface Node {
  id: string;
  type: NodeTypes;
  content: string | null;
  children: Node[];
  attributes?: AttributeTypes;
  styling?: Styles[];
}

export enum NodeTypes {
  start = "start",
  parapagh = "parapagh",
  image = "image",
  parent = "parent",
}
export enum Styles {
  BOLD = "bold",
  ITALIC = "italic",
  SUP = "sup",
  BULLET_LIST = "bullet-list",
}

export type AttributeTypes = {
  isText: boolean;
  isList: boolean;
  isChildList: boolean;
};
