import { isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { GlobalEvents, HotKey } from 'src/app/tools/classes/global-events';
import { Swatch } from 'src/app/tools/classes/swatch';

@Component({
  selector: 'app-pod',
  templateUrl: './pod.component.html',
  styleUrls: ['./pod.component.css']
})
export class PodComponent implements OnInit {
  public readonly GLOBAL_EVENTS = new GlobalEvents();
  public readonly CURSOR_GENERATOR: CursorGenerator = new CursorGenerator();
  public readonly FEATURE_INFO: FeatureInfo = new FeatureInfo();
  public readonly DEFAULTS = {
    POD_FEATURES: PodFeatures.MOVE
  }

  layers: Layer[] = [];
  selectedPodFeature: PodFeatures = this.DEFAULTS.POD_FEATURES;


  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {

    if(isPlatformBrowser(this.platform)) {
      this.layers.push(new Layer(500, 500, "#FFFFFF", true));
      this.addWindowKeyEvents();
    }
  }

  private addWindowKeyEvents() {
    window.oncontextmenu = () => {
      return false;
    }
    window.addEventListener("mousemove", (ev: MouseEvent) => {
      this.GLOBAL_EVENTS.GLOBAL_MOUSE_MOVE_EVENT.emit(ev);
    });
    window.addEventListener("mouseup", (ev) => {
      this.GLOBAL_EVENTS.GLOBAL_MOUSE_UP_EVENT.emit(ev);
    });
    window.addEventListener("keydown", (ev: KeyboardEvent) => {
      if(ev.ctrlKey && ev.shiftKey) {

      } else if (ev.ctrlKey) { 

      } else if (ev.shiftKey) { 

      } else {
        switch(ev.key.toLowerCase()) {
          case "x": this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.SWAP_SWATCH); break;
        }
      }
      this.GLOBAL_EVENTS.GLOBAL_KEYDOWN_EVENT.emit(ev);
    });
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
    this.FEATURE_INFO.setShouldShowContextMenu(false);
  }

  /*POD_DIV_onMouseOut() {
    this.CURSOR_GENERATOR.resetPodCursor();
  }

  POD_DIV_onMouseMove(ev: MouseEvent, podDiv: HTMLDivElement, podCursor: HTMLSpanElement) {
    switch (this.selectedPodFeature) {
      case PodFeatures.MOVE: this.CURSOR_GENERATOR.genMoveCursor(ev, podDiv, podCursor); break;
      case PodFeatures.BRUSH: this.CURSOR_GENERATOR.genBrushCursor(ev, podDiv, podCursor, this.FEATURE_INFO.getBrushSize()); break;
      case PodFeatures.ERASER: this.CURSOR_GENERATOR.genEraserCursor(ev, podDiv, podCursor, this.FEATURE_INFO.getEraserSize()); break;
    }
  }
  POD_DIV_onMouseDown(ev: MouseEvent){
    switch(ev.button) {
      case 0: break;
      case 1: break;
      case 2: break;
    }
  }
  POD_DIV_onMouseUp(ev: MouseEvent){
    switch(ev.button) {
      case 0: break;
      case 1: break;
      case 2: break;
    }
  }
  POD_DIV_onRightClick(ev: MouseEvent) {
    if (this.selectedPodFeature) {
      this.FEATURE_INFO.setMouseX(ev.x);
      this.FEATURE_INFO.setMouseY(ev.y);
      this.FEATURE_INFO.setShouldShowContextMenu(true);
    }
  }*/


  /*
    POD END
  */




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

export enum PodFeatures {
  MOVE = "MOVE",
  BRUSH = "BRUSH",
  ERASER = "#00000000"
}
export class FeatureInfo {
  private eraserSize = 50;
  private mouseX = 0;
  private mouseY = 0;
  private shouldShowContextMenu = false;
  // BRUSH
  private brushSize = 50;
  private brushColor: {r: number, g: number, b: number} = {r: 0, g: 0, b: 0};


  public getBrushColor(){
    return this.brushColor? this.brushColor: {r: 255, g: 255, b: 255};
  }
  public setBrushColor(swatch: Swatch){
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
}