import type { CaretType, CaretMovementType } from "../types/Caret";
import { Keys } from "../types/Keys";

export function getCharSize(char: string, styling?: string[]) {
  // Replace spaces by their HTML Code
  char = char === Keys.Space ? "&nbsp;" : char;

  const elements = [];
  if (styling?.length)
    for (const style of styling) {
      switch (style) {
        case "bold":
          elements.push(document.createElement("strong"));
          break;
        case "italic":
          elements.push(document.createElement("em"));
          break;
        case "sup":
          elements.push(document.createElement("sup"));
          break;
        default:
          elements.push(document.createElement("span"));
      }
    }
  else {
    elements.push(document.createElement("span"));
  }

  let currentElement = elements[0];
  for (let i = 0; i < elements.length; i++) {
    if (i === 0) {
      currentElement.innerHTML = char;
      continue;
    }
    const newElement = elements[i];
    newElement.append(currentElement);
    currentElement = newElement;
  }

  document.body.appendChild(currentElement);
  const boundingClientRect = currentElement.getBoundingClientRect();
  document.body.removeChild(currentElement);
  return { width: boundingClientRect.width, height: boundingClientRect.height };
}

export function computeNextCaret(
  prevCaret: CaretType,
  movement: CaretMovementType,
) {
  const { char, styling, direction } = movement!;
  const { width, height } = getCharSize(char, styling);

  const newX =
    direction === Keys.ArrowRight ? prevCaret.x + width : prevCaret.x - width;

  const nodeRect = document
    .caretPositionFromPoint(newX, prevCaret.y + height)
    ?.getClientRect();

  return {
    x: nodeRect?.x ?? 0,
    y: nodeRect?.y ?? 0,
  };
}
