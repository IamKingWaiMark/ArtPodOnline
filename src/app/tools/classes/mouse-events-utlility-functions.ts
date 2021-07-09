import { XY } from "./math";

export class MouseUtilities {
    isGoingLeft(lastMousePosition: XY, currentMousePosition: XY){
        return currentMousePosition.x < lastMousePosition.x;
    }

    isGoingRight(lastMousePosition: XY, currentMousePosition: XY){
        return currentMousePosition.x > lastMousePosition.x;
    }
}
