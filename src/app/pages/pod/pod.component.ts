import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GlobalEvents, HotKey } from 'src/app/tools/classes/global-events';
import { PodDocument } from 'src/app/tools/classes/pod-document';
import { Swatch } from 'src/app/tools/classes/swatch';
import { PodFileAction } from 'src/app/tools/pod-app-tools/pod-app-tools.component';
import { NewPodWindowAction, NewPodWindowActionData } from 'src/app/windows/new-pod-window/new-pod-window.component';

@Component({
  selector: 'app-pod',
  templateUrl: './pod.component.html',
  styleUrls: ['./pod.component.css']
})
export class PodComponent implements OnInit {
  public readonly GLOBAL_EVENTS = new GlobalEvents();
  public readonly FEATURE_INFO: FeatureInfo = new FeatureInfo();

  public readonly DEFAULTS = {
    POD_FEATURES: PodFeatures.MOVE
  }
  selectedPodFeature: PodFeatures = this.DEFAULTS.POD_FEATURES;
  showNewPodWindow = true;

  podDocuments: PodDocument [] = [];
  podDocumentsSubscription = new BehaviorSubject<PodDocument[]>(this.podDocuments);

  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {

    if(isPlatformBrowser(this.platform)) {
      this.addWindowKeyEvents();
    }
  }

  private addWindowKeyEvents() {
    window.oncontextmenu = () => {
      return false;
    }
    window.addEventListener("mousedown", (ev: MouseEvent) => {
      this.GLOBAL_EVENTS.GLOBAL_MOUSE_DOWN_EVENT.emit(ev);
    });
    window.addEventListener("mousemove", (ev: MouseEvent) => {
      this.GLOBAL_EVENTS.GLOBAL_MOUSE_MOVE_EVENT.emit(ev);
    });
    window.addEventListener("mouseup", (ev) => {
      this.GLOBAL_EVENTS.GLOBAL_MOUSE_UP_EVENT.emit(ev);
    });
    window.addEventListener("keydown", (ev: KeyboardEvent) => {
      
      
      let CTRL_KEY = (navigator.platform.match("Mac") ? ev.metaKey : ev.ctrlKey);
      if(CTRL_KEY && ev.shiftKey) {
        ev.preventDefault();
        ev.stopPropagation();
      } else if (CTRL_KEY && ev.altKey) {
        ev.preventDefault();
        ev.stopPropagation();
        switch(ev.key.toLowerCase()) {
          case "n": this.showNewPodWindow = true; break;
        }
      } else if (CTRL_KEY) { 
        ev.preventDefault();
        ev.stopPropagation();
      } else if (ev.shiftKey) { 
        ev.preventDefault();
        ev.stopPropagation();
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


  /*
    NEW POD WINDOW
  */
  onNewPodWindowAction(action: NewPodWindowActionData) {
    switch(action.newPodWindowAction) {
      case NewPodWindowAction.CREATE: this.showNewPodWindow = false; this.createNewDocument(action); break;
      case NewPodWindowAction.CLOSE: this.showNewPodWindow = false; break;
    }
  }

  createNewDocument(action: NewPodWindowActionData){
    this.podDocuments.push(action.podDocument);
    this.podDocumentsSubscription.next(this.podDocuments);
  }

  shouldShowNewPodWindow(){
    return this.showNewPodWindow || (this.podDocuments && this.podDocuments.length <= 0);
  }
  /*
    NEW POD WINDOW END
  */

  /*
    POD TOOL
  */
  onFileActionReceived(fileAction: PodFileAction) {
    switch(fileAction) {
      case PodFileAction.NEW:
        this.showNewPodWindow = true;
        break;
    }
  }
  /*
    POD TOOL END
  */

}




/*

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
*/
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