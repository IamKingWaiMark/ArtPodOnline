import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FeatureInfo } from '../classes/feature-info';
import { GlobalEvents, HotKey } from '../classes/global-events';
import { MouseUtilities } from '../classes/mouse-events-utlility-functions';
import { Layer, PodDocument } from '../classes/pod-document';
import { Vector2D } from '../classes/vectors';
import { PodDocumentState } from '../enums/pod-document-state';
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
  @Input() activeLayerSubscription: BehaviorSubject<Layer>;
  @Input() FEATURE_INFO: FeatureInfo;
  @Input() GLOBAL_EVENTS: GlobalEvents;

  CURSOR_ACTIONS: CursorActions = null; 
  DOCUMENT_ACTIONS: PodDocumentActions = null;
  SAVE_ACTIONS: PodDocumentSaveActions = null;
  ZOOM_ACTIONS: ZoomActions = null;
  RENDER_ACTIONS: RenderActions = null;
  GLOBAL_MOUSE_POS: Vector2D = {x: 0, y: 0};
  mouseUtilities = new MouseUtilities();
  documentState: PodDocumentState = null;
  stateSubscription = new BehaviorSubject<PodDocumentState>(this.documentState);
  previousState: PodDocumentState = null;
  selectedPodFeature: PodFeature = null;
  activePodDocument: PodDocument = null;

  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.ZOOM_ACTIONS = new ZoomActions(this);
      this.RENDER_ACTIONS = new RenderActions(this);
      this.DOCUMENT_ACTIONS = new PodDocumentActions(this);
      this.CURSOR_ACTIONS = new CursorActions(this);
      this.SAVE_ACTIONS = new PodDocumentSaveActions();
      
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
        this.activePodDocument?.setActiveLayer(layer);
        this.RENDER_ACTIONS.render();   
      }
    );
  }

  subscribeToActivePodDocument() {
    this.activePodDocumentSubscription.subscribe(
      podDocument => {
        this.activePodDocument = podDocument;
        if (!podDocument) return;
        this.DOCUMENT_ACTIONS.setupDocument();
      }
    );
  }

  subscribeToDocumentStates(){
    this.stateSubscription.subscribe(
      state => {
        this.CURSOR_ACTIONS.onMouseMove(state, this.selectedPodFeature, this.GLOBAL_MOUSE_POS);
      }
    );
  }

  subscribeToPodFeatures() {
    this.selectedPodFeatureSubscription.subscribe(
      (feature: PodFeature) => {
        this.selectedPodFeature = feature;

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
        this.ZOOM_ACTIONS.stopZooming(); 
        this.RENDER_ACTIONS.setShouldEdit(false);
        this.RENDER_ACTIONS.render();
      }
    );
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_DOWN_EVENT.subscribe(
      (ev: MouseEvent) => {
        this.GLOBAL_MOUSE_POS.x = ev.x;
        this.GLOBAL_MOUSE_POS.y = ev.y;

        if(this.mouseIsIn() && this.activePodDocument) {
          switch(ev.button) {
            case 0: this.onMouseDown_leftClick(); break;
            case 2: this.onMouseDown_RightClick(); break;
          }
        }

      }
    );
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_MOVE_EVENT.subscribe(
      (ev: MouseEvent) => {
        this.GLOBAL_MOUSE_POS.x = ev.x;
        this.GLOBAL_MOUSE_POS.y = ev.y;
        if(this.mouseIsIn() && this.activePodDocument) {
          this.CURSOR_ACTIONS.onMouseMove(this.documentState, this.selectedPodFeature, this.GLOBAL_MOUSE_POS);
        
          if(this.documentState) {
  
          } else {
            switch(this.selectedPodFeature) {
              case PodFeature.ZOOM: this.ZOOM_ACTIONS.onMouseMove(); break;
              case PodFeature.BRUSH: 
                if(!this.RENDER_ACTIONS.getShouldEdit()) return;
                this.activePodDocument.getActiveLayer().getCurrentAction()?.onDraw(
                  this.RENDER_ACTIONS.getDrawCanvas(),
                  this.GLOBAL_MOUSE_POS,
                  this.activePodDocument
                );
                break;
            }
          }
        } else {
          this.CURSOR_ACTIONS.hideCursor();
          this.ZOOM_ACTIONS.stopZooming();
          this.RENDER_ACTIONS.render();
        }

      }
    );
    this.GLOBAL_EVENTS.GLOBAL_WINDOW_RESIZE.subscribe(
      (ev: UIEvent) => {
        this.DOCUMENT_ACTIONS.onCanvasContainerResize();
      }
    );
  }

  onMouseDown_leftClick(){
    if(this.FEATURE_INFO.getShouldShowContextMenu()) return;
    if(this.documentState) {

    } else {
      switch(this.selectedPodFeature) {
        case PodFeature.ZOOM: this.ZOOM_ACTIONS.setStartingMousePos(); break;
        case PodFeature.BRUSH: 
          let canvasDimensions = this.RENDER_ACTIONS.getDrawCanvas().getBoundingClientRect();
          let offsetByScale = this.activePodDocument.getZoomScale() / this.activePodDocument.getInitialZoomScale();
          let lineOffset = {
            x: canvasDimensions.x + this.activePodDocument.getWorldPosition().x, 
            y: canvasDimensions.y + this.activePodDocument.getWorldPosition().y}
          let calculatedMousePos = {x: (this.GLOBAL_MOUSE_POS.x - lineOffset.x) / offsetByScale, y: (this.GLOBAL_MOUSE_POS.y- lineOffset.y) / offsetByScale}

          this.activePodDocument.getActiveLayer().setAction(
            this.selectedPodFeature, 
            {
            mousePos: calculatedMousePos,
            fill: this.FEATURE_INFO.getBrushColor(),
            utensilSize: this.FEATURE_INFO.getBrushSize()
            });
          this.activePodDocument.getActiveLayer().getCurrentAction()?.onDraw(
            this.RENDER_ACTIONS.getDrawCanvas(),
            this.GLOBAL_MOUSE_POS,
            this.activePodDocument
          );
          this.RENDER_ACTIONS.setShouldEdit(true);
          break;
      }
    }
  }
  onMouseDown_RightClick(){
    if(this.documentState) {

    } else {
      this.FEATURE_INFO.setShouldShowContextMenu(true);
      this.FEATURE_INFO.setMouseX(this.GLOBAL_MOUSE_POS.x);
      this.FEATURE_INFO.setMouseY(this.GLOBAL_MOUSE_POS.y);
    }
  }
  


  setState(state: PodDocumentState) {
    this.previousState = this.documentState;
    this.documentState = state;
    this.stateSubscription.next(this.documentState);
  }

  mouseIsIn(){
    let canvasContainer = this.RENDER_ACTIONS.getCanvasContainer();
    let canvasContainerDimensions = canvasContainer.getBoundingClientRect();
    let currentMousePos = this.GLOBAL_MOUSE_POS;
    if(currentMousePos.x > canvasContainerDimensions.x && currentMousePos.x < canvasContainerDimensions.x + canvasContainerDimensions.width &&
      currentMousePos.y > canvasContainerDimensions.y && currentMousePos.y < canvasContainerDimensions.y + canvasContainerDimensions.height) {
        return true;
    }
    return false;
  }


}

export class ZoomActions {
  private startingMousePos: Vector2D;
  private shouldZoom = false;
  podDocComp: PodDocumentComponent;
  startOfZoom: Date;
  constructor(podDocComp: PodDocumentComponent){
    this.podDocComp = podDocComp;
  }

  setStartingMousePos(){
    this.startingMousePos = {x: this.podDocComp.GLOBAL_MOUSE_POS.x, y: this.podDocComp.GLOBAL_MOUSE_POS.y};
    this.startOfZoom = new Date();
    this.shouldZoom = true;
    this.podDocComp.RENDER_ACTIONS.matchCanvasWithCanvasContainer();
    this.podDocComp.RENDER_ACTIONS.render();
  }

  onMouseMove(){
    if(!this.startingMousePos || !this.shouldZoom || !this.podDocComp.activePodDocument) return;


    let currentMousePos = this.podDocComp.GLOBAL_MOUSE_POS;
    let zoomScale = this.podDocComp.activePodDocument.getZoomScale();
    let zoomVal = 0.005;
    let zoomOffset = Math.abs(this.startingMousePos.x - currentMousePos.x);
    if(this.podDocComp.mouseUtilities.isGoingLeft(this.startingMousePos, currentMousePos)) {
      zoomScale = zoomScale - zoomVal * zoomOffset;
    } else {
      zoomScale = zoomScale + zoomVal * zoomOffset;
    }
    this.podDocComp.DOCUMENT_ACTIONS.scaleCanvasFrameContainer(zoomScale);
    this.podDocComp.DOCUMENT_ACTIONS.onCanvasContainerResize();
    this.startingMousePos = {x: currentMousePos.x, y: currentMousePos.y};


    let nowTime = new Date();
    let elapsed = nowTime.getTime() - this.startOfZoom.getTime();
    if(elapsed > 5) {
      this.startOfZoom = nowTime;
      this.podDocComp.RENDER_ACTIONS.render();
    }

  }

  stopZooming(){
    this.shouldZoom = false;
    this.podDocComp.RENDER_ACTIONS.matchCanvasWithCanvasFrameContainer();


  }
}

export class PodDocumentActions {

  podDocComp: PodDocumentComponent;
  constructor(podDocComp: PodDocumentComponent){
    this.podDocComp = podDocComp;
  }

  setupDocument(){
    this.scaleCanvasFrameContainer();
    this.podDocComp.RENDER_ACTIONS.matchCanvasWithCanvasFrameContainer();
    this.onCanvasContainerResize();
    let firstLayer = this.podDocComp.activePodDocument.addLayer(0);
    this.podDocComp.activeLayerSubscription.next(firstLayer);
  }

  scaleCanvasFrameContainer(customScale?: number){
    let activeDocument = this.podDocComp.activePodDocument;
    if(!activeDocument) return;
    let documentWidth = activeDocument.getWidth();
    let documentHeight = activeDocument.getHeight();
    let containerWidth = this.podDocComp.RENDER_ACTIONS.getCanvasContainerWidth();
    let containerHeight = this.podDocComp.RENDER_ACTIONS.getCanvasContainerHeight();
    let scale = customScale != null? customScale: 1;
    if(customScale == null) {
      if(documentWidth > documentHeight) {
        scale = containerWidth / documentWidth;
      } else {
        scale = containerHeight / documentHeight;
      }
      scale = scale > 1? 1: scale - (scale * 0.1);
    }
    scale = scale < 0.01? 0.01: scale;
    scale = scale > 10? 10: scale;
    activeDocument.setZoomScale(scale);
    activeDocument.setInitialZoomScale(scale);
    let canvasFrameContainer = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainer();

    let scaledDocumentWidth = documentWidth * scale;
    let scaledDocumentHeight = documentHeight * scale;
    scaledDocumentWidth = scaledDocumentWidth > containerWidth? containerWidth: scaledDocumentWidth;
    scaledDocumentHeight = scaledDocumentHeight > containerHeight? containerHeight: scaledDocumentHeight;

    canvasFrameContainer.style.width = `${scaledDocumentWidth}px`;
    canvasFrameContainer.style.height = `${scaledDocumentHeight}px`;
    
    
  }

  onCanvasContainerResize(){
    if(!this.podDocComp.activePodDocument) return;
    let canvasContainerWidth = this.podDocComp.RENDER_ACTIONS.getCanvasContainerWidth();
    let canvasContainerHeight= this.podDocComp.RENDER_ACTIONS.getCanvasContainerHeight();
    let canvasFrameContainerWidth = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainerWidth();
    let canvasFrameContainerHeight = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainerHeight();
    let canvasFrameContainer = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainer();
    let documentWidth = this.podDocComp.activePodDocument.getWidth() * this.podDocComp.activePodDocument.getZoomScale();
    let documentHeight = this.podDocComp.activePodDocument.getHeight() * this.podDocComp.activePodDocument.getZoomScale();

    if(canvasContainerWidth > documentWidth && canvasFrameContainerWidth < canvasContainerWidth) {
      this.centerCanvasFrameHorizontallyInCanvasContainer();
      canvasFrameContainer.style.width = `${documentWidth}px`;
    } else {
      canvasFrameContainer.style.left = `${0}px`;
      canvasFrameContainer.style.width = `${canvasContainerWidth}px`;
    }

    if(canvasContainerHeight > documentHeight && canvasFrameContainerHeight < canvasContainerHeight) {
      this.centerCanvasFrameVerticallInCanvasContainer();
      canvasFrameContainer.style.height = `${documentHeight}px`;
    }else {
      canvasFrameContainer.style.top = `${0}px`;
      canvasFrameContainer.style.height = `${canvasContainerHeight}px`;
    }
  }

  centerCanvasFrameVerticallInCanvasContainer(){
    let canvasContainerHeight= this.podDocComp.RENDER_ACTIONS.getCanvasContainerHeight();
    let canvasFrameContainerHeight= this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainerHeight();
    let canvasFrameContainer = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainer();
    let top = (canvasContainerHeight / 2) - (canvasFrameContainerHeight / 2);
    top = top < 0? 0: top;
    canvasFrameContainer.style.top = `${top}px`;
  }
  centerCanvasFrameHorizontallyInCanvasContainer(){
    let canvasContainerWidth = this.podDocComp.RENDER_ACTIONS.getCanvasContainerWidth();
    let canvasFrameContainerWidth = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainerWidth();
    let canvasFrameContainer = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainer();
    let left = (canvasContainerWidth / 2) - (canvasFrameContainerWidth / 2);
    left = left <0? 0: left;
    canvasFrameContainer.style.left = `${left}px`;
  }
}


export class RenderActions {
  podDocComp: PodDocumentComponent;
  private shouldEdit = false;
  constructor(podDocComp: PodDocumentComponent){
    this.podDocComp = podDocComp;
  }

  render(){

    let activeDocument = this.podDocComp.activePodDocument;
    if(!activeDocument) return;

    this.clearCanvas(this.getBottomCanvas());
    this.clearCanvas(this.getDrawCanvas());
    this.clearCanvas(this.getTopCanvas());


    let bottomLayer = true;
    for(let i = activeDocument.getLayers().length - 1; i >= 0; i--) {
      let currentLayer = activeDocument.getLayers()[i];
      
      if(currentLayer == activeDocument.getActiveLayer()) { // Draw on current layer
        for(let action of currentLayer.actions) {
          action.render(this.getDrawCanvas(), this.podDocComp.activePodDocument);
        }
        bottomLayer = false;

      } else if(bottomLayer) { // Draw on Bottom Layer
        for(let action of currentLayer.actions) {
          action.render(this.getBottomCanvas(), this.podDocComp.activePodDocument);
        }
      } else { // Draw on Top Layer
        for(let action of currentLayer.actions) {
          action.render(this.getTopCanvas(), this.podDocComp.activePodDocument);
        }
      }
    }
  }

  getCanvasContainer() {
    return <HTMLDivElement>document.querySelector(".pod-document-content-canvas-container");
  }
  getCanvasFrameContainer(){
    return <HTMLDivElement>document.querySelector(".canvas-frame-container");
  }
  getBottomCanvas(){
    return <HTMLCanvasElement>document.querySelector(".bottom-canvas");
  }
  getDrawCanvas(){
    return <HTMLCanvasElement>document.querySelector(".draw-canvas");
  }
  getTopCanvas(){ 
    return <HTMLCanvasElement>document.querySelector(".top-canvas");
  }

  getCanvasContainerWidth(){
    return this.getCanvasContainer()!.getBoundingClientRect().width;
  }
  getCanvasContainerHeight(){
    return this.getCanvasContainer()!.getBoundingClientRect().height;
  }

  getCanvasFrameContainerWidth(){
    return this.getCanvasFrameContainer().getBoundingClientRect().width;
  }
  getCanvasFrameContainerHeight(){
    return this.getCanvasFrameContainer().getBoundingClientRect().height;
  }

  setShouldEdit(shouldEdit: boolean){
    this.shouldEdit = shouldEdit;
  }

  getShouldEdit(){
    return this.shouldEdit;
  }

  clearCanvas(canvas: HTMLCanvasElement){
    let canvasDimensions = canvas.getBoundingClientRect();
    let utensil = canvas.getContext("2d");
    utensil.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
  }

  matchCanvasWithCanvasFrameContainer(){
    let bottomCanvas = this.getBottomCanvas();
    let drawCanvas = this.getDrawCanvas();
    let topCanvas = this.getTopCanvas();

    bottomCanvas.width = drawCanvas.width = topCanvas.width = this.getCanvasFrameContainerWidth();
    bottomCanvas.height = drawCanvas.height = topCanvas.height = this.getCanvasFrameContainerHeight();
  }

  matchCanvasWithCanvasContainer(){
    let bottomCanvas = this.getBottomCanvas();
    let drawCanvas = this.getDrawCanvas();
    let topCanvas = this.getTopCanvas();

    bottomCanvas.width = drawCanvas.width = topCanvas.width = this.getCanvasContainerWidth();
    bottomCanvas.height = drawCanvas.height = topCanvas.height = this.getCanvasContainerHeight();
  }

}


export class CursorActions {
  podDocComp: PodDocumentComponent;
  constructor(podDocComp: PodDocumentComponent){
    this.podDocComp = podDocComp;
  }

  private changeCursor(documentState: PodDocumentState, feature: PodFeature) {
    if(documentState) {
      switch(documentState) {
        case PodDocumentState.MOVE: this.genMoveDocumentCursor(); break;
      }
    } else {
      switch (feature) {
        case PodFeature.MOVE: this.genMoveFeatureCursor(); break;
        case PodFeature.BRUSH: this.genRoundCusor(); break;
        case PodFeature.ERASER: this.genRoundCusor(); break;
        case PodFeature.ZOOM: this.genZoomFeatureCursor(); break;
      }
    }
    
  }

  onMouseMove(documentState: PodDocumentState, feature: PodFeature, mousePos: Vector2D){
    this.changeCursor(documentState, feature);
    switch (this.podDocComp.selectedPodFeature) {
      case PodFeature.BRUSH: this.moveRoundCursor(mousePos); break;
      case PodFeature.ERASER: this.moveRoundCursor(mousePos); break;
    }
    if(this.podDocComp.documentState == PodDocumentState.MOVE) this.hideCursor();
  }
  private moveRoundCursor(mousePos: Vector2D) {
    if (this.podDocComp.selectedPodFeature == null) return;
    let podCursor = this.getPodCusror();
    this.showCursor();
    let canvasContainer = this.podDocComp.RENDER_ACTIONS.getCanvasContainer();
    let circumference = this.getCurrentFeatureValue(
      this.podDocComp.FEATURE_INFO, 
      this.podDocComp.selectedPodFeature) * this.podDocComp.activePodDocument.getZoomScale();
    podCursor.style.left = `${this.centerPodCursorToMouseX(mousePos, canvasContainer, circumference)}px`;
    podCursor.style.top = `${this.centerPodCursorToMouseY(mousePos, canvasContainer, circumference)}px`;
    podCursor.style.width = `${circumference}px`;
    podCursor.style.height = `${circumference}px`;
  }

  private getCurrentFeatureValue(FEATURE_INFO: FeatureInfo, selectedPodFeature: PodFeature) {
    switch (selectedPodFeature) {
      case PodFeature.BRUSH: return FEATURE_INFO.getBrushSize();
      case PodFeature.ERASER: return FEATURE_INFO.getEraserSize();
    }
  }

  private centerPodCursorToMouseX(mousePos: Vector2D, canvasContainer: HTMLDivElement, circleSize: number) {
    return mousePos.x - canvasContainer.getBoundingClientRect().x - (circleSize / 2);
  }
  private centerPodCursorToMouseY(mousePos: Vector2D, canvasContainer: HTMLDivElement, circleSize: number) {
    return mousePos.y - canvasContainer.getBoundingClientRect().y - (circleSize / 2);
  }

  private genRoundCusor() {
    this.hideDefaultCursor();
    let podCursor = this.getPodCusror();
    podCursor.draggable = false;
    podCursor.style.border = "1px solid white";
    podCursor.style.borderRadius = "50%";
  }

  private showCursor() {
    this.getPodCusror().style.visibility = "visible";
  }
  hideCursor() {
    this.getPodCusror().style.visibility = "hidden";
  }


  private resetPodCursor() {
    let podCursor = this.getPodCusror();
    podCursor.style.visibility = "hidden";
  }

  private genMoveFeatureCursor(){
    this.resetPodCursor();
    let canvasContainer = this.podDocComp.RENDER_ACTIONS.getCanvasContainer();
    canvasContainer.style.cursor = "context-menu";
  }
  private genZoomFeatureCursor(){
    this.resetPodCursor();
    let canvasContainer = this.podDocComp.RENDER_ACTIONS.getCanvasContainer();
    canvasContainer.style.cursor = "zoom-in";
  }
  private genMoveDocumentCursor(){
    this.resetPodCursor();
    let canvasContainer = this.podDocComp.RENDER_ACTIONS.getCanvasContainer();
    canvasContainer.style.cursor = "grab";
  }

  private hideDefaultCursor() {
    this.podDocComp.RENDER_ACTIONS.getCanvasContainer().style.cursor = "none";
  }

  getPodCusror() {
    return <HTMLDivElement>document.getElementById("pod-document-cursor");
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






/*
  CANVAS_CONTAINER_onMouseDown(ev: MouseEvent) {
    

    if(this.state == PodDocumentState.MOVE) {

    } else {
      switch(this.selectedPodFeature) {
        case PodFeature.ZOOM: this.state = PodDocumentState.ZOOM; break;
        case PodFeature.BRUSH: 
          this.state = PodDocumentState.EDIT; 
          break;
        case PodFeature.ERASER: this.state = PodDocumentState.EDIT; break;
      }
    }
  }
  CANVAS_CONTAINER_onMouseMove(ev: MouseEvent) {
    this.CURSOR_ACTIONS.onMouseMove(ev);
    if(this.state == PodDocumentState.MOVE) {
    } else {
      switch(this.selectedPodFeature) {
        case PodFeature.ZOOM: if(this.state != PodDocumentState.ZOOM) return; break;
      }
    }
  }
  CANVAS_CONTAINER_onMouseOut(ev: MouseEvent) {


  }


  CANVAS_CONTAINER_onMouseUp(ev: MouseEvent) {
    this.setState(null);
  }
  CONTENT_CONTAINER_onMouseDown(ev: MouseEvent) {
    switch (ev.button) {
      case 2 /* Right Click :
        this.FEATURE_INFO.setShouldShowContextMenu(true);
        this.FEATURE_INFO.setMouseX(ev.x);
        this.FEATURE_INFO.setMouseY(ev.y);
        break;
    }
  }

  
  CANVAS_FRAME_onMouseMove(ev: MouseEvent) {
   if (this.state != PodDocumentState.EDIT) return;

  }

*/