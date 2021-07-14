import { PodFeature } from "../enums/pod-feature";
import { Swatch } from "./swatch";

export class FeatureInfo {
    private eraserSize = 50;
    private mouseX = 0;
    private mouseY = 0;
    private shouldShowContextMenu = false;
    // BRUSH
    private brushSize = 50;
    private brushColor: { r: number, g: number, b: number } = { r: 0, g: 0, b: 0 };
  
  
    public getBrushColor() {
      return this.brushColor ? this.brushColor : { r: 255, g: 255, b: 255 };
    }
    public setBrushColor(swatch: Swatch) {
      this.brushColor = swatch.color;
    }
    public getEraserSize() {
      return this.eraserSize;
    }
  
    public setEraserSize(eraserSize: number) {
      this.eraserSize = eraserSize;
    }
  
    public getBrushSize() {
      return this.brushSize;
    }
  
    public setBrushSize(brushSize: number) {
      this.brushSize = brushSize;
    }
  
    public getMouseX() {
      return this.mouseX;
    }
  
    public setMouseX(mouseX: number) {
      this.mouseX = mouseX;
    }
    public getMouseY() {
      return this.mouseY;
    }
  
    public setMouseY(mouseY: number) {
      this.mouseY = mouseY;
    }
  
    public getShouldShowContextMenu() {
      return this.shouldShowContextMenu;
    }
  
    public setShouldShowContextMenu(show: boolean) {
      this.shouldShowContextMenu = show;
    }
  
    /**Returns the current feature size */
    public getUtensilSize(selectedPodFeature: PodFeature) {
      switch (selectedPodFeature) {
        case PodFeature.BRUSH: return this.getBrushSize();
        case PodFeature.ERASER: return this.getEraserSize();
      }
    }
  }