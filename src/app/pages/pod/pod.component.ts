import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pod',
  templateUrl: './pod.component.html',
  styleUrls: ['./pod.component.css']
})
export class PodComponent implements OnInit {

  public readonly DEFAULTS = {
    POD_FEATURES: PodFeatures.MOVE
  }

  public readonly CURSOR_GENERATOR: CursorGenerator = new CursorGenerator();
  public readonly FEATURE_INFO: FeatureInfo = new FeatureInfo();


  layers: Layer[] = [];
  GLOBAL_spacebarPressed = true;
  selectedPodFeature: PodFeatures = this.DEFAULTS.POD_FEATURES;




  constructor() { }

  ngOnInit(): void {
    this.layers.push(new Layer(500, 500, "#FFFFFF", true));
    this.addWindowKeyEvents();
  }

  private addWindowKeyEvents() {
    try {
      window.oncontextmenu = () => {
        return false;
      }
    } catch (err) {

    }

  }
  /*
    POD
  */
  onFeatureChanged(selectedFeature: string) {
    switch (selectedFeature) {
      case "MOVE": this.selectedPodFeature = PodFeatures.MOVE; break;
      case "BRUSH": this.selectedPodFeature = PodFeatures.BRUSH; break;
      case "ERASER": this.selectedPodFeature = PodFeatures.ERASER; break;
    }

  }

  POD_DIV_onMouseOut() {
    this.CURSOR_GENERATOR.resetPodCursor();
  }

  POD_DIV_onMouseMove(ev: MouseEvent, podDiv: HTMLDivElement, podCursor: HTMLSpanElement) {
    switch (this.selectedPodFeature) {
      case PodFeatures.MOVE: this.CURSOR_GENERATOR.genMoveCursor(ev, podDiv, podCursor); break;
      case PodFeatures.BRUSH: this.CURSOR_GENERATOR.genBrushCursor(ev, podDiv, podCursor, this.FEATURE_INFO.getBrushSize()); break;
      case PodFeatures.ERASER: this.CURSOR_GENERATOR.genEraserCursor(ev, podDiv, podCursor, this.FEATURE_INFO.getEraserSize()); break;
    }
  }

  POD_DIV_onRightClick(ev: MouseEvent) {
    if (this.selectedPodFeature) {
      this.FEATURE_INFO.setMouseX(ev.x);
      this.FEATURE_INFO.setMouseY(ev.y);
      this.FEATURE_INFO.setShouldShowContextMenu(true);
    }
  }
  /*
    POD END
  */



  onSpacebarPressed() {
    this.GLOBAL_spacebarPressed = true;
  }
  onSpacebarReleased() {
    this.GLOBAL_spacebarPressed = false;
  }



}


export class Layer {
  width: number;
  height: number;
  style: string = "";
  constructor(width: number, height: number, backgroundColor: string, center?: boolean) {
    this.width = width;
    this.height = height;
    this.style += `background-color: ${backgroundColor};`;
    if (center) {
      this.centerLayerInsidePodLayersDiv();
    } else {

    }

  }


  private centerLayerInsidePodLayersDiv() {
    try {
      let podLayersDivDimensions = (<HTMLDivElement>document.getElementById("pod-layers")).getBoundingClientRect();
      this.style += `left: ${(podLayersDivDimensions.width / 2) - (this.width / 2)}px; 
                    top: ${(podLayersDivDimensions.height / 2) - (this.height / 2)}px`;
    } catch (err) {

    }
  }


}

export enum PodFeatures {
  MOVE = "MOVE",
  BRUSH = "BRUSH",
  ERASER = "#00000000"
}

export class CursorGenerator {
  genMoveCursor(ev: MouseEvent, podDiv: HTMLDivElement, podCursor: HTMLSpanElement) {
    podDiv.style.cursor = "context-menu";
  }
  genBrushCursor(ev: MouseEvent, podDiv: HTMLDivElement, podCursor: HTMLSpanElement, brushSize: number) {
    podDiv.style.cursor = "none";
    podCursor.style.opacity = "1";
    podCursor.style.left = `${this.centerPodCursorToMouseX(ev, podDiv, brushSize)}px`;
    podCursor.style.top = `${this.centerPodCursorToMouseY(ev, podDiv, brushSize)}px`;
    podCursor.style.borderWidth = "1px";
    podCursor.style.borderColor = "white";
    podCursor.style.borderStyle = "solid";
    podCursor.style.borderRadius = "50%";
    podCursor.style.width = `${brushSize}px`;
    podCursor.style.height = `${brushSize}px`;
  }
  genEraserCursor(ev: MouseEvent, podDiv: HTMLDivElement, podCursor: HTMLSpanElement, eraserSize: number) {
    podDiv.style.cursor = "none";
    podCursor.style.opacity = "1";
    podCursor.style.left = `${this.centerPodCursorToMouseX(ev, podDiv, eraserSize)}px`;
    podCursor.style.top = `${this.centerPodCursorToMouseY(ev, podDiv, eraserSize)}px`;
    podCursor.style.borderWidth = "1px";
    podCursor.style.borderColor = "white";
    podCursor.style.borderStyle = "solid";
    podCursor.style.borderRadius = "50%";
    podCursor.style.width = `${eraserSize}px`;
    podCursor.style.height = `${eraserSize}px`;
  }


  resetPodCursor() {
    let podCursor = <HTMLSpanElement>document.getElementById("pod-cursor");
    let podDiv = <HTMLDivElement>document.getElementById("pod");
    podCursor.style.opacity = "0";
    podDiv.style.cursor = "context-menu";

  }

  centerPodCursorToMouseX(ev: MouseEvent, podDiv: HTMLDivElement, circleSize: number) {
    return ev.x - podDiv.getBoundingClientRect().x - (circleSize / 2);
  }
  centerPodCursorToMouseY(ev: MouseEvent, podDiv: HTMLDivElement, circleSize: number) {
    return ev.y - podDiv.getBoundingClientRect().y - (circleSize / 2);
  }
}

export class FeatureInfo {
  private eraserSize = 50;
  private brushSize = 50;
  private mouseX = 0;
  private mouseY = 0;
  private shouldShowContextMenu = false;

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
}