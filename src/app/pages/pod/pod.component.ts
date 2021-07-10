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

  featureInfoSubscription = new BehaviorSubject<FeatureInfo>(this.FEATURE_INFO);
  selectedPodFeatureSubscription = new BehaviorSubject<PodFeatures>(this.DEFAULTS.POD_FEATURES);
  showNewPodWindow = true;

  podDocuments: PodDocument[] = [];
  podDocumentsSubscription = new BehaviorSubject<PodDocument[]>(this.podDocuments);

  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {

    if (isPlatformBrowser(this.platform)) {
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
    window.addEventListener("mouseup", (ev: MouseEvent) => {
      this.GLOBAL_EVENTS.GLOBAL_MOUSE_UP_EVENT.emit(ev);
    });
    window.addEventListener("keyup", (ev: KeyboardEvent) => {
      this.GLOBAL_EVENTS.GLOBAL_KEYUP_EVENT.emit(ev);
    });
    window.addEventListener("keydown", (ev: KeyboardEvent) => {


      let CTRL_KEY = (navigator.platform.match("Mac") ? ev.metaKey : ev.ctrlKey);
      if (CTRL_KEY && ev.shiftKey && ev.altKey) {
        ev.preventDefault();
        ev.stopPropagation();
      } else if (CTRL_KEY && ev.shiftKey) {
        ev.preventDefault();
        ev.stopPropagation();
        switch (ev.key.toLowerCase()) {
          case "s": this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.SAVE_AS); break;
        }
      } else if (CTRL_KEY && ev.altKey) {
        ev.preventDefault();
        ev.stopPropagation();
        switch (ev.key.toLowerCase()) {
          case "n": this.showNewPodWindow = true; break;
        }
      } else if (CTRL_KEY) {
        ev.preventDefault();
        ev.stopPropagation();
      } else if (ev.shiftKey) {
        ev.preventDefault();
        ev.stopPropagation();
      } else {
        switch (ev.key.toLowerCase()) {
          case "x": this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.SWAP_SWATCH); break;
          case " ": ev.preventDefault(); ev.stopPropagation(); this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.MOVE_POD_DCOUMENT); break;
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
      case "MOVE": this.selectedPodFeatureSubscription.next(PodFeatures.MOVE); break;
      case "BRUSH": this.selectedPodFeatureSubscription.next(PodFeatures.BRUSH); break;
      case "ERASER": this.selectedPodFeatureSubscription.next(PodFeatures.ERASER); break;
      case "ZOOM": this.selectedPodFeatureSubscription.next(PodFeatures.ZOOM); break;
    }
    this.FEATURE_INFO.setShouldShowContextMenu(false);
  }


  /*
    NEW POD WINDOW
  */
  onNewPodWindowAction(action: NewPodWindowActionData) {
    switch (action.newPodWindowAction) {
      case NewPodWindowAction.CREATE: this.showNewPodWindow = false; this.createNewDocument(action); break;
      case NewPodWindowAction.CLOSE: this.showNewPodWindow = false; break;
    }
  }

  createNewDocument(action: NewPodWindowActionData) {
    this.podDocuments.push(action.podDocument);
    this.podDocumentsSubscription.next(this.podDocuments);
  }

  shouldShowNewPodWindow() {
    return this.showNewPodWindow || (this.podDocuments && this.podDocuments.length <= 0);
  }
  /*
    NEW POD WINDOW END
  */

  /*
    POD TOOL
  */
  onFileActionReceived(fileAction: PodFileAction) {
    switch (fileAction) {
      case PodFileAction.NEW:
        this.showNewPodWindow = true;
        break;
      case PodFileAction.SAVE_AS:
        this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.SAVE_AS);
        break;
    }
  }
  /*
    POD TOOL END
  */

}


export enum PodFeatures {
  MOVE = "MOVE",
  BRUSH = "BRUSH",
  ERASER = "#00000000",
  ZOOM = "ZOOM"
}
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
  public getUtensilSize(selectedPodFeature: PodFeatures) {
    switch (selectedPodFeature) {
      case PodFeatures.BRUSH: return this.getBrushSize();
      case PodFeatures.ERASER: return this.getEraserSize();
    }
  }
}