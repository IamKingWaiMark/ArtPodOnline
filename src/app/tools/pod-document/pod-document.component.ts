import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FeatureInfo } from '../classes/feature-info';
import { GlobalEvents, HotKey } from '../classes/global-events';
import { MouseUtilities } from '../classes/mouse-events-utlility-functions';
import { DrawPoint, Layer, PodDocument } from '../classes/pod-document';
import { Vector2D } from '../classes/vectors';
import { PodFeature } from '../enums/pod-feature';
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
  @Input() selectedPodFeatureSubscription: BehaviorSubject<PodFeature>;
  @Input() FEATURE_INFO: FeatureInfo;
  @Input() GLOBAL_EVENTS: GlobalEvents;
  @Input() activeLayerSubscription: BehaviorSubject<Layer>;


  CURSOR_ACTIONS: CursorActions = null; 
  DOCUMENT_ACTIONS: PodDocumentActions = null;
  SAVE_ACTIONS: PodDocumentSaveActions = null;
  ZOOM_ACTIONS: ZoomActions = null;
  RENDER_ACTIONS: RenderActions = null;


  mouseUtilities = new MouseUtilities();

  state: PodDocumentState = null;
  stateSubscription = new BehaviorSubject<PodDocumentState>(this.state);
  previousState: PodDocumentState = null;

  selectedPodFeature: PodFeature = null;
  activePodDocument: PodDocument = null;
 


  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.CURSOR_ACTIONS = new CursorActions(this);
      this.DOCUMENT_ACTIONS = new PodDocumentActions(this);
      this.SAVE_ACTIONS = new PodDocumentSaveActions();
      this.ZOOM_ACTIONS = new ZoomActions(this); 
      this.RENDER_ACTIONS = new RenderActions(this);
      this.subscribeToActiveLayer();
      this.subscribeToDocumentStates();
      this.subscribeToPodFeatures();
      this.subscribeToGlobalEvents();
      this.subscribeToActivePodDocument();
      
    }
  }

  subscribeToActiveLayer(){
    this.activeLayerSubscription.subscribe(
      layer => {
        this.RENDER_ACTIONS.activeLayer = layer;
        this.RENDER_ACTIONS.render();
      }
    );
  }

  subscribeToActivePodDocument() {
    this.activePodDocumentSubscription.subscribe(
      podDocument => {
        this.activePodDocument = podDocument;
        if (!podDocument) return;
        this.DOCUMENT_ACTIONS.setupDocument(podDocument);
        
      }
    );
  }

  subscribeToDocumentStates(){
    this.stateSubscription.subscribe(
      state => {
        if(state == null) this.RENDER_ACTIONS.render();
        this.CURSOR_ACTIONS.overrideCursor(state, this.selectedPodFeature);
      }
    );
  }

  subscribeToPodFeatures() {
    this.selectedPodFeatureSubscription.subscribe(
      (feature: PodFeature) => {
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
        this.setState(null);
        //this.RENDER_ACTIONS.saveImageToActiveLayer();
      }
    );
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_DOWN_EVENT.subscribe(
      (ev: MouseEvent) => {

      }
    );
  }
  
  CANVAS_CONTAINER_onMouseDown(ev: MouseEvent) {
    

    if(this.state == PodDocumentState.MOVE) {

    } else {
      switch(this.selectedPodFeature) {
        case PodFeature.ZOOM: this.state = PodDocumentState.ZOOM; this.ZOOM_ACTIONS.setLastMousePosition({x: ev.x, y: ev.y}); break;
        case PodFeature.BRUSH: 
          this.state = PodDocumentState.EDIT; 
          this.RENDER_ACTIONS.setAction({x: ev.x, y: ev.y});
          this.RENDER_ACTIONS.onDraw({x: ev.x, y: ev.y}); 
          break;
        case PodFeature.ERASER: this.state = PodDocumentState.EDIT; break;
      }
    }
  }
  CANVAS_CONTAINER_onMouseMove(ev: MouseEvent) {
    this.CURSOR_ACTIONS.onMouseMove(ev);
    if(this.state == PodDocumentState.MOVE) {
      this.DOCUMENT_ACTIONS.moveCanvasFrame({x: ev.x, y: ev.y});
    } else {
      switch(this.selectedPodFeature) {
        case PodFeature.ZOOM: if(this.state != PodDocumentState.ZOOM) return; this.ZOOM_ACTIONS.zoom(ev); break;
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
   this.RENDER_ACTIONS.onDraw({x: ev.x, y: ev.y});
  }

  /**Calculates the mouse position relative to the DOM element*/
  calculateMousePositionOn(element: HTMLElement, mousePos: Vector2D) {
    let elementDimensions = element.getBoundingClientRect();
    let zoomScale = this.activePodDocument.getZoomScale();
    let documentScale = this.activePodDocument.getDocumentScale();
    let scale = zoomScale / documentScale;
    return { 
      x: (mousePos.x - elementDimensions.x) / scale, 
      y: (mousePos.y - elementDimensions.y) / scale };
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


export class RenderActions {

  podDocComp: PodDocumentComponent;
  activeLayer: Layer = null;

  constructor(podDocComp: PodDocumentComponent){
    this.podDocComp = podDocComp;
  }

  onDraw(mousePos: Vector2D){
    let drawCanvas = this.getDrawCanvas();
    let calculatedMousePos = this.podDocComp.calculateMousePositionOn(drawCanvas, mousePos);
    this.activeLayer.getCurrentAction().onDraw(this.getDrawCanvas(), calculatedMousePos);
  }
  setAction(mousePos: Vector2D) {
    let data: any = null;
    let calculatedMousePos = this.podDocComp.calculateMousePositionOn(this.getDrawCanvas(), mousePos);

    let documentScale = this.podDocComp.activePodDocument.getDocumentScale();
    
    switch(this.podDocComp.selectedPodFeature) {
      case PodFeature.BRUSH:
        let utensilSize = this.podDocComp.FEATURE_INFO.getBrushSize() * documentScale;
        data = <DrawPoint>{
          mousePos: calculatedMousePos,
          fill: this.podDocComp.FEATURE_INFO.getBrushColor(),
          utensilSize: utensilSize
        };
        break;
    }
    this.activeLayer.setAction(this.podDocComp.selectedPodFeature, data)
  }
  render(){
    let topCanvas = this.getTopCanvas();
    let drawCanvas = this.getDrawCanvas();
    let bottomCanvas = this.getBottomCanvas();
    this.clearCanvas(topCanvas);
    this.clearCanvas(drawCanvas);
    this.clearCanvas(bottomCanvas);
    let bottomLayer = true;
    if(!this.podDocComp.activePodDocument) return;
    for(let i = this.podDocComp.activePodDocument.getLayers().length - 1; i >= 0; i--) {
      let layer = this.podDocComp.activePodDocument.getLayers()[i];
      if(layer == this.activeLayer) {
        bottomLayer = false;
      }
      if(bottomLayer) {
        this.drawLayersOn(bottomCanvas, layer);
      } else if (layer == this.activeLayer) {
        this.drawLayersOn(drawCanvas, layer);
      } else {
        this.drawLayersOn(topCanvas, layer);
      }
    }
  }

  clearCanvas(canvas: HTMLCanvasElement) {
    const utensil = canvas.getContext('2d');
    utensil.clearRect(0, 0, canvas.width, canvas.height);
  }

  drawLayersOn(canvas: HTMLCanvasElement, layer: Layer){
    for(let action of layer.actions) {
      action.render(canvas);
    } 
  }

  getDrawCanvas(){
    return <HTMLCanvasElement>document.querySelector(".draw-canvas");
  }
  getBottomCanvas(){
    return <HTMLCanvasElement>document.querySelector(".bottom-canvas");
  }
  getTopCanvas(){
    return <HTMLCanvasElement>document.querySelector(".top-canvas");
  }


}

export class CursorActions {
  podDocComp: PodDocumentComponent;
  constructor(podDocComp: PodDocumentComponent){
    this.podDocComp = podDocComp;
  }
  changeCursor(feature: PodFeature) {
    switch (feature) {
      case PodFeature.MOVE: this.genMoveFeatureCursor(); break;
      case PodFeature.BRUSH: this.genRoundCusor(); break;
      case PodFeature.ERASER: this.genRoundCusor(); break;
      case PodFeature.ZOOM: this.genZoomFeatureCursor(); break;
    }
  }

  overrideCursor(state: PodDocumentState, selectedFeature: PodFeature){

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
      case PodFeature.BRUSH: this.moveRoundCursor(ev); break;
      case PodFeature.ERASER: this.moveRoundCursor(ev); break;
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

  getCurrentFeatureValue(FEATURE_INFO: FeatureInfo, selectedPodFeature: PodFeature) {
    switch (selectedPodFeature) {
      case PodFeature.BRUSH: return FEATURE_INFO.getBrushSize();
      case PodFeature.ERASER: return FEATURE_INFO.getEraserSize();
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
  mouseSnapshot: Vector2D;
  canvasFrameSnapshot: Vector2D;
  
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
    let bottomCanvas = this.podDocComp.RENDER_ACTIONS.getBottomCanvas();
    let drawCanvas = this.podDocComp.RENDER_ACTIONS.getDrawCanvas();
    let topCanvas = this.podDocComp.RENDER_ACTIONS.getTopCanvas();
    bottomCanvas.width = drawCanvas.width = topCanvas.width = frameWidth;
    bottomCanvas.height = drawCanvas.height = topCanvas.height = frameHeight;
    this.podDocComp.activePodDocument.setDocumentScale(scale);
    this.podDocComp.activePodDocument.setZoomScale(scale);
    this.podDocComp.activeLayerSubscription.next(this.podDocComp.activePodDocument.addLayer(0));
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

  moveCanvasFrame(mousePos: Vector2D){
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
  lastMousePosition: Vector2D;
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

  setLastMousePosition(lastMousePosition: Vector2D){
    this.lastMousePosition = lastMousePosition;
  }
}




