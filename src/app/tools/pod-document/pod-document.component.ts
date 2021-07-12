import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FeatureInfo, PodFeatures } from 'src/app/pages/pod/pod.component';
import { GlobalEvents, HotKey } from '../classes/global-events';
import { MouseUtilities } from '../classes/mouse-events-utlility-functions';
import { ImageDimenions, Layer, PodDocument } from '../classes/pod-document';
import { Vector2D } from '../classes/vectors';
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

  selectedPodFeature: PodFeatures = null;
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
    this.RENDER_ACTIONS.setDrawPoint({x: ev.x, y: ev.y});
    if(this.state == PodDocumentState.MOVE) {

    } else {
      switch(this.selectedPodFeature) {
        case PodFeatures.ZOOM: this.state = PodDocumentState.ZOOM; this.ZOOM_ACTIONS.setLastMousePosition({x: ev.x, y: ev.y}); break;
        case PodFeatures.BRUSH: 
          this.state = PodDocumentState.EDIT; 
          this.RENDER_ACTIONS.drawOnDrawCanvas({x: ev.x, y: ev.y}); 
          break;
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
   this.RENDER_ACTIONS.drawOnDrawCanvas({x: ev.x, y: ev.y});
  }

  /**Calculates the mouse position relative to the DOM element*/
  calculateMousePositionOn(element: HTMLElement, mousePos: Vector2D) {
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


export class RenderActions {

  podDocComp: PodDocumentComponent;
  activeLayer: Layer = null;
  drawPoint: Vector2D;
  imageDimensions: ImageDimenions = {xAxis: null, yAxis: null, w: 0, h: 0};
  constructor(podDocComp: PodDocumentComponent){
    this.podDocComp = podDocComp;
  }

  drawOnDrawCanvas(mousePos: Vector2D){
    let drawCanvas = this.getDrawCanvas();
    let currentMousePos = this.podDocComp.calculateMousePositionOn(drawCanvas, mousePos);
    let utensil = drawCanvas.getContext("2d");
    let distanceX = Math.abs(currentMousePos.x - this.drawPoint.x); 
    let distanceY = Math.abs(currentMousePos.y - this.drawPoint.y);
    let utensilSize = this.podDocComp.FEATURE_INFO.getUtensilSize(this.podDocComp.selectedPodFeature);
    if((distanceX > utensilSize / 5) || (distanceY > utensilSize / 5) || distanceX == 0 || distanceY == 0) {
      utensil.beginPath();
      utensil.lineWidth = utensilSize;
      utensil.strokeStyle = `rgb(${this.podDocComp.FEATURE_INFO.getBrushColor().r}, ${this.podDocComp.FEATURE_INFO.getBrushColor().g}, ${this.podDocComp.FEATURE_INFO.getBrushColor().b})`;
      utensil.lineCap = "round";
      utensil.moveTo(this.drawPoint.x, this.drawPoint.y);
      utensil.lineTo(currentMousePos.x, currentMousePos.y);
      utensil.stroke();
      this.drawPoint = currentMousePos;
      this.activeLayer.drawPoints.push(
        {
          mousePos: this.drawPoint, 
          fill: {r: this.podDocComp.FEATURE_INFO.getBrushColor().r, g: this.podDocComp.FEATURE_INFO.getBrushColor().g, b: this.podDocComp.FEATURE_INFO.getBrushColor().b}
        }
      );
    }
   
    /*let drawCanvas = this.getDrawCanvas();
    let currentMousePos = this.podDocComp.calculateMousePositionOn(drawCanvas, mousePos);
    this.calculateImageDimensions();
    let utensil = drawCanvas.getContext("2d");
    utensil.beginPath();
    utensil.lineWidth = this.podDocComp.FEATURE_INFO.getUtensilSize(this.podDocComp.selectedPodFeature);
    utensil.strokeStyle = `rgb(${this.podDocComp.FEATURE_INFO.getBrushColor().r}, ${this.podDocComp.FEATURE_INFO.getBrushColor().g}, ${this.podDocComp.FEATURE_INFO.getBrushColor().b})`;
    utensil.lineCap = "round";
    utensil.moveTo(this.drawPoint.x, this.drawPoint.y);
    utensil.lineTo(currentMousePos.x, currentMousePos.y);
    utensil.stroke();
    this.drawPoint = currentMousePos;*/
  }

  calculateImageDimensions() {
    let utensilSize = this.podDocComp.FEATURE_INFO.getUtensilSize(this.podDocComp.selectedPodFeature);
    let xAxis_x1 = this.drawPoint.x - (utensilSize/2);
    let xAxis_x2 = this.drawPoint.x + (utensilSize/2);
    let yAxis_y1 = this.drawPoint.y - (utensilSize/2);
    let yAxis_y2 = this.drawPoint.y + (utensilSize/2);

    if(this.imageDimensions.xAxis == null) {
      this.imageDimensions.xAxis = {x1: 0, x2: 0};
      this.imageDimensions.xAxis.x1 = this.imageDimensions.xAxis.x2 = this.drawPoint.x;
    } 

    if(this.imageDimensions.yAxis == null) {
      this.imageDimensions.yAxis = {y1: 0, y2: 0};
      this.imageDimensions.yAxis.y1 = this.imageDimensions.yAxis.y2 = this.drawPoint.y;
    }
    let newImageX1 = this.imageDimensions.xAxis.x1 > xAxis_x1? xAxis_x1: this.imageDimensions.xAxis.x1;
    let newImageX2 = this.imageDimensions.xAxis.x2 < xAxis_x2? xAxis_x2: this.imageDimensions.xAxis.x2;
    let newImageY1 = this.imageDimensions.yAxis.y1 > yAxis_y1? yAxis_y1: this.imageDimensions.yAxis.y1;
    let newImageY2 = this.imageDimensions.yAxis.y2 < yAxis_y2? yAxis_y2: this.imageDimensions.yAxis.y2;
    let w = Math.abs(newImageX2 - newImageX1);
    let h = Math.abs(newImageY2 - newImageY1);
    this.imageDimensions = {xAxis: {x1: newImageX1, x2: newImageX2}, yAxis: {y1: newImageY1, y2: newImageY2}, w, h};
  }

  saveImageToActiveLayer(){
    if(this.activeLayer == null ||
      this.imageDimensions.xAxis == null ||
      this.imageDimensions.yAxis == null ||
      this.imageDimensions.w <= 0 ||
      this.imageDimensions.h <= 0) return;
    var canvas = document.createElement('canvas');
    canvas.width = this.imageDimensions.w;
    canvas.height = this.imageDimensions.h;
    canvas.getContext('2d').drawImage(
      this.getDrawCanvas(),
      this.imageDimensions.xAxis.x1,
      this.imageDimensions.yAxis.y1,
      this.imageDimensions.w,
      this.imageDimensions.h,
      0, 0, this.imageDimensions.w, this.imageDimensions.h);
    let src = canvas.toDataURL()
    this.activeLayer.addImage(src, this.imageDimensions);
    this.imageDimensions = {xAxis: null, yAxis: null, w: 0, h: 0};
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
    /*let topCanvas = this.getTopCanvas();
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
    }*/
  }

  clearCanvas(canvas: HTMLCanvasElement) {
    const utensil = canvas.getContext('2d');
    utensil.clearRect(0, 0, canvas.width, canvas.height);
  }

  drawLayersOn(canvas: HTMLCanvasElement, layer: Layer){
    let utensil = canvas.getContext("2d"); 
    let lastPoint = {x: 0, y: 0};
    for(let i = 0; i < layer.drawPoints.length; i++) {
      if(i > 0) lastPoint = layer.drawPoints[i - 1].mousePos;
      else lastPoint = layer.drawPoints[i].mousePos;

      utensil.beginPath();
      utensil.lineWidth = this.podDocComp.FEATURE_INFO.getUtensilSize(this.podDocComp.selectedPodFeature);
      utensil.strokeStyle = `rgb(${this.podDocComp.FEATURE_INFO.getBrushColor().r}, ${this.podDocComp.FEATURE_INFO.getBrushColor().g}, ${this.podDocComp.FEATURE_INFO.getBrushColor().b})`;
      utensil.lineCap = "round";
      utensil.moveTo(lastPoint.x, lastPoint.y);
      utensil.lineTo(layer.drawPoints[i].mousePos.x, layer.drawPoints[i].mousePos.y);
      utensil.stroke();
      utensil.closePath();
    }

    /*
    let utensil = canvas.getContext("2d"); 
    for(let image of layer.images) {
      utensil.drawImage(image.src, image.imageDimensions.xAxis.x1, image.imageDimensions.yAxis.y1);
    }
    */
      
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

  setDrawPoint(mousePos: Vector2D) {
    this.drawPoint = this.podDocComp.calculateMousePositionOn(
      this.getDrawCanvas(), mousePos
    );
  }
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




