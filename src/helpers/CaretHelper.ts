import { Keys } from "../types/Keys";

export function getCharWidth(char: string, styling: string) {
  // Replace spaces by their HTML Code
  char = char === Keys.Space ? "&nbsp;" : char;

  let span;
  switch (styling) {
    case "bold":
      span = document.createElement("strong");
      break;
    case "itatlic":
      span = document.createElement("em");
      break;
    default:
      span = document.createElement("span");
  }
  span.innerHTML = char;
  document.body.appendChild(span);
  const boundingClientRect = span.getBoundingClientRect();
  document.body.removeChild(span);
  return boundingClientRect.width;
}
