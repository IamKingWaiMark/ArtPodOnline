import { Vector2D } from "./vectors";


export class MouseUtilities {
    isGoingLeft(lastMousePosition: Vector2D, currentMousePosition: Vector2D){
        return currentMousePosition.x < lastMousePosition.x;
    }

    isGoingRight(lastMousePosition: Vector2D, currentMousePosition: Vector2D){
        return currentMousePosition.x > lastMousePosition.x;
    }

    isGoingUp(lastMousePosition: Vector2D, currentMousePosition: Vector2D){
        return currentMousePosition.y < lastMousePosition.y;
    }
    isGoingDown(lastMousePosition: Vector2D, currentMousePosition: Vector2D){
        return currentMousePosition.y > lastMousePosition.y;
    }
}
