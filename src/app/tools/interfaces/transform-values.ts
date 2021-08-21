import { Vector2D } from "../classes/vectors";

export interface Transform {
    origin: Vector2D,
    bounds: {     
        x: number,
        y: number,
        x2: number,
        y2: number,
        w: number,
        h: number },
    rotationAngle: number,
    scale: Vector2D
}