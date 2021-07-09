import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FeatureInfo, PodFeatures } from 'src/app/pages/pod/pod.component';
import { GlobalEvents, HotKey } from '../classes/global-events';
import { XY } from '../classes/math';
import { MouseUtilities } from '../classes/mouse-events-utlility-functions';
import { PodDocument } from '../classes/pod-document';
/**             Canvas Container
 * ------------------------------------------------------
 * |            Canvas Frame                            |
 * |   --------------------------------------------     |
 * |   |         Canvas'es                         |    |
 * |   |                                           |    |
 * |   ---------------------------------------------    |
 * |                                                    |
 * -----------------------------------------------------
 */
@Component({
  selector: 'app-pod-document',
  templateUrl: './pod-document.component.html',
  styleUrls: ['./pod-document.component.css']
})
export class PodDocumentComponent implements OnInit {
  @Input() activePodDocumentSubscription: BehaviorSubject<PodDocument>;
  @Input() selectedPodFeatureSubscription: BehaviorSubject<PodFeatures>;
  @Input() FEATURE_INFO: FeatureInfo;
  @Input() GLOBAL_EVENTS: GlobalEvents;

  CURSOR_ACTIONS: CursorActions = null; 
  DOCUMENT_ACTIONS: PodDocumentActions = null;
  SAVE_ACTIONS: PodDocumentSaveActions = null;
  ZOOM_ACTIONS: ZoomActions = null;

  mouseUtilities = new MouseUtilities();

  state: PodDocumentState;

  selectedPodFeature: PodFeatures = null;
  activePodDocument: PodDocument = null;
  lastMousePosition: XY;

  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.subscribeToActivePodDocument();
      this.subscribeToPodFeatures();
      this.subscribeToGlobalEvents();
    }
  }

  subscribeToActivePodDocument() {
    this.activePodDocumentSubscription.subscribe(
      podDocument => {
        this.activePodDocument = podDocument;
        this.CURSOR_ACTIONS = new CursorActions(this);
        this.DOCUMENT_ACTIONS = new PodDocumentActions(this);
        this.SAVE_ACTIONS = new PodDocumentSaveActions();
        this.ZOOM_ACTIONS = new ZoomActions(this); 
        if (!podDocument) return;
        
        this.DOCUMENT_ACTIONS.setupDocument(podDocument);
      }
    );
  }

 



  subscribeToPodFeatures() {
    this.selectedPodFeatureSubscription.subscribe(
      (feature: PodFeatures) => {
        this.selectedPodFeature = feature;
        this.CURSOR_ACTIONS.changeCursor(feature);
      }
    );
  }
  subscribeToGlobalEvents() {
    this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.subscribe(
      (hotKey: HotKey) => {
        switch (hotKey) {
          case HotKey.SAVE_AS: 
            break;
          case HotKey.MOVE_POD_DCOUMENT: 
            break;
        }
      }
    );
    this.GLOBAL_EVENTS.GLOBAL_KEYUP_EVENT.subscribe(
      (ev: KeyboardEvent) => {

      }
    );
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_UP_EVENT.subscribe(
      (ev: MouseEvent) => {
        this.state = null;
      }
    );
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_DOWN_EVENT.subscribe(
      (ev: MouseEvent) => {

      }
    );
  }
  




  CANVAS_CONTAINER_onMouseDown(ev: MouseEvent) {
    this.lastMousePosition = this.calculateMousePositionOn(this.DOCUMENT_ACTIONS.getCanvasFrame(), {x: ev.x, y: ev.y});
    switch(this.selectedPodFeature) {
      case PodFeatures.ZOOM: this.state = PodDocumentState.ZOOM; this.ZOOM_ACTIONS.setLastMousePosition({x: ev.x, y: ev.y}); break;
      case PodFeatures.BRUSH: this.state = PodDocumentState.EDIT; break;
      case PodFeatures.ERASER: this.state = PodDocumentState.EDIT; break;
    }
  }
  CANVAS_CONTAINER_onMouseMove(ev: MouseEvent) {
    this.CURSOR_ACTIONS.onMouseMove(ev);

    switch(this.selectedPodFeature) {
      case PodFeatures.ZOOM: if(this.state != PodDocumentState.ZOOM) return; this.ZOOM_ACTIONS.zoom(ev); break;
    }

  }
  CANVAS_CONTAINER_onMouseOut(ev: MouseEvent) {
    this.CURSOR_ACTIONS.hideCursor();

  }


  CANVAS_CONTAINER_onMouseUp(ev: MouseEvent) {
    
  }

  CANVAS_FRAME_onMouseMove(ev: MouseEvent) {
    
   if (this.state != PodDocumentState.EDIT) return;
    let canvas = <HTMLCanvasElement>document.querySelector(".test-canvas");
    let currentMousePos = this.calculateMousePositionOn(canvas, { x: ev.x, y: ev.y });

    let utensil = canvas.getContext("2d");
    utensil.beginPath();
    console.log("Utensil Size" + (this.FEATURE_INFO.getUtensilSize(this.selectedPodFeature) * this.activePodDocument.metaData.zoomScale));
    utensil.lineWidth = this.FEATURE_INFO.getUtensilSize(this.selectedPodFeature);
    utensil.strokeStyle = '#ff0000';
    utensil.lineCap = "round";
    utensil.moveTo(this.lastMousePosition.x, this.lastMousePosition.y);
    utensil.lineTo(currentMousePos.x, currentMousePos.y);
    utensil.stroke();
    utensil.closePath();

    this.lastMousePosition = currentMousePos;

  }




  CONTENT_CONTAINER_onMouseDown(ev: MouseEvent) {
    switch (ev.button) {
      case 2 /* Right Click */:
        this.FEATURE_INFO.setShouldShowContextMenu(true);
        this.FEATURE_INFO.setMouseX(ev.x);
        this.FEATURE_INFO.setMouseY(ev.y);
        break;
    }
  }


  /**Calculates the mouse position relative to the DOM element*/
  calculateMousePositionOn(element: HTMLElement, mousePos: XY) {
    let elementDimensions = element.getBoundingClientRect();
    let scale = this.activePodDocument.metaData.zoomScale;
    return { 
      x: ((mousePos.x - elementDimensions.x) / scale) , 
      y: ((mousePos.y - elementDimensions.y) / scale) };
  }
}

export enum PodDocumentState {
  EDIT,
  MOVE,
  ZOOM
}


export class CursorActions {
  podDocComp: PodDocumentComponent;
  constructor(podDocComp: PodDocumentComponent){
    this.podDocComp = podDocComp;
  }
  changeCursor(feature: PodFeatures) {
    switch (feature) {
      case PodFeatures.MOVE: this.genMoveFeatureCursor(); break;
      case PodFeatures.BRUSH: this.genRoundCusor(); break;
      case PodFeatures.ERASER: this.genRoundCusor(); break;
      case PodFeatures.ZOOM: this.genZoomFeatureCursor(); break;
    }
  }
  onMouseMove(ev: MouseEvent){
    switch (this.podDocComp.selectedPodFeature) {
      case PodFeatures.BRUSH: this.moveRoundCursor(ev); break;
      case PodFeatures.ERASER: this.moveRoundCursor(ev); break;
    }
  }
  moveRoundCursor(ev: MouseEvent) {
    if (this.podDocComp.selectedPodFeature == null) return;
   
    let podCursor = this.getPodCusror();
    this.showCursor();
    let canvasContainer = this.getCanvasContainer();
    let circumference = this.getCurrentFeatureValue(
      this.podDocComp.FEATURE_INFO, 
      this.podDocComp.selectedPodFeature) * this.podDocComp.activePodDocument.getZoomScale();
    podCursor.style.left = `${this.centerPodCursorToMouseX(ev, canvasContainer, circumference)}px`;
    podCursor.style.top = `${this.centerPodCursorToMouseY(ev, canvasContainer, circumference)}px`;
    podCursor.style.width = `${circumference}px`;
    podCursor.style.height = `${circumference}px`;
  }

  getCurrentFeatureValue(FEATURE_INFO: FeatureInfo, selectedPodFeature: PodFeatures) {
    switch (selectedPodFeature) {
      case PodFeatures.BRUSH: return FEATURE_INFO.getBrushSize();
      case PodFeatures.ERASER: return FEATURE_INFO.getEraserSize();
    }
  }

  centerPodCursorToMouseX(ev: MouseEvent, canvasContainer: HTMLDivElement, circleSize: number) {
    return ev.x - canvasContainer.getBoundingClientRect().x - (circleSize / 2);
  }
  centerPodCursorToMouseY(ev: MouseEvent, canvasContainer: HTMLDivElement, circleSize: number) {
    return ev.y - canvasContainer.getBoundingClientRect().y - (circleSize / 2);
  }

  genRoundCusor() {
    this.hideDefaultCursor();
    let podCursor = this.getPodCusror();
    podCursor.draggable = false;
    podCursor.style.border = "1px solid white";
    podCursor.style.borderRadius = "50%";
  }

  showCursor() {
    this.getPodCusror().style.visibility = "visible";
  }
  hideCursor() {
    this.getPodCusror().style.visibility = "hidden";
  }


  resetPodCursor() {
    let podCursor = this.getPodCusror();
    podCursor.style.visibility = "hidden";
  }

  genMoveFeatureCursor(){
    this.resetPodCursor();
    let canvasContainer = this.getCanvasContainer();
    canvasContainer.style.cursor = "context-menu";
  }
  genZoomFeatureCursor(){
    this.resetPodCursor();
    let canvasContainer = this.getCanvasContainer();
    canvasContainer.style.cursor = "zoom-in";
  }

  hideDefaultCursor() {
    this.getCanvasContainer().style.cursor = "none";
  }

  getCanvasContainer() {
    return <HTMLDivElement>document.querySelector(".pod-document-content-canvas-container");
  }
  getPodCusror() {
    return <HTMLDivElement>document.getElementById("pod-document-cursor");
  }
}

export class PodDocumentActions {
  podDocComp: PodDocumentComponent;
  constructor(podDocComp: PodDocumentComponent){
    this.podDocComp = podDocComp;
  }

  /**Scales the canvas frame based on the scale value*/
  scaleDocumentCanvasFrame(){
    let canvasFrame = this.getCanvasFrame();
    let frameHeight = this.podDocComp.activePodDocument.getHeight() * this.podDocComp.activePodDocument.getZoomScale();
    let frameWidth = this.podDocComp.activePodDocument.getWidth() * this.podDocComp.activePodDocument.getZoomScale();
    canvasFrame.style.width = `${frameWidth}px`
    canvasFrame.style.height = `${frameHeight}px`
  }
  /**Sets up the document's dimensions */
  setupDocument(podDocument: PodDocument) {

    let canvasContainer = this.getCanvasContainer();
    let canvasFrame = this.getCanvasFrame();
    let frameWidth = podDocument.getWidth();
    let frameHeight = podDocument.getHeight();
    let canvasFrameTop = 0;
    let canvasFrameLeft = 0;
    let scale = 1;
    if (canvasContainer) {
      let canvasContainerDimensions = canvasContainer.getBoundingClientRect();
      let containerWidth = canvasContainerDimensions.width;
      let containerHeight = canvasContainerDimensions.height;
      scale = containerWidth / frameWidth;
      if(scale > 1) scale = 1;
      frameWidth = frameWidth * scale;
      frameHeight = frameHeight * scale;
      let docPosition = {x: ((containerWidth - frameWidth) / 2), y: 100};
      canvasFrameTop = docPosition.y;
      canvasFrameLeft = docPosition.x;

    }
    this.podDocComp.activePodDocument.setZoomScale(scale);

    canvasFrame.style.top = `${canvasFrameTop}px`
    canvasFrame.style.left = `${canvasFrameLeft}px`
    canvasFrame.style.width = `${frameWidth}px`
    canvasFrame.style.height = `${frameHeight}px`
  }
  getCanvasContainer(){
    return <HTMLDivElement>document.querySelector(".pod-document-content-canvas-container");
  }
  getCanvasFrame(){
    return <HTMLDivElement>document.getElementById("pod-document-canvas-frame");
  }

  getCanvasFrameCurrentPosition() {
    let canvasFrameDimennsions = this.getCanvasFrame().getBoundingClientRect();
    return {x: canvasFrameDimennsions.x, y: canvasFrameDimennsions.y}
  }


}


export class PodDocumentSaveActions {
  ___SAVE_DOCUMENT() {
    let canvas = <HTMLCanvasElement>document.querySelector(".test-canvas");
    var link = document.createElement('a');
    link.download = 'filename.png';
    link.href = canvas.toDataURL();
    link.click();
  }
}

export class ZoomActions {
  podDocComp: PodDocumentComponent;
  lastMousePosition: XY;
  constructor(podDocComp: PodDocumentComponent){
    this.podDocComp = podDocComp;
  }

  zoom(ev: MouseEvent){
    let currentMousePos = {x: ev.x, y: ev.y};
    let scale = this.podDocComp.activePodDocument.getZoomScale();
    if(this.podDocComp.mouseUtilities.isGoingLeft(this.lastMousePosition, currentMousePos)) {
      scale -= .02;
      scale = scale <= .01? scale = 0.01: scale;
    } else {
      scale += .02;
      scale = scale >= 5? scale = 5: scale;
    }
    
    this.podDocComp.activePodDocument.setZoomScale(scale);
    this.podDocComp.DOCUMENT_ACTIONS.scaleDocumentCanvasFrame();
    this.setLastMousePosition(currentMousePos);
  }

  setLastMousePosition(lastMousePosition: XY){
    this.lastMousePosition = lastMousePosition;
  }
}