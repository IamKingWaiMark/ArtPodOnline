import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FeatureInfo, PodFeatures } from 'src/app/pages/pod/pod.component';
import { GlobalEvents, HotKey } from '../classes/global-events';
import { PodDocument } from '../classes/pod-document';

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
  selectedPodFeature: PodFeatures;

  readonly CURSOR_GENERATOR = new CursorGenerator();

  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platform)) {
      this.subscribeToActivePodDocument();
      this.subscribeToPodFeatures();
      this.subscribeToGlobalEvents();
    }
  }

  subscribeToActivePodDocument(){
    this.activePodDocumentSubscription.subscribe(
      podDocument => {
        if(!podDocument) return;

      }
    );
  }
  subscribeToPodFeatures(){
    this.selectedPodFeatureSubscription.subscribe(
      (feature: PodFeatures) => {
        this.selectedPodFeature = feature;
        this.changeCursor(feature);
      }
    );
  }
  subscribeToGlobalEvents(){
    this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.subscribe(
      (hotKey: HotKey) => {
        
      }
    );
  }

  changeCursor(feature: PodFeatures) {
    switch(feature) {
      case PodFeatures.MOVE: this.CURSOR_GENERATOR.resetPodCursor(); break;
      case PodFeatures.BRUSH: this.CURSOR_GENERATOR.genRoundCusor(); break;
      case PodFeatures.ERASER: this.CURSOR_GENERATOR.genRoundCusor(); break;
    }
  }

  /*createPodInitialLayer(podDocument: PodDocument){
    let documentMetaData = podDocument.metaData;
    let w = documentMetaData.podPreset.w * documentMetaData.podPreset.ppi;
    let h = documentMetaData.podPreset.h * documentMetaData.podPreset.ppi;
    this.createCanvas(w, h, {r: 255, g: 255, b: 255, a: 1}, {left: 8, top: 8});
  }

  clearCanvasContainer(){
    let layerContainer = this.getLayerContainer();
    while (layerContainer.firstChild) {
      layerContainer.removeChild(layerContainer.firstChild);
    }
  }

  createCanvas(w: number, h: number, bgColor: {r: number, g: number, b: number, a: number}, location: {left: number, top: number}){
    let canvasContainer = this.getLayerContainer();
    let canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.style.backgroundColor = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${bgColor.a})`;
    canvas.style.position = "absolute";
    canvas.style.left = `${location.left}px`;
    canvas.style.top = `${location.top}px`;
    canvasContainer.append(canvas);
  }*/

  CANVAS_CONTAINER_onMouseMove(ev: MouseEvent){
    switch(this.selectedPodFeature) {
      case PodFeatures.BRUSH: this.CURSOR_GENERATOR.moveRoundCursor(ev, this.FEATURE_INFO, this.selectedPodFeature); break;
      case PodFeatures.ERASER: this.CURSOR_GENERATOR.moveRoundCursor(ev, this.FEATURE_INFO, this.selectedPodFeature); break;
    }
  }
  CANVAS_CONTAINER_onMouseOut(ev: MouseEvent){
    this.CURSOR_GENERATOR.hideCursor();
  }
  
  CONTENT_CONTAINER_onMouseDown(ev: MouseEvent) {
    switch(ev.button) {
      case 2 /* Right Click */: 
        this.FEATURE_INFO.setShouldShowContextMenu(true); 
        this.FEATURE_INFO.setMouseX(ev.x); 
        this.FEATURE_INFO.setMouseY(ev.y);
      break;
    }
  }

}


export class CursorGenerator {
  
  moveRoundCursor(ev: MouseEvent, FEATURE_INFO: FeatureInfo, selectedPodFeature: PodFeatures){
    if(selectedPodFeature == null) return;
    let podCursor = this.getPodCusror();
    this.showCursor();
    let canvasContainer = this.getCanvasContainer();
    let circumference = this.getCurrentFeatureValue(FEATURE_INFO, selectedPodFeature);
    podCursor.style.left = `${this.centerPodCursorToMouseX(ev, canvasContainer, circumference)}px`;
    podCursor.style.top = `${this.centerPodCursorToMouseY(ev, canvasContainer, circumference)}px`;
    podCursor.style.width = `${circumference}px`;
    podCursor.style.height = `${circumference}px`;
  }

  getCurrentFeatureValue(FEATURE_INFO: FeatureInfo, selectedPodFeature: PodFeatures){
    switch(selectedPodFeature) {
      case PodFeatures.BRUSH: return FEATURE_INFO.getBrushSize();
      case PodFeatures.ERASER: return FEATURE_INFO.getEraserSize();
    }
  }

  centerPodCursorToMouseX(ev: MouseEvent, canvasContainer:HTMLDivElement, circleSize: number) {
    return ev.x - canvasContainer.getBoundingClientRect().x - (circleSize / 2);
  }
  centerPodCursorToMouseY(ev: MouseEvent, canvasContainer:HTMLDivElement,  circleSize: number) {
    return ev.y - canvasContainer.getBoundingClientRect().y -(circleSize / 2);
  }

  genRoundCusor(){
    this.hideDefaultCursor();
    let podCursor = this.getPodCusror();
    podCursor.draggable = false;
    podCursor.style.border = "1px solid white";
    podCursor.style.borderRadius = "50%";
  }

  showCursor(){
    this.getPodCusror().style.visibility = "visible";
  }
  hideCursor(){
    this.getPodCusror().style.visibility = "hidden";
  }


  resetPodCursor() {
    let podCursor = this.getPodCusror();
    let canvasContainer = this.getCanvasContainer();
    podCursor.style.visibility = "hidden";
    canvasContainer.style.cursor = "context-menu";
  }
  
  hideDefaultCursor(){
    this.getCanvasContainer().style.cursor = "none";
  }

  getCanvasContainer() {
    return <HTMLDivElement>document.querySelector(".pod-document-content-canvas-container");
  }
  getPodCusror(){
    return <HTMLDivElement>document.getElementById("pod-document-cursor");
  }
}