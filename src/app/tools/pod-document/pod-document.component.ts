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
  MOVE_ACTIONS: MoveActions = null;
  RENDER_ACTIONS: RenderActions = null;
  GLOBAL_MOUSE_POS: Vector2D = { x: 0, y: 0 };
  mouseUtilities = new MouseUtilities();
  documentState: PodDocumentState = null;
  stateSubscription = new BehaviorSubject<PodDocumentState>(this.documentState);
  previousState: PodDocumentState = null;
  selectedPodFeature: PodFeature = null;
  activePodDocument: PodDocument = null;

  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.MOVE_ACTIONS = new MoveActions(this);
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

  subscribeToActiveLayer() {
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

  subscribeToDocumentStates() {
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
          case HotKey.UNDO:
            this.activePodDocument?.undo();
            this.RENDER_ACTIONS.render();
            break;
          case HotKey.REDO:
            this.activePodDocument?.redo();
            this.RENDER_ACTIONS.render();
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
        this.MOVE_ACTIONS.stopMoving();
        this.RENDER_ACTIONS.setShouldEdit(false);
        this.RENDER_ACTIONS.render();
      }
    );
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_DOWN_EVENT.subscribe(
      (ev: MouseEvent) => {
        this.GLOBAL_MOUSE_POS.x = ev.x;
        this.GLOBAL_MOUSE_POS.y = ev.y;

        if (this.mouseIsIn() && this.activePodDocument) {
          switch (ev.button) {
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
        if (this.mouseIsIn() && this.activePodDocument) {
          this.CURSOR_ACTIONS.onMouseMove(this.documentState, this.selectedPodFeature, this.GLOBAL_MOUSE_POS);

          if (this.documentState) {
            switch (this.documentState) {
              case PodDocumentState.MOVE: this.MOVE_ACTIONS.onMouseMove(); break;
            }
          } else {
            switch (this.selectedPodFeature) {
              case PodFeature.ZOOM: this.ZOOM_ACTIONS.onMouseMove(); break;
              case PodFeature.BRUSH:
                if (!this.RENDER_ACTIONS.getShouldEdit()) return;
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
          this.MOVE_ACTIONS.stopMoving();
        }

      }
    );
    this.GLOBAL_EVENTS.GLOBAL_WINDOW_RESIZE.subscribe(
      (ev: UIEvent) => {
        this.DOCUMENT_ACTIONS.scaleCanvasFrameContainer(this.activePodDocument?.getZoomScale());
        this.DOCUMENT_ACTIONS.onCanvasContainerResize();
        this.RENDER_ACTIONS.matchCanvasWithCanvasFrameContainer();
        this.RENDER_ACTIONS.render();
      }
    );
  }

  onMouseDown_leftClick() {
    if (this.FEATURE_INFO.getShouldShowContextMenu()) return;
    if (this.documentState) {
      switch (this.documentState) {
        case PodDocumentState.MOVE:
          this.MOVE_ACTIONS.start();
          break;
      }
    } else {
      switch (this.selectedPodFeature) {
        case PodFeature.ZOOM: this.ZOOM_ACTIONS.start(); break;
        case PodFeature.BRUSH:

          this.activePodDocument.getActiveLayer().setAction(
            this,
            {
              mousePos: { x: this.GLOBAL_MOUSE_POS.x, y: this.GLOBAL_MOUSE_POS.y },
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
        case PodFeature.FILL:
          this.activePodDocument.getActiveLayer().setAction(
            this,
            {
              mousePos: { x: this.GLOBAL_MOUSE_POS.x, y: this.GLOBAL_MOUSE_POS.y },
              fill: this.FEATURE_INFO.getBrushColor()
            });
          break;
      }
    }
  }
  onMouseDown_RightClick() {
    if (this.documentState) {

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

  mouseIsIn() {
    let canvasContainer = this.RENDER_ACTIONS.getCanvasContainer();
    let canvasContainerDimensions = canvasContainer.getBoundingClientRect();
    let currentMousePos = this.GLOBAL_MOUSE_POS;
    if (currentMousePos.x > canvasContainerDimensions.x && currentMousePos.x < canvasContainerDimensions.x + canvasContainerDimensions.width &&
      currentMousePos.y > canvasContainerDimensions.y && currentMousePos.y < canvasContainerDimensions.y + canvasContainerDimensions.height) {
      return true;
    }
    return false;
  }


}

export class MouseActions {
  protected startingMousePos: Vector2D;
  protected shouldActivate = false;
  protected podDocComp: PodDocumentComponent;

  constructor(podDocComp: PodDocumentComponent) {
    this.podDocComp = podDocComp;
  }

  public start() {
    this.startingMousePos = { x: this.podDocComp.GLOBAL_MOUSE_POS.x, y: this.podDocComp.GLOBAL_MOUSE_POS.y };
    this.shouldActivate = true;
  }

  public isReady() {
    return this.startingMousePos && this.shouldActivate && this.podDocComp.activePodDocument
  }
}
export class MoveActions extends MouseActions {
  private documentStartPosition: Vector2D = { x: 0, y: 0 };
  private documentStartDimensions: Vector2D = { x: 0, y: 0 };
  private worldStartPosition: Vector2D = { x: 0, y: 0 };
  private moveWorldX = false;
  private moveWorldY = false;
  start() {
    super.start();
    let canvasFrameContainer = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainer();
    let canvasFrameContainerDimensions = canvasFrameContainer.getBoundingClientRect();
    let canvasContainer = this.podDocComp.RENDER_ACTIONS.getCanvasContainer();
    let canvasContainerDimensions = canvasContainer.getBoundingClientRect();
    let canvasFrameContainerY = canvasFrameContainerDimensions.y - canvasContainerDimensions.y;
    let canvasFrameContainerX = canvasFrameContainerDimensions.x - canvasContainerDimensions.x;
    this.moveWorldX = canvasFrameContainerX <= 0;
    this.moveWorldY = canvasFrameContainerY <= 0;
    this.worldStartPosition.y = this.podDocComp.activePodDocument.getWorldPosition().y;
    this.worldStartPosition.x = this.podDocComp.activePodDocument.getWorldPosition().x;
    this.documentStartPosition.x = canvasFrameContainerX;
    this.documentStartPosition.y = canvasFrameContainerY;
    this.documentStartDimensions.x = this.podDocComp.activePodDocument.getWidth() * this.podDocComp.activePodDocument.getZoomScale();
    this.documentStartDimensions.y = this.podDocComp.activePodDocument.getHeight() * this.podDocComp.activePodDocument.getZoomScale();
    this.startingMousePos.x = this.podDocComp.GLOBAL_MOUSE_POS.x;
    this.startingMousePos.y = this.podDocComp.GLOBAL_MOUSE_POS.y;
  }

  onMouseMove() {
    if (!this.isReady()) return;
    let canvasFrameContainer = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainer();
    let canvasFrameContainerDimensions = canvasFrameContainer.getBoundingClientRect();
    let canvasContainer = this.podDocComp.RENDER_ACTIONS.getCanvasContainer();
    let canvasContainerDimensions = canvasContainer.getBoundingClientRect();
    let mouseXDistance = (this.podDocComp.GLOBAL_MOUSE_POS.x - this.startingMousePos.x);
    let mouseYDistance = (this.podDocComp.GLOBAL_MOUSE_POS.y - this.startingMousePos.y);
    if (this.moveWorldX) {
      let newWorldX = this.worldStartPosition.x + mouseXDistance;
      if (newWorldX > 0) {
        newWorldX = 0;
        this.startingMousePos.x = this.podDocComp.GLOBAL_MOUSE_POS.x;
        this.moveWorldX = false;
      }
      this.podDocComp.activePodDocument.setWorldXPosition(newWorldX);
      let newCanvasFrameContainerWidth = this.documentStartDimensions.x + this.podDocComp.activePodDocument.getWorldPosition().x;
      newCanvasFrameContainerWidth = newCanvasFrameContainerWidth > canvasContainerDimensions.width ? canvasContainerDimensions.width : newCanvasFrameContainerWidth;
      canvasFrameContainer.style.width = `${newCanvasFrameContainerWidth}px`;

    } else {
      let newCanvasFrameX = this.documentStartPosition.x + mouseXDistance;
      if (newCanvasFrameX < 0) {
        newCanvasFrameX = 0;
        this.startingMousePos.x = this.podDocComp.GLOBAL_MOUSE_POS.x;
        this.documentStartPosition.x = newCanvasFrameX;
        this.moveWorldX = true;
      }
      canvasFrameContainer.style.left = `${newCanvasFrameX}px`;
    }


    if (this.moveWorldY) {
      let newWorldY = this.worldStartPosition.y + mouseYDistance;
      if (newWorldY > 0) {
        newWorldY = 0;
        this.startingMousePos.y = this.podDocComp.GLOBAL_MOUSE_POS.y;
        this.moveWorldY = false;
      }
      this.podDocComp.activePodDocument.setWorldYPosition(newWorldY);
      let newCanvasFrameContainerHeight = this.documentStartDimensions.y + this.podDocComp.activePodDocument.getWorldPosition().y;
      newCanvasFrameContainerHeight = newCanvasFrameContainerHeight > canvasContainerDimensions.height ? canvasContainerDimensions.height : newCanvasFrameContainerHeight;
      canvasFrameContainer.style.height = `${newCanvasFrameContainerHeight}px`;

    } else {
      let newCanvasFrameY = this.documentStartPosition.y + mouseYDistance;
      if (newCanvasFrameY < 0) {
        newCanvasFrameY = 0;
        this.startingMousePos.y = this.podDocComp.GLOBAL_MOUSE_POS.y;
        this.documentStartPosition.y = newCanvasFrameY;
        this.moveWorldY = true;
      }
      canvasFrameContainer.style.top = `${newCanvasFrameY}px`;
    }


    this.podDocComp.RENDER_ACTIONS.matchCanvasWithCanvasFrameContainer();
    this.podDocComp.RENDER_ACTIONS.render();
  }

  stopMoving() {
    this.shouldActivate = false;
  }
}

export class ZoomActions extends MouseActions {

  podDocComp: PodDocumentComponent;
  startOfZoom: Date;

  start() {
    super.start();
    this.startOfZoom = new Date();
    this.podDocComp.RENDER_ACTIONS.matchCanvasWithCanvasContainer();
    this.podDocComp.RENDER_ACTIONS.render();
  }

  onMouseMove() {

    if (!this.isReady()) return;

    let currentMousePos = this.podDocComp.GLOBAL_MOUSE_POS;
    let zoomScale = this.podDocComp.activePodDocument.getZoomScale();
    let zoomVal = 0.005;
    let zoomOffset = Math.abs(this.startingMousePos.x - currentMousePos.x);
    if (this.podDocComp.mouseUtilities.isGoingLeft(this.startingMousePos, currentMousePos)) {
      zoomScale = zoomScale - zoomVal * zoomOffset;
    } else {
      zoomScale = zoomScale + zoomVal * zoomOffset;
    }

    this.podDocComp.DOCUMENT_ACTIONS.scaleCanvasFrameContainer(zoomScale);
    this.podDocComp.DOCUMENT_ACTIONS.onCanvasContainerResize();
    this.startingMousePos = { x: currentMousePos.x, y: currentMousePos.y };


    let nowTime = new Date();
    let elapsed = nowTime.getTime() - this.startOfZoom.getTime();
    if (elapsed > 10) {
      this.startOfZoom = nowTime;
      this.podDocComp.RENDER_ACTIONS.render();
    }

  }

  stopZooming() {
    this.shouldActivate = false;
  }
}

export class PodDocumentActions {

  podDocComp: PodDocumentComponent;
  constructor(podDocComp: PodDocumentComponent) {
    this.podDocComp = podDocComp;
  }

  setupDocument() {
    this.scaleCanvasFrameContainer();
    this.onCanvasContainerResize();
    this.podDocComp.RENDER_ACTIONS.matchCanvasWithCanvasFrameContainer();
    this.podDocComp.RENDER_ACTIONS.render();
    if (this.podDocComp.activePodDocument.getLayers().length <= 0) {
      let firstLayer = this.podDocComp.activePodDocument.addLayer(0);

      this.podDocComp.activeLayerSubscription.next(firstLayer);
    }
  }
  scaleCanvasFrameContainer(customScale?: number) {
    let activeDocument = this.podDocComp.activePodDocument;
    if (!activeDocument) return;
    let documentWidth = activeDocument.getWidth();
    let documentHeight = activeDocument.getHeight();
    let containerWidth = this.podDocComp.RENDER_ACTIONS.getCanvasContainerWidth();
    let containerHeight = this.podDocComp.RENDER_ACTIONS.getCanvasContainerHeight();
    let canvasFrameContainer = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainer();
    let scale = customScale != null ? customScale : 1;
    if (customScale == null) {
      if (documentWidth > documentHeight) {
        scale = containerWidth / documentWidth;
      } else {
        scale = containerHeight / documentHeight;
      }
      scale = scale > 1 ? 1 : scale - (scale * 0.1);
    }
    scale = scale < 0.01 ? 0.01 : scale;
    scale = scale > 10 ? 10 : scale;

    let scaledDocumentWidth = (documentWidth * scale);
    let scaledDocumentHeight = (documentHeight * scale);
    let worldPos = activeDocument.getWorldPosition();
    let newCanvasFrameWidth = scaledDocumentWidth + worldPos.x;
    newCanvasFrameWidth = newCanvasFrameWidth < 0 ? 0 : newCanvasFrameWidth;
    newCanvasFrameWidth = newCanvasFrameWidth > containerWidth ? containerWidth : newCanvasFrameWidth;
    let newCanvasFrameHeight = scaledDocumentHeight + worldPos.y;
    newCanvasFrameHeight = newCanvasFrameHeight < 0 ? 0 : newCanvasFrameHeight;
    newCanvasFrameHeight = newCanvasFrameHeight > containerHeight ? containerHeight : newCanvasFrameHeight;
    activeDocument.setZoomScale(scale);
    activeDocument.setInitialZoomScale(scale);
    canvasFrameContainer.style.width = `${newCanvasFrameWidth}px`;
    canvasFrameContainer.style.height = `${newCanvasFrameHeight}px`;
  }
  onCanvasContainerResize() {
    if (!this.podDocComp.activePodDocument) return;
    let canvasContainerWidth = this.podDocComp.RENDER_ACTIONS.getCanvasContainerWidth();
    let canvasContainerHeight = this.podDocComp.RENDER_ACTIONS.getCanvasContainerHeight();
    let canvasFrameContainerWidth = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainerWidth();
    let canvasFrameContainerHeight = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainerHeight();
    let documentWidth = this.podDocComp.activePodDocument.getWidth() * this.podDocComp.activePodDocument.getZoomScale();
    let documentHeight = this.podDocComp.activePodDocument.getHeight() * this.podDocComp.activePodDocument.getZoomScale();
    if ((canvasContainerWidth > documentWidth && canvasFrameContainerWidth < canvasContainerWidth) ||
      (canvasContainerHeight > documentHeight && canvasFrameContainerHeight < canvasContainerHeight)) {
      this.podDocComp.activePodDocument.setWorldXPosition(0);
      this.centerCanvasFrameHorizontallyInCanvasContainer();
      this.podDocComp.activePodDocument.setWorldYPosition(0);
      this.centerCanvasFrameVerticallInCanvasContainer();
    }
  }

  centerCanvasFrameVerticallInCanvasContainer() {
    let canvasContainerHeight = this.podDocComp.RENDER_ACTIONS.getCanvasContainerHeight();
    let canvasFrameContainerHeight = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainerHeight();
    let canvasFrameContainer = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainer();
    let top = (canvasContainerHeight / 2) - (canvasFrameContainerHeight / 2);
    top = top < 0 ? 0 : top;
    canvasFrameContainer.style.top = `${top}px`;
  }
  centerCanvasFrameHorizontallyInCanvasContainer() {
    let canvasContainerWidth = this.podDocComp.RENDER_ACTIONS.getCanvasContainerWidth();
    let canvasFrameContainerWidth = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainerWidth();
    let canvasFrameContainer = this.podDocComp.RENDER_ACTIONS.getCanvasFrameContainer();
    let left = (canvasContainerWidth / 2) - (canvasFrameContainerWidth / 2);
    left = left < 0 ? 0 : left;
    canvasFrameContainer.style.left = `${left}px`;
  }
}


export class RenderActions {
  podDocComp: PodDocumentComponent;
  private shouldEdit = false;
  constructor(podDocComp: PodDocumentComponent) {
    this.podDocComp = podDocComp;
  }

  render() {

    let activeDocument = this.podDocComp.activePodDocument;
    if (!activeDocument) return;

    this.clearCanvas(this.getBottomCanvas());
    this.clearCanvas(this.getDrawCanvas());
    this.clearCanvas(this.getTopCanvas());


    let bottomLayer = true;
    for (let i = activeDocument.getLayers().length - 1; i >= 0; i--) {
      let currentLayer = activeDocument.getLayers()[i];

      if (currentLayer == activeDocument.getActiveLayer()) { // Draw on current layer
        for (let action of currentLayer.actions) {
          action.render(this.getDrawCanvas(), this.podDocComp.activePodDocument);
        }
        currentLayer.setDataUrl(this.getDrawCanvas());
        bottomLayer = false;
      } else if (bottomLayer) { // Draw on Bottom Layer
        for (let action of currentLayer.actions) {
          action.render(this.getBottomCanvas(), this.podDocComp.activePodDocument);
        }
      } else { // Draw on Top Layer
        for (let action of currentLayer.actions) {
          action.render(this.getTopCanvas(), this.podDocComp.activePodDocument);
        }
      }

      
    }


  }

  getCanvasContainer() {
    return <HTMLDivElement>document.querySelector(".pod-document-content-canvas-container");
  }
  getCanvasFrameContainer() {
    return <HTMLDivElement>document.querySelector(".canvas-frame-container");
  }
  getBottomCanvas() {
    return <HTMLCanvasElement>document.querySelector(".bottom-canvas");
  }
  getDrawCanvas() {
    return <HTMLCanvasElement>document.querySelector(".draw-canvas");
  }
  getTopCanvas() {
    return <HTMLCanvasElement>document.querySelector(".top-canvas");
  }

  getCanvasContainerWidth() {
    return this.getCanvasContainer()!.getBoundingClientRect().width;
  }
  getCanvasContainerHeight() {
    return this.getCanvasContainer()!.getBoundingClientRect().height;
  }

  getCanvasFrameContainerWidth() {
    return this.getCanvasFrameContainer().getBoundingClientRect().width;
  }
  getCanvasFrameContainerHeight() {
    return this.getCanvasFrameContainer().getBoundingClientRect().height;
  }

  setShouldEdit(shouldEdit: boolean) {
    this.shouldEdit = shouldEdit;
  }

  getShouldEdit() {
    return this.shouldEdit;
  }

  clearCanvas(canvas: HTMLCanvasElement) {
    let canvasDimensions = canvas.getBoundingClientRect();
    let utensil = canvas.getContext("2d");
    utensil.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
  }

  matchCanvasWithCanvasFrameContainer() {
    let bottomCanvas = this.getBottomCanvas();
    let drawCanvas = this.getDrawCanvas();
    let topCanvas = this.getTopCanvas();

    bottomCanvas.width = drawCanvas.width = topCanvas.width = this.getCanvasFrameContainerWidth();
    bottomCanvas.height = drawCanvas.height = topCanvas.height = this.getCanvasFrameContainerHeight();
  }

  matchCanvasWithCanvasContainer() {
    let bottomCanvas = this.getBottomCanvas();
    let drawCanvas = this.getDrawCanvas();
    let topCanvas = this.getTopCanvas();

    bottomCanvas.width = drawCanvas.width = topCanvas.width = this.getCanvasContainerWidth();
    bottomCanvas.height = drawCanvas.height = topCanvas.height = this.getCanvasContainerHeight();
  }

}


export class CursorActions {
  podDocComp: PodDocumentComponent;
  constructor(podDocComp: PodDocumentComponent) {
    this.podDocComp = podDocComp;
  }

  private changeCursor(documentState: PodDocumentState, feature: PodFeature) {
    if (documentState) {
      switch (documentState) {
        case PodDocumentState.MOVE: this.genMoveDocumentCursor(); break;
      }
    } else {
      switch (feature) {
        case PodFeature.MOVE: this.genMoveFeatureCursor(); break;
        case PodFeature.BRUSH: this.genRoundCusor(); break;
        case PodFeature.ERASER: this.genRoundCusor(); break;
        case PodFeature.ZOOM: this.genZoomFeatureCursor(); break;
        case PodFeature.FILL: this.genFillFeatureCursor(); break;
      }
    }

  }

  onMouseMove(documentState: PodDocumentState, feature: PodFeature, mousePos: Vector2D) {
    this.changeCursor(documentState, feature);
    switch (this.podDocComp.selectedPodFeature) {
      case PodFeature.BRUSH: this.moveRoundCursor(mousePos); break;
      case PodFeature.ERASER: this.moveRoundCursor(mousePos); break;
    }
    if (this.podDocComp.documentState == PodDocumentState.MOVE) this.hideCursor();
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

  private genMoveFeatureCursor() {
    this.resetPodCursor();
    let canvasContainer = this.podDocComp.RENDER_ACTIONS.getCanvasContainer();
    canvasContainer.style.cursor = "context-menu";
  }
  private genZoomFeatureCursor() {
    this.resetPodCursor();
    let canvasContainer = this.podDocComp.RENDER_ACTIONS.getCanvasContainer();
    canvasContainer.style.cursor = `url('../../../assets/icons/zoom_cursor.png'), pointer`;
  }
  private genFillFeatureCursor() {
    this.resetPodCursor();
    let canvasContainer = this.podDocComp.RENDER_ACTIONS.getCanvasContainer();
    canvasContainer.style.cursor = `url('../../../assets/icons/fill_cursor.png'), pointer`;
  }
  private genMoveDocumentCursor() {
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

