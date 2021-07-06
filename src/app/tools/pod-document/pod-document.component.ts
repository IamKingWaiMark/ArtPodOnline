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
    if (isPlatformBrowser(this.platform)) {
      this.subscribeToActivePodDocument();
      this.subscribeToPodFeatures();
      this.subscribeToGlobalEvents();
    }
  }

  subscribeToActivePodDocument() {
    this.activePodDocumentSubscription.subscribe(
      podDocument => {
        if (!podDocument) return;
        this.___setupDocument(podDocument);

      }
    );
  }

  ___setupDocument(podDocument: PodDocument) {
    let canvasFrame = <HTMLDivElement>document.getElementById("pod-document-canvas-frame");
    let frameWidth = podDocument.metaData.podPreset.w * podDocument.metaData.podPreset.ppi;
    let frameHeight = podDocument.metaData.podPreset.h * podDocument.metaData.podPreset.ppi;
    canvasFrame.style.width = `${frameWidth}px`
    canvasFrame.style.height = `${frameHeight}px`
  }




  subscribeToPodFeatures() {
    this.selectedPodFeatureSubscription.subscribe(
      (feature: PodFeatures) => {
        this.selectedPodFeature = feature;
        this.changeCursor(feature);
      }
    );
  }
  subscribeToGlobalEvents() {
    this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.subscribe(
      (hotKey: HotKey) => {

      }
    );
  }

  changeCursor(feature: PodFeatures) {
    switch (feature) {
      case PodFeatures.MOVE: this.CURSOR_GENERATOR.resetPodCursor(); break;
      case PodFeatures.BRUSH: this.CURSOR_GENERATOR.genRoundCusor(); break;
      case PodFeatures.ERASER: this.CURSOR_GENERATOR.genRoundCusor(); break;
    }
  }


  CANVAS_CONTAINER_onMouseMove(ev: MouseEvent) {
    switch (this.selectedPodFeature) {
      case PodFeatures.BRUSH: this.CURSOR_GENERATOR.moveRoundCursor(ev, this.FEATURE_INFO, this.selectedPodFeature); break;
      case PodFeatures.ERASER: this.CURSOR_GENERATOR.moveRoundCursor(ev, this.FEATURE_INFO, this.selectedPodFeature); break;
    }
  }
  CANVAS_CONTAINER_onMouseOut(ev: MouseEvent) {
    this.CURSOR_GENERATOR.hideCursor();
  }
  CANVAS_CONTAINER_onMouseDown(ev: MouseEvent) {
    let canvas = <HTMLCanvasElement>document.querySelector(".test-canvas");
    console.log(canvas.width + ", " + canvas.height);
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.shadowColor = "black";

    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;
    ctx.shadowColor = "orange";
    var image2 = new Image();
    image2.src = "assets/codieble_256.png";
    ctx.drawImage(image2, 0, 0);
    ctx.moveTo(100, 150);
    ctx.lineTo(450, 50);
    ctx.lineWidth = 10;

    // set line color
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();
  }
  CANVAS_CONTAINER_onMouseUp(ev: MouseEvent) {

  }

  CANVAS_FRAME_onMouseMove(ev: MouseEvent) {

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




}


export class CursorGenerator {

  moveRoundCursor(ev: MouseEvent, FEATURE_INFO: FeatureInfo, selectedPodFeature: PodFeatures) {
    if (selectedPodFeature == null) return;
    let podCursor = this.getPodCusror();
    this.showCursor();
    let canvasContainer = this.getCanvasContainer();
    let circumference = this.getCurrentFeatureValue(FEATURE_INFO, selectedPodFeature);
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
    let canvasContainer = this.getCanvasContainer();
    podCursor.style.visibility = "hidden";
    canvasContainer.style.cursor = "context-menu";
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