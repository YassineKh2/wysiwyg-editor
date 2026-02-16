import { Keys } from "../types/Keys";

export function getCharWidth(char: string, styling: string[]) {
  // Replace spaces by their HTML Code
  char = char === Keys.Space ? "&nbsp;" : char;

  const stylingCopy = [...styling];

  let element;
  const style = stylingCopy.pop();
  switch (style) {
    case "bold":
      element = document.createElement("strong");
      break;
    case "italic":
      element = document.createElement("em");
      break;
    case "sup":
      element = document.createElement("sup");
      break;
    default:
      element = document.createElement("span");
  }

  for (const style in stylingCopy) {
    switch (style) {
      case "bold":
        element.append(document.createElement("strong"));
        break;
      case "italic":
        element.append(document.createElement("em"));
        break;
      case "sup":
        element.append(document.createElement("em"));
        break;
      default:
        element.append(document.createElement("span"));
    }
  }

  element.innerHTML = char;
  document.body.appendChild(element);
  const boundingClientRect = element.getBoundingClientRect();
  document.body.removeChild(element);
  return boundingClientRect.width;
}
