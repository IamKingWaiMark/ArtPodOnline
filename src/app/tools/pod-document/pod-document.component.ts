import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
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

  state: PodDocumentState = null;
  stateSubscription = new BehaviorSubject<PodDocumentState>(this.state);
  previousState: PodDocumentState = null;

  selectedPodFeature: PodFeatures = null;
  activePodDocument: PodDocument = null;


  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.subscribeToActivePodDocument();
      this.subscribeToDocumentStates();
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

  subscribeToDocumentStates(){
    this.stateSubscription.subscribe(
      state => {
        this.CURSOR_ACTIONS.overrideCursor(state, this.selectedPodFeature);
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
            this.DOCUMENT_ACTIONS.resetCanvasFrameSnapshot();
            this.DOCUMENT_ACTIONS.resetMouseSnapshot();
            this.setState(PodDocumentState.MOVE);
            break;
        }
      }
    );
    this.GLOBAL_EVENTS.GLOBAL_KEYUP_EVENT.subscribe(
      (ev: KeyboardEvent) => {
        this.setState(null); 
      }
    );
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_UP_EVENT.subscribe(
      (ev: MouseEvent) => {
        
      }
    );
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_DOWN_EVENT.subscribe(
      (ev: MouseEvent) => {

      }
    );
  }
  
  CANVAS_CONTAINER_onMouseDown(ev: MouseEvent) {
    this.DOCUMENT_ACTIONS.lastMousePositionOnCanvasFrame = this.calculateMousePositionOn(this.DOCUMENT_ACTIONS.getCanvasFrame(), {x: ev.x, y: ev.y});
    if(this.state == PodDocumentState.MOVE) {

    } else {
      switch(this.selectedPodFeature) {
        case PodFeatures.ZOOM: this.state = PodDocumentState.ZOOM; this.ZOOM_ACTIONS.setLastMousePosition({x: ev.x, y: ev.y}); break;
        case PodFeatures.BRUSH: this.state = PodDocumentState.EDIT; break;
        case PodFeatures.ERASER: this.state = PodDocumentState.EDIT; break;
      }
    }
  }
  CANVAS_CONTAINER_onMouseMove(ev: MouseEvent) {
    this.CURSOR_ACTIONS.onMouseMove(ev);
    if(this.state == PodDocumentState.MOVE) {
      this.DOCUMENT_ACTIONS.moveCanvasFrame({x: ev.x, y: ev.y});
    } else {
      switch(this.selectedPodFeature) {
        case PodFeatures.ZOOM: if(this.state != PodDocumentState.ZOOM) return; this.ZOOM_ACTIONS.zoom(ev); break;
      }
    }
  }
  CANVAS_CONTAINER_onMouseOut(ev: MouseEvent) {
    this.CURSOR_ACTIONS.hideCursor();

  }


  CANVAS_CONTAINER_onMouseUp(ev: MouseEvent) {
    this.setState(null);
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

  
  CANVAS_FRAME_onMouseMove(ev: MouseEvent) {
    
   if (this.state != PodDocumentState.EDIT) return;


  }






  /**Calculates the mouse position relative to the DOM element*/
  calculateMousePositionOn(element: HTMLElement, mousePos: XY) {
    let elementDimensions = element.getBoundingClientRect();
    let scale = this.activePodDocument.getZoomScale();
    return { 
      x: ((mousePos.x - elementDimensions.x) / scale) , 
      y: ((mousePos.y - elementDimensions.y) / scale) };
  }

  setState(state: PodDocumentState) {
    this.previousState = this.state;
    this.state = state;
    this.stateSubscription.next(this.state);
  }

  goBackToPreviousState(){
    this.state = this.previousState;
    this.previousState = null;
    this.stateSubscription.next(this.state);
  }


}

export enum PodDocumentState {
  EDIT = "EDIT",
  MOVE = "MOVE_DOCUMENT",
  ZOOM = "ZOOM"
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

  overrideCursor(state: PodDocumentState, selectedFeature: PodFeatures){

    if(state) {
      switch(state) {
        case PodDocumentState.MOVE: this.genMoveDocumentCursor(); break;
      }
    } else {
      this.changeCursor(selectedFeature);
    }
  }


  onMouseMove(ev: MouseEvent){
    
    switch (this.podDocComp.selectedPodFeature) {
      case PodFeatures.BRUSH: this.moveRoundCursor(ev); break;
      case PodFeatures.ERASER: this.moveRoundCursor(ev); break;
    }
    if(this.podDocComp.state == PodDocumentState.MOVE) this.hideCursor();
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
  genMoveDocumentCursor(){
    this.resetPodCursor();
    let canvasContainer = this.getCanvasContainer();
    canvasContainer.style.cursor = "grab";
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
  lastMousePositionOnCanvasFrame: XY;
  mouseSnapshot: XY;
  canvasFrameSnapshot: XY;
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
    let scale = 1;
    if (canvasContainer) {
      let canvasContainerDimensions = canvasContainer.getBoundingClientRect();
      let containerWidth = canvasContainerDimensions.width;
      let containerHeight = canvasContainerDimensions.height;
      scale = frameWidth > frameHeight? containerWidth / frameWidth: containerHeight / frameHeight;
      if(scale > 1) scale = 1;
      frameWidth = frameWidth * scale;
      frameHeight = frameHeight * scale;

    }
    canvasFrame.style.width = `${frameWidth}px`
    canvasFrame.style.height = `${frameHeight}px`
    this.podDocComp.activePodDocument.setZoomScale(scale);
    this.podDocComp.activePodDocument.addLayer(0);
    this.centerCanvasFrame();
  }

  centerCanvasFrame(){
    let canvasFrame = this.getCanvasFrame();
    let canvasContainer = this.getCanvasContainer();
    let canvasContainerDimensions = canvasContainer.getBoundingClientRect();
    let containerCenter = {x: canvasContainerDimensions.width / 2, y: canvasContainerDimensions.height / 2};
    let canvasFrameDimensions = canvasFrame.getBoundingClientRect();
    let canvasFrameHalves = {x: canvasFrameDimensions.width / 2, y: canvasFrameDimensions.height / 2};
    canvasFrame.style.top = `${containerCenter.y - canvasFrameHalves.y}px`
    canvasFrame.style.left = `${containerCenter.x - canvasFrameHalves.x}px`
  }

  moveCanvasFrame(mousePos: XY){
    let canvasFrame = this.getCanvasFrame();
    let canvasContainer = this.getCanvasContainer();
    let canvasContainerDimensions = canvasContainer.getBoundingClientRect();
    let canvasFrameDimensions = canvasFrame.getBoundingClientRect();
    if(this.canvasFrameSnapshot == null)
      this.canvasFrameSnapshot = {
        x: canvasFrameDimensions.x - canvasContainerDimensions.x,
        y: canvasFrameDimensions.y - canvasContainerDimensions.y
      };
    if(this.mouseSnapshot == null)
      this.mouseSnapshot = {
        x: (mousePos.x - canvasContainerDimensions.x),
        y: (mousePos.y - canvasContainerDimensions.y)
      };
    let mouseDistanceFromMouseSnapshot = {
      x: (mousePos.x - canvasContainerDimensions.x) - this.mouseSnapshot.x,
      y: (mousePos.y - canvasContainerDimensions.y) - this.mouseSnapshot.y
    };
    canvasFrame.style.top = `${(this.canvasFrameSnapshot.y + mouseDistanceFromMouseSnapshot.y)}px`;
    canvasFrame.style.left = `${this.canvasFrameSnapshot.x + mouseDistanceFromMouseSnapshot.x}px`
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

  resetMouseSnapshot(){
    this.mouseSnapshot = null;
  }

  resetCanvasFrameSnapshot(){
    this.canvasFrameSnapshot = null;
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
    let canvasContainer = this.podDocComp.DOCUMENT_ACTIONS.getCanvasContainer();
    let canvasFrame = this.podDocComp.DOCUMENT_ACTIONS.getCanvasFrame();
    let canvasContainerDimensions = canvasContainer.getBoundingClientRect();
    let canvasFrameDimensions = canvasFrame.getBoundingClientRect();
    if(canvasFrameDimensions.width < canvasContainerDimensions.width && canvasFrameDimensions.height < canvasContainerDimensions.height) 
      this.podDocComp.DOCUMENT_ACTIONS.centerCanvasFrame();
    this.setLastMousePosition(currentMousePos);
  }

  setLastMousePosition(lastMousePosition: XY){
    this.lastMousePosition = lastMousePosition;
  }
}


