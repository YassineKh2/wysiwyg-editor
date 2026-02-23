export interface Node {
  id?: string;
  type: NodeTypes;
  content: string | null;
  children: Node[];
  attributes?: AttributeTypes;
  styling?: string[];
}

export enum NodeTypes {
  start = "start",
  parapagh = "parapagh",
  image = "image",
  parent = "parent",
}
export type AttributeTypes = {
  isText: boolean;
  isList: boolean;
  isChildList: boolean;
};
