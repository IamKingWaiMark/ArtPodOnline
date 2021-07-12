export class Vectors {

    public static add(vector2D: Vector2D, val: number) {
        vector2D.x = vector2D.x + val;
        vector2D.y = vector2D.y + val;
    }
    public static multiply(vector2D: Vector2D, val: number) {
        vector2D.x = vector2D.x * val;
        vector2D.y = vector2D.y * val; 
    }
    public static divide(vector2D: Vector2D, val: number) {
        vector2D.x = vector2D.x / val;
        vector2D.y = vector2D.y / val; 
    }
}


export interface Vector2D {
    x: number,
    y: number
}