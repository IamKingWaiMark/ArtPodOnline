import { AppActionType } from "../enums/app-action-type";
import { PodFeature } from "../enums/pod-feature";
import { DrawActionData } from "../interfaces/app-action-data";
import { Transform } from "../interfaces/transform-values";
import { PodDocumentComponent } from "../pod-document/pod-document.component";
import { AppAction } from "./app-action";
import { BackgroundColor, PodPreset } from "./pod-preset";
import { Vector2D } from "./vectors";



declare var cv: any;

export class PodDocument {

    private readonly MAX_UNDOS = 50;
    private readonly MAX_LAYERS = 30;
    private metaData: PodDocMetaData;
    private layers: Layer[] = [];
    private layerCounter = 1;
    private activeLayer: Layer;
    private zoomScale: number;
    private initialZoomScale: number = null;
    private worldPosition: Vector2D;

    private undoActions: AppAction[] = [];
    private redoActions: AppAction[] = [];

    constructor(metaData: PodDocMetaData) {
        this.metaData = metaData;
        this.setWorldPosition({ x: 0, y: 0 });
    }

    addLayer(index: number) {
        if (this.layers.length >= this.MAX_LAYERS) return null;
        let layer = new Layer(`Layer ${this.layerCounter++}`);
        this.layers.splice(index, 0, layer);
        return layer;
    }

    canDeleteLayer() {
        return this.layers.length > 1;
    }
    deleteLayer(index: number): boolean {
        if (this.layers.length > 1) {
            this.layers.splice(index, 1);
            return true;
        }
        return false;
    }


    getZoomPercent() {
        return (this.zoomScale * 100).toFixed(2) + "%";
    }



    getZoomScale() {
        return this.zoomScale;
    }

    getWidth() {
        return this.metaData.podPreset.w * this.metaData.podPreset.ppi;
    }

    getHeight() {
        return this.metaData.podPreset.h * this.metaData.podPreset.ppi;
    }

    getLayers() {
        return this.layers;
    }

    getWorldPosition() {
        return this.worldPosition;
    }

    setLayers(layers: Layer[]) {
        this.layers = layers;
    }
    setWorldPosition(position: Vector2D) {
        this.worldPosition = position;
    }

    setWorldXPosition(xPos: number) {
        this.worldPosition.x = xPos;
    }

    setWorldYPosition(yPos: number) {
        this.worldPosition.y = yPos;
    }

    getActiveLayer() {
        return this.activeLayer;
    }

    getInitialZoomScale() {
        return this.initialZoomScale;
    }

    setZoomScale(scale: number) {
        this.zoomScale = scale;
    }

    setActiveLayer(layer: Layer) {
        this.activeLayer = layer;
    }

    setInitialZoomScale(scale: number) {
        if (this.initialZoomScale == null) this.initialZoomScale = scale;
    }


    undo() {
        if (this.undoActions.length > 0) {
            let undoAction = this.undoActions[this.undoActions.length - 1];
            undoAction.undo();
            this.redoActions.push(undoAction);
            this.undoActions.pop();
        }
    }

    redo() {
        if (this.redoActions.length > 0) {
            let redoAction = this.redoActions[this.redoActions.length - 1];
            redoAction.redo();
            this.undoActions.push(redoAction);
            this.redoActions.pop();
        }
    }

    removeUndoAndRedoActionsWithLayerWhenDeleted(layer: Layer) {
        for (let i = 0; i < this.undoActions.length; i++) {
            let actionLayer = this.undoActions[i].getLayer();
            if (actionLayer == layer) {
                this.undoActions.splice(i--, 1);
            }
        }
        for (let i = 0; i < this.redoActions.length; i++) {
            let actionLayer = this.redoActions[i].getLayer();
            if (actionLayer == layer) {
                this.redoActions.splice(i--, 1);
            }
        }
    }

    addToUndoActions(action: AppAction) {
        this.undoActions.push(action);
        if (this.redoActions.length > 0) this.redoActions = [];
        if (this.undoActions.length > this.MAX_UNDOS) this.undoActions.splice(0, 1);
    }

    getActiveLayerIndex() {
        let index = this.getLayers().indexOf(this.activeLayer);
        return index ? index : 0;
    }

    getTitle() {
        return this.metaData.docName;
    }

    getBackgroundColor() {
        switch (this.metaData.backgroundColor) {
            case BackgroundColor.WHITE:
                return { r: 255, g: 255, b: 255 };
            case BackgroundColor.BLACK:
                return { r: 0, g: 0, b: 0 };
            default:
                return { r: 255, g: 255, b: 255 };
        }
    }

}






export class Layer {
    name: string;
    visible = true;
    actions: LayerAction[] = [];
    podDocComp: PodDocumentComponent;
    snapshotImageSrc: string;
    moveStartTimer: Date;
    transform: Transform = {
        origin: { x: 0, y: 0 },
        bounds: {x: 0, y: 0, x2: 0, y2: 0, w: 0, h: 0},
        rotationAngle: 0,
        scale: {x: 1, y: 1}
    };
    initialLayerOrigin: Vector2D = { x: 0, y: 0 };
    initialMousePosition: Vector2D = { x: 0, y: 0 };
    movingWithKeyboard = false;
    constructor(name: string) {
        this.name = name;
    }

    copy(layer: Layer): Layer {
        this.name = layer.name;
        this.visible = layer.visible;
        this.actions = layer.actions;
        this.podDocComp = layer.podDocComp;
        this.snapshotImageSrc = layer.snapshotImageSrc;
        return this;
    }

    getVisibilityIconSrc() {
        return this.visible ? "assets/icons/visibility_on_icon.png" : "assets/icons/visibility_off_icon.png";
    }

    toggleVisibility() {
        this.visible = this.visible ? false : true;
    }

    setAction(podDocComp: PodDocumentComponent, data: ActionData) {
        this.setPodDocComp(podDocComp);
        let action: LayerAction;
        switch (this.podDocComp.selectedPodFeature) {
            case PodFeature.BRUSH:
                action = new BrushAction(this, data);
                this.actions.push(action);
                break;
            case PodFeature.FILL:
                action = new FillAction(this, data);
                this.actions.push(action);
                break;
            case PodFeature.ERASER:
                action = new EraserAction(this, data);
                this.actions.push(action);
                break;
        }
        this.podDocComp.activePodDocument.addToUndoActions(
            new AppAction(AppActionType.DRAW,
                <DrawActionData>{
                    layer: this,
                    action
                })
        );
    }
    addImage(podDocComp: PodDocumentComponent, data: ActionData, addToUndoStack?: boolean) {
        this.setPodDocComp(podDocComp);

        let action = new ImageFileAction(this, data);
        this.actions.push(action);

        if (addToUndoStack) {
            this.podDocComp.activePodDocument.addToUndoActions(
                new AppAction(AppActionType.DRAW,
                    <DrawActionData>{
                        layer: this,
                        action
                    })
            );
        }
    }
    setBackgroundColor(podDocComp: PodDocumentComponent, data: ActionData, addToUndoStack?: boolean) {
        this.setPodDocComp(podDocComp);
        let action = new FillAction(this, data);
        this.actions.push(action);
        if (addToUndoStack) {
            this.podDocComp.activePodDocument.addToUndoActions(
                new AppAction(AppActionType.DRAW,
                    <DrawActionData>{
                        layer: this,
                        action
                    })
            );
        }
    }



    offsetMousePosWithScale(mousePos: Vector2D, activeDocument: PodDocument) {
        let offsetByScale = activeDocument.getZoomScale() / activeDocument.getInitialZoomScale();

        return { x: mousePos.x / offsetByScale, y: mousePos.y / offsetByScale }
    }
    getCurrentAction() {
        if (this.actions.length > 0) return this.actions[this.actions.length - 1];
        else return null;
    }

    setDataUrl(drawCanvas: HTMLCanvasElement) {
        this.snapshotImageSrc = drawCanvas.toDataURL();
    }

    setPodDocComp(podDocComp: PodDocumentComponent) {
        this.podDocComp = podDocComp;
    }

    onMoveStart() {
        if (!this.podDocComp) return;
        this.moveStartTimer = new Date();
        this.initialLayerOrigin.x = this.transform.origin.x;
        this.initialLayerOrigin.y = this.transform.origin.y;
        this.initialMousePosition.x = this.podDocComp.GLOBAL_MOUSE_POS.x;
        this.initialMousePosition.y = this.podDocComp.GLOBAL_MOUSE_POS.y;
    }

    onMove(pixel?: Vector2D) {
        if (pixel && this.movingWithKeyboard == false) {
            this.moveStartTimer = new Date();
            this.movingWithKeyboard = true;
            this.transform.origin.x += pixel.x;
            this.transform.origin.y += pixel.y;
            this.podDocComp.RENDER_ACTIONS.render(false);
        }
        if (this.moveStartTimer == null) return;
        let nowTime = new Date();
        let elapsedTime = nowTime.getTime() - this.moveStartTimer.getTime();
        if (pixel) {

            if (elapsedTime > 100) {
                this.transform.origin.x += pixel.x;
                this.transform.origin.y += pixel.y;
                this.moveStartTimer = nowTime;
                this.podDocComp.RENDER_ACTIONS.render(false);
            }
        } else if (!this.movingWithKeyboard) {
            let activeDocument = this.podDocComp.activePodDocument;
            let offsetByScale = activeDocument.getZoomScale() / activeDocument.getInitialZoomScale();

            let mouseDistance = {
                x: (this.initialMousePosition.x - this.podDocComp.GLOBAL_MOUSE_POS.x) / offsetByScale,
                y: (this.initialMousePosition.y - this.podDocComp.GLOBAL_MOUSE_POS.y) / offsetByScale
            };
            this.transform.origin.x = this.initialLayerOrigin.x - mouseDistance.x;
            this.transform.origin.y = this.initialLayerOrigin.y - mouseDistance.y;
            if (elapsedTime > 34) {
                this.moveStartTimer = nowTime;
                this.podDocComp.RENDER_ACTIONS.render(false);
            }
        }
    }

    onMoveStop() {
        this.moveStartTimer = null;
        this.movingWithKeyboard = false;
    }

    getDistanceFromLayerOrigin() {
        return {
            x: 0 + this.transform.origin.x,
            y: 0 + this.transform.origin.y
        }
    }
    rotatePoint(point: {x: number, y: number}, angle: number, pivot: Vector2D) {

        return {
            x: (point.x - pivot.x) * Math.cos(angle) - (point.y - pivot.y) * Math.sin(angle) + (pivot.x),
            y: (point.x - pivot.x) * Math.sin(angle) + (point.y - pivot.y) * Math.cos(angle) + (pivot.y)
        }
    }
    getPivot() {
        return {
            x: (this.transform.bounds.x + this.transform.bounds.x2) / 2,
            y: (this.transform.bounds.y + this.transform.bounds.y2) / 2
        }
    }

    startTransform(){
        this.transform.rotationAngle = 0;
        this.calculateBounds();
    }
    calculateBounds(){
        this.transform.bounds = { x: null, y: null, x2: null, y2: null, w: null, h: null };
        for(let action of this.actions) {
            action.calculateBounds();
        }
    }
    updateBounds(x: number, y: number) {
        let newX = x;
        let newY = y;
        if (this.transform.bounds.x == null || this.transform.bounds.x2 == null || this.transform.bounds.y == null || this.transform.bounds.y2 == null) {
            this.transform.bounds = { x: newX, y: newY, x2: newX, y2: newY, w: 0, h: 0 };
        }
        if (newX < this.transform.bounds.x) {
            this.transform.bounds.x = newX;
        } else if (newX > this.transform.bounds.x2) {
            this.transform.bounds.x2 = newX;
        }
        if (newY < this.transform.bounds.y) {
            this.transform.bounds.y = newY;
        } else if (newY > this.transform.bounds.y2) {
            this.transform.bounds.y2 = newY;
        }

        this.transform.bounds.w = this.transform.bounds.x2 - this.transform.bounds.x;
        this.transform.bounds.h = this.transform.bounds.y2 - this.transform.bounds.y;
    }
    
    rotate(angle: number){
        this.transform.rotationAngle = angle;
        for(let action of this.actions) {
            action.rotate();
        }
    }
    

    set(transform: Transform){
        for(let action of this.actions) {
            action.scale.x = transform.scale.x;
            action.scale.y = transform.scale.y;
        }
    }

    
}


export class LayerAction {
    data: any[] = [];
    fill: { r: number, g: number, b: number, a?: number } = { r: 0, g: 0, b: 0, a: 1 };
    utensilSize: number;
    startTime: Date;
    layer: Layer;
    scale = {x: 1, y: 1};

    readonly DEFAULT_COMPPSITION_OPERATION = "source-over";
    compositionOperation = this.DEFAULT_COMPPSITION_OPERATION;
    constructor(layer: Layer, actionData: ActionData) {
        this.layer = layer;
        this.fill = actionData.fill;
        if (this.fill) this.fill.a = 1;
        this.utensilSize = actionData.utensilSize;
        this.startTime = new Date();
    }
    render(canvas: HTMLCanvasElement, activeDocument: PodDocument) {

    }

    renderForFinal(canvas: HTMLCanvasElement, activeDocument: PodDocument) {

    }
    calculateBounds(){

    }
    rotate() {

    }
    renderForTransform(){

    }

    onDraw(canvas: HTMLCanvasElement, mousePos: Vector2D, activeDocument: PodDocument) {
        let nowTime = new Date();
        let elapsed = nowTime.getTime() - this.startTime.getTime();

        if (elapsed >= 24 || elapsed == 0) {
            this.startTime = nowTime;
        } else {
            return;
        }
        this.onDrawAction(canvas, mousePos, activeDocument);

    }

    onDrawAction(canvas: HTMLCanvasElement, mousePos: Vector2D, activeDocument: PodDocument) {

    }
    getData() {
        return this.data;
    }

    addToData<T>(data: T) {
        this.data.push(<T>data);
    }

    resetGlobalComposition(canvas: HTMLCanvasElement) {
        canvas.getContext("2d").globalCompositeOperation = this.DEFAULT_COMPPSITION_OPERATION;
    }

    
}

export class ImageFileAction extends LayerAction {
    htmlImageElement: HTMLImageElement;

    constructor(layer: Layer, actionData: ActionData) {
        super(layer, actionData);
        this.htmlImageElement = actionData.htmlImageElement;
        let documentWidth = layer.podDocComp.activePodDocument.getWidth();
        let documentHeight = layer.podDocComp.activePodDocument.getHeight();
        let imageWidth = this.htmlImageElement.width;
        let imageHeight = this.htmlImageElement.height;
        let scaleW =  documentWidth / imageWidth;
        let scaleH = documentHeight / imageHeight;
        this.scale.x = scaleW > 1? 1: scaleW;
        this.scale.y = scaleH > 1? 1: scaleH;
    }
    render(canvas: HTMLCanvasElement, activeDocument: PodDocument) {
        let utensil = canvas.getContext("2d");

        let offsetByScale = activeDocument.getZoomScale() / activeDocument.getInitialZoomScale();
        this.resetGlobalComposition(canvas);
        utensil.drawImage(
            this.htmlImageElement,
            activeDocument.getWorldPosition().x + (this.layer.transform.origin.x * offsetByScale),
            activeDocument.getWorldPosition().y + (this.layer.transform.origin.y * offsetByScale),
            (this.htmlImageElement.width * this.scale.x) * activeDocument.getZoomScale() + 1,
            (this.htmlImageElement.height * this.scale.y) * activeDocument.getZoomScale() + 1);
    }
    renderForFinal(canvas: HTMLCanvasElement, activeDocument: PodDocument) {
        let offsetByScale = 1 / activeDocument.getInitialZoomScale();
        let utensil = canvas.getContext("2d");
        this.resetGlobalComposition(canvas);
        utensil.drawImage(
            this.htmlImageElement,
            this.layer.transform.origin.x * offsetByScale,
            this.layer.transform.origin.y * offsetByScale,
            this.htmlImageElement.width,
            this.htmlImageElement.height);
    }
}

export class FillAction extends LayerAction {
    currentScale: number;
    initialWorldPositionX: number;
    initialWorldPositionY: number;
    distanceFromLayerOrigin: Vector2D;
    fillZoom: number;
    constructor(layer: Layer, actionData: ActionData) {
        super(layer, actionData);
        this.fillZoom = layer.podDocComp.activePodDocument.getZoomScale();
        let temporaryCanvas = <HTMLCanvasElement>document.createElement("canvas");
        let drawCanvas = this.layer.podDocComp.RENDER_ACTIONS.getDrawCanvas();
        temporaryCanvas.width = drawCanvas.width;
        temporaryCanvas.height = drawCanvas.height;
        let activeDocument = this.layer.podDocComp.activePodDocument;
        this.currentScale = activeDocument.getZoomScale();
        this.initialWorldPositionX = activeDocument.getWorldPosition().x;
        this.initialWorldPositionY = activeDocument.getWorldPosition().y;
        this.distanceFromLayerOrigin = this.layer.getDistanceFromLayerOrigin();
        this.turnCanvasToBlackAndWhite(actionData.mousePos.x, actionData.mousePos.y, drawCanvas, temporaryCanvas);
        this.findContours(actionData.mousePos.x, actionData.mousePos.y, drawCanvas, temporaryCanvas);
        //this.render(drawCanvas, this.layer.podDocComp.activePodDocument);

    }
    turnCanvasToBlackAndWhite(mouseX: number, mouseY: number, drawCanvas: HTMLCanvasElement, temporaryCanvas: HTMLCanvasElement) {
        let drawCanvasDimensions = drawCanvas.getBoundingClientRect();
        let drawCanvasUtensil = drawCanvas.getContext("2d");
        let drawCanvasData = drawCanvasUtensil.getImageData(0, 0, drawCanvasDimensions.width, drawCanvasDimensions.height);

        let temporaryCanvasUtensil = temporaryCanvas.getContext("2d");
        let temporaryCanvasData = temporaryCanvasUtensil.getImageData(0, 0, drawCanvasDimensions.width, drawCanvasDimensions.height);
        let temporaryCanvasDimensions = temporaryCanvas.getBoundingClientRect();
        let color = drawCanvasUtensil.getImageData(
            mouseX - drawCanvasDimensions.x - temporaryCanvasDimensions.x,
            mouseY - drawCanvasDimensions.y - temporaryCanvasDimensions.y,
            1, 1);

        let r = color.data[0];
        let g = color.data[1];
        let b = color.data[2];
        let a = color.data[3];
        let redScope = 15;
        let greenScope = 15;
        let blueScope = 15;

        if (r > g && r > b) {
            redScope += 15;
        } else if (g > r && g > b) {
            greenScope += 15;
        } else {
            blueScope += 15;
        }
        for (let i = 0; i < drawCanvasData.data.length; i += 4) {


            let r2 = drawCanvasData.data[i];
            let g2 = drawCanvasData.data[i + 1];
            let b2 = drawCanvasData.data[i + 2];
            let a2 = drawCanvasData.data[i + 3];

            if (r >= r2 - redScope && r <= r2 + redScope &&
                g >= g2 - greenScope && g <= g + greenScope &&
                b >= b2 - blueScope && b <= b2 + blueScope &&
                a == a2) {
                temporaryCanvasData.data[i] = 255;
                temporaryCanvasData.data[i + 1] = 255;
                temporaryCanvasData.data[i + 2] = 255;
                temporaryCanvasData.data[i + 3] = 255;
            } else {
                temporaryCanvasData.data[i] = 0;
                temporaryCanvasData.data[i + 1] = 0;
                temporaryCanvasData.data[i + 2] = 0;
                temporaryCanvasData.data[i + 3] = 255;
            }

        }

        temporaryCanvasUtensil.putImageData(temporaryCanvasData, 0, 0);
    }
    findContours(mouseX: number, mouseY: number, drawCanvas: HTMLCanvasElement, temporaryCanvas: HTMLCanvasElement) {
        let src = cv.imread(temporaryCanvas);
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
        cv.threshold(src, src, 195, 200, cv.THRESH_BINARY);
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        let canvasDimensions = temporaryCanvas.getBoundingClientRect();
        let drawCanvasDimensions = drawCanvas.getBoundingClientRect();
        cv.findContours(src, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE); // CHAIN_APPROX_NONE
        let index = -1;
        let outsideContours = [];
        let shortestDistance = -1;

        for (let i = 0; i < contours.size(); ++i) {
            let dist = cv.pointPolygonTest(contours.get(i),
                new cv.Point(
                    mouseX - canvasDimensions.x - drawCanvasDimensions.x,
                    mouseY - canvasDimensions.y - drawCanvasDimensions.y),
                true);

            if (dist > 0) {
                if (shortestDistance < 0 || dist < shortestDistance) {
                    shortestDistance = dist;
                    index = i;
                }

            }
        }

        if (index >= 0) {
            let mainContour = contours.get(index);
            let areaOfWrappingContour = cv.contourArea(mainContour);
            for (let i = 0; i < contours.size(); ++i) {

                if (i != index) {
                    let area = cv.contourArea(contours.get(i));
                    let currentContour = contours.get(i);
                    let p = { x: 0, y: 0 };
                    p.x = currentContour.data32S[currentContour.data32S.length - 2];
                    p.y = currentContour.data32S[currentContour.data32S.length - 1];
                    let currentContourTestInside = cv.pointPolygonTest(mainContour, new cv.Point(p.x, p.y), true);
                    if (currentContourTestInside > 0 && area >= (areaOfWrappingContour * .0001)) {
                        outsideContours.push(i);
                    }
                }
            }

            this.addToData(mainContour);
            for (let k = 0; k < outsideContours.length; k++) {
                let outsideContour = contours.get(outsideContours[k]);
                let p = { x: 0, y: 0 };
                p.x = outsideContour.data32S[outsideContour.data32S.length - 2];
                p.y = outsideContour.data32S[outsideContour.data32S.length - 1];
                let skip = false;
                for (let o = 0; o < outsideContours.length; o++) {
                    if (o != k) {
                        let currentContour = contours.get(outsideContours[o]);
                        let dist = cv.pointPolygonTest(currentContour, new cv.Point(p.x, p.y), true);
                        if (dist > 0) {
                            skip = true;
                            break;
                        }

                    }
                }
                if (!skip) {
                    this.addToData(outsideContour);
                }

            }

        }



        src.delete();
        contours.delete();
        hierarchy.delete();
        if (this.data.length <= 0) {
            this.layer.actions.splice(this.layer.actions.indexOf(this));
        }

    }
    render(canvas: HTMLCanvasElement, activeDocument: PodDocument) {

        let c = this.data[0];
        if (!c) return;
        let offsetByScale = activeDocument.getZoomScale() / this.currentScale;
        let offsetByDocumentScale = activeDocument.getZoomScale() / activeDocument.getInitialZoomScale();
        let utensil = canvas.getContext("2d");
        utensil.globalCompositeOperation = this.compositionOperation;

        utensil.beginPath();
        let p = { x: 0, y: 0 };
        p.x = ((c.data32S[c.data32S.length - 2] - this.initialWorldPositionX) * offsetByScale) + activeDocument.getWorldPosition().x + (this.layer.transform.origin.x - this.distanceFromLayerOrigin.x) * offsetByDocumentScale;
        p.y = ((c.data32S[c.data32S.length - 1] - this.initialWorldPositionY) * offsetByScale) + activeDocument.getWorldPosition().y + (this.layer.transform.origin.y - this.distanceFromLayerOrigin.y) * offsetByDocumentScale;
        utensil.moveTo(p.x, p.y);
        for (let j = c.data32S.length - 1; j >= 0; j -= 2) {
            let p = { x: 0, y: 0 };
            p.x = ((c.data32S[j - 1] - this.initialWorldPositionX) * offsetByScale) + activeDocument.getWorldPosition().x + (this.layer.transform.origin.x - this.distanceFromLayerOrigin.x) * offsetByDocumentScale;
            p.y = ((c.data32S[j] - this.initialWorldPositionY) * offsetByScale) + activeDocument.getWorldPosition().y + (this.layer.transform.origin.y - this.distanceFromLayerOrigin.y) * offsetByDocumentScale;
            utensil.lineTo(p.x, p.y);

        }
        utensil.closePath();
        for (let k = 1; k < this.data.length; k++) {
            let outsideContour = this.data[k];


            let p = { x: 0, y: 0 };
            p.x = ((outsideContour.data32S[outsideContour.data32S.length - 2] - this.initialWorldPositionX) * offsetByScale) + activeDocument.getWorldPosition().x + (this.layer.transform.origin.x - this.distanceFromLayerOrigin.x) * offsetByDocumentScale;
            p.y = ((outsideContour.data32S[outsideContour.data32S.length - 1] - this.initialWorldPositionY) * offsetByScale) + activeDocument.getWorldPosition().y + (this.layer.transform.origin.y - this.distanceFromLayerOrigin.y) * offsetByDocumentScale;

            utensil.moveTo(p.x, p.y);
            for (let j = outsideContour.data32S.length - 1; j >= 0; j -= 2) {
                let p = { x: 0, y: 0 };
                p.x = ((outsideContour.data32S[j - 1] - this.initialWorldPositionX) * offsetByScale) + activeDocument.getWorldPosition().x + (this.layer.transform.origin.x - this.distanceFromLayerOrigin.x) * offsetByDocumentScale;
                p.y = ((outsideContour.data32S[j] - this.initialWorldPositionY) * offsetByScale) + activeDocument.getWorldPosition().y + (this.layer.transform.origin.y - this.distanceFromLayerOrigin.y) * offsetByDocumentScale;
                utensil.lineTo(p.x, p.y);
            }
            utensil.closePath();

        }
        utensil.strokeStyle = `rgb(${this.fill.r}, ${this.fill.g}, ${this.fill.b})`;
        let lineWidth = 3.2 * offsetByScale;
        lineWidth = lineWidth < 1 ? 1 : lineWidth;
        utensil.lineWidth = Math.ceil(lineWidth);
        utensil.stroke();
        utensil.fillStyle = `rgb(${this.fill.r}, ${this.fill.g}, ${this.fill.b})`;
        utensil.fill();
        this.resetGlobalComposition(canvas);
    }

    renderForFinal(canvas: HTMLCanvasElement, activeDocument: PodDocument) {

        let c = this.data[0];
        if (!c) return;
        let offsetByScale = 1 / this.fillZoom;
        let offsetByDocumentScale = 1 / activeDocument.getInitialZoomScale();
        let utensil = canvas.getContext("2d");
        utensil.globalCompositeOperation = this.compositionOperation;

        utensil.beginPath();
        let p = { x: 0, y: 0 };
        p.x = ((c.data32S[c.data32S.length - 2]) * offsetByScale) + (this.layer.transform.origin.x - this.distanceFromLayerOrigin.x) * offsetByDocumentScale;
        p.y = ((c.data32S[c.data32S.length - 1]) * offsetByScale) + (this.layer.transform.origin.y - this.distanceFromLayerOrigin.y) * offsetByDocumentScale;
        utensil.moveTo(p.x, p.y);
        for (let j = c.data32S.length - 1; j >= 0; j -= 2) {
            let p = { x: 0, y: 0 };
            p.x = ((c.data32S[j - 1]) * offsetByScale) + (this.layer.transform.origin.x - this.distanceFromLayerOrigin.x) * offsetByDocumentScale;
            p.y = ((c.data32S[j]) * offsetByScale) + (this.layer.transform.origin.y - this.distanceFromLayerOrigin.y) * offsetByDocumentScale;
            utensil.lineTo(p.x, p.y);

        }
        utensil.closePath();
        for (let k = 1; k < this.data.length; k++) {
            let outsideContour = this.data[k];


            let p = { x: 0, y: 0 };
            p.x = ((outsideContour.data32S[outsideContour.data32S.length - 2]) * offsetByScale) + (this.layer.transform.origin.x - this.distanceFromLayerOrigin.x) * offsetByDocumentScale;
            p.y = ((outsideContour.data32S[outsideContour.data32S.length - 1]) * offsetByScale) + (this.layer.transform.origin.y - this.distanceFromLayerOrigin.y) * offsetByDocumentScale;

            utensil.moveTo(p.x, p.y);
            for (let j = outsideContour.data32S.length - 1; j >= 0; j -= 2) {
                let p = { x: 0, y: 0 };
                p.x = ((outsideContour.data32S[j - 1]) * offsetByScale) + (this.layer.transform.origin.x - this.distanceFromLayerOrigin.x) * offsetByDocumentScale;
                p.y = ((outsideContour.data32S[j]) * offsetByScale) + (this.layer.transform.origin.y - this.distanceFromLayerOrigin.y) * offsetByDocumentScale;
                utensil.lineTo(p.x, p.y);
            }
            utensil.closePath();

        }
        utensil.strokeStyle = `rgb(${this.fill.r}, ${this.fill.g}, ${this.fill.b})`;
        let lineWidth = 4 * offsetByScale;
        lineWidth = lineWidth < 4 ? 4 : lineWidth;
        utensil.lineWidth = lineWidth;
        utensil.stroke();
        utensil.fillStyle = `rgb(${this.fill.r}, ${this.fill.g}, ${this.fill.b})`;
        utensil.fill();
        this.resetGlobalComposition(canvas);
    }

    calculateBounds() {
        let contours = this.getData();
        for (let i = 0; i < contours.length; i++) {
            let contour = this.getData()[i];
            for (let j = 0; j < contour.data32S.length; j += 2) {
                let p = { x: 0, y: 0 };
                p.x = contour.data32S[j];
                p.y = contour.data32S[j + 1];
                this.layer.updateBounds(
                    p.x, 
                    p.y);
            }
        }
    }

    
    rotate() {
        let contours = this.getData();
        for (let i = 0; i < contours.length; i++) {
            let contour = this.getData()[i];
            for (let j = 0; j < contour.data32S.length; j += 2) {
                let p = { x: 0, y: 0 };
                p.x = contour.data32S[j];
                p.y = contour.data32S[j + 1];
                let rotatedPoint = this.layer.rotatePoint(
                    p, 
                    this.layer.transform.rotationAngle, 
                    this.layer.getPivot());
                contour.data32S[j] = rotatedPoint.x;
                contour.data32S[j + 1] = rotatedPoint.y;
            }
        }
    }
    
}

export class BrushAction extends LayerAction {


    constructor(layer: Layer, actionData: ActionData) {
        super(layer, actionData);
        let activeDocument = this.layer.podDocComp.activePodDocument;
        let canvasDimensions = this.layer.podDocComp.RENDER_ACTIONS.getDrawCanvas().getBoundingClientRect();
        let offsetByScale = this.layer.podDocComp.activePodDocument.getZoomScale() / this.layer.podDocComp.activePodDocument.getInitialZoomScale();
        let lineOffset = {
            x: canvasDimensions.x,
            y: canvasDimensions.y
        }
        let calculatedMousePos = {
            x: ((actionData.mousePos.x - lineOffset.x) / offsetByScale) - activeDocument.getWorldPosition().x / offsetByScale - (this.layer.transform.origin.x),
            y: ((actionData.mousePos.y - lineOffset.y) / offsetByScale) - activeDocument.getWorldPosition().y / offsetByScale - (this.layer.transform.origin.y)
        }
        actionData.mousePos = calculatedMousePos;
        this.addToData(<DrawPoint>actionData);
    }

    render(canvas: HTMLCanvasElement, activeDocument: PodDocument) {

        let drawPoints = this.getData();
        let utensil = canvas.getContext("2d");
        utensil.globalCompositeOperation = this.compositionOperation;
        utensil.lineWidth = this.utensilSize * activeDocument.getZoomScale();
        utensil.strokeStyle = `rgb(${this.fill.r}, ${this.fill.g}, ${this.fill.b}, ${this.fill.a})`;
        utensil.lineCap = "round";
        let offsetByScale = (activeDocument.getZoomScale() / activeDocument.getInitialZoomScale());

        for (let i = 1; i < drawPoints.length; i++) {
            let lastDrawPoint = this.getDrawPointBefore(i);
            let calculatedLastDrawPointX = ((((lastDrawPoint.mousePos.x) + this.layer.transform.origin.x) * offsetByScale) + activeDocument.getWorldPosition().x);
            let calculatedLastDrawPointY = ((((lastDrawPoint.mousePos.y) + this.layer.transform.origin.y) * offsetByScale) + activeDocument.getWorldPosition().y);
            let calculatedCurrentDrawPointX = ((((drawPoints[i].mousePos.x) + this.layer.transform.origin.x) * offsetByScale) + activeDocument.getWorldPosition().x);
            let calculatedCurrentDrawPointY = ((((drawPoints[i].mousePos.y) + this.layer.transform.origin.y) * offsetByScale) + activeDocument.getWorldPosition().y);
            utensil.beginPath();
            utensil.moveTo(
                calculatedLastDrawPointX,
                calculatedLastDrawPointY
                );
            utensil.lineTo(
                calculatedCurrentDrawPointX,
                calculatedCurrentDrawPointY);

            utensil.stroke();
        }

        utensil.beginPath();
        utensil.moveTo(
            ((this.layer.transform.bounds.x + this.layer.transform.origin.x) * offsetByScale) + activeDocument.getWorldPosition().x, 
            ((this.layer.transform.bounds.y + this.layer.transform.origin.y) * offsetByScale) + activeDocument.getWorldPosition().y);
        utensil.lineTo(
            ((this.layer.transform.bounds.x2 + this.layer.transform.origin.x) * offsetByScale) + activeDocument.getWorldPosition().x, 
            ((this.layer.transform.bounds.y + this.layer.transform.origin.y) * offsetByScale) + activeDocument.getWorldPosition().y);
        utensil.lineTo(
            ((this.layer.transform.bounds.x2 + this.layer.transform.origin.x) * offsetByScale) + activeDocument.getWorldPosition().x, 
            ((this.layer.transform.bounds.y2 + this.layer.transform.origin.y) * offsetByScale) + activeDocument.getWorldPosition().y);
        utensil.lineTo(
            ((this.layer.transform.bounds.x + this.layer.transform.origin.x) * offsetByScale) + activeDocument.getWorldPosition().x, 
            ((this.layer.transform.bounds.y2 + this.layer.transform.origin.y) * offsetByScale) + activeDocument.getWorldPosition().y);
        utensil.lineTo(
            ((this.layer.transform.bounds.x + this.layer.transform.origin.x) * offsetByScale) + activeDocument.getWorldPosition().x, 
            ((this.layer.transform.bounds.y + this.layer.transform.origin.y) * offsetByScale) + activeDocument.getWorldPosition().y);
        utensil.stroke();
        utensil.beginPath();
        utensil.ellipse(
            ((this.layer.getPivot().x + this.layer.transform.origin.x) * offsetByScale) + activeDocument.getWorldPosition().x, 
            ((this.layer.getPivot().y + this.layer.transform.origin.y) * offsetByScale) + activeDocument.getWorldPosition().y, 20, 20, 0, 0, 360);
        utensil.fillStyle = "orange";
        utensil.fill();
        this.resetGlobalComposition(canvas);
    }




    renderForFinal(canvas: HTMLCanvasElement, activeDocument: PodDocument) {
        let drawPoints = this.getData();
        let utensil = canvas.getContext("2d");
        utensil.globalCompositeOperation = this.compositionOperation;
        utensil.lineWidth = this.utensilSize;
        utensil.strokeStyle = `rgb(${this.fill.r}, ${this.fill.g}, ${this.fill.b}, ${this.fill.a})`;
        utensil.lineCap = "round";
        let offsetByScale = 1 / activeDocument.getInitialZoomScale();
        for (let i = 1; i < drawPoints.length; i++) {
            let lastDrawPoint = this.getDrawPointBefore(i);
            utensil.beginPath();
            utensil.moveTo(
                ((lastDrawPoint.mousePos.x + this.layer.transform.origin.x) * offsetByScale),
                ((lastDrawPoint.mousePos.y + this.layer.transform.origin.y) * offsetByScale));
            utensil.lineTo(
                ((drawPoints[i].mousePos.x + this.layer.transform.origin.x) * offsetByScale),
                ((drawPoints[i].mousePos.y + this.layer.transform.origin.y) * offsetByScale));

            utensil.stroke();
        }
        this.resetGlobalComposition(canvas);
    }

    onDrawAction(canvas: HTMLCanvasElement, mousePos: Vector2D, activeDocument: PodDocument) {
        let drawCanvas = canvas;
        let currentMousePos = { x: mousePos.x, y: mousePos.y };

        let utensil = drawCanvas.getContext("2d");
        utensil.globalCompositeOperation = this.compositionOperation;
        let lastDrawPoint = this.getLastDrawPoint();
        let zoomScale = activeDocument.getZoomScale();
        zoomScale > 1 ? 1 : zoomScale;
        utensil.beginPath();
        utensil.lineWidth = this.utensilSize * activeDocument.getZoomScale();
        utensil.strokeStyle = `rgba(${this.fill.r}, ${this.fill.g}, ${this.fill.b}, ${this.fill.a})`;
        utensil.lineCap = "round";
        let lineOffset = this.getOffset(canvas);
        let offsetByScale = activeDocument.getZoomScale() / activeDocument.getInitialZoomScale();
        utensil.moveTo(
            ((lastDrawPoint.mousePos.x + this.layer.transform.origin.x) * offsetByScale) + activeDocument.getWorldPosition().x,
            ((lastDrawPoint.mousePos.y + this.layer.transform.origin.y) * offsetByScale) + activeDocument.getWorldPosition().y);
        utensil.lineTo(
            (currentMousePos.x) - lineOffset.x,
            (currentMousePos.y) - lineOffset.y);
        utensil.stroke();
        let calculatedMousePos = {
            x: ((currentMousePos.x - lineOffset.x) / offsetByScale) - activeDocument.getWorldPosition().x / offsetByScale - (this.layer.transform.origin.x),
            y: ((currentMousePos.y - lineOffset.y) / offsetByScale) - activeDocument.getWorldPosition().y / offsetByScale - (this.layer.transform.origin.y)
        }
        this.getData().push({ mousePos: calculatedMousePos });
        
        
    }

    getOffset(canvas: HTMLCanvasElement): Vector2D {
        let canvasDimensions = canvas.getBoundingClientRect();
        return {
            x: canvasDimensions.x,
            y: canvasDimensions.y
        };
    }

    getData(): DrawPoint[] {
        return <DrawPoint[]>this.data;
    }

    getLastDrawPoint(): DrawPoint {
        if (this.data.length > 0) {
            return <DrawPoint>this.data[this.data.length - 1];
        }
        return null;
    }
    getDrawPointBefore(index: number): DrawPoint {
        if (this.data.length > 0) {
            return <DrawPoint>this.data[index - 1];
        }
        return null;
    }
    
    calculateBounds() {
        let drawPoints = this.getData();
        for (let i = 0; i < drawPoints.length; i++) {
            let drawPoint = this.getData()[i];
            this.layer.updateBounds(
                drawPoint.mousePos.x, 
                drawPoint.mousePos.y);
        }
    }
    

    rotate() {
        let drawPoints = this.getData();
        for (let i = 0; i < drawPoints.length; i++) {
            let currentPoint = this.getData()[i];
            let rotatedPoint = this.layer.rotatePoint(
                currentPoint.mousePos, 
                this.layer.transform.rotationAngle, 
                this.layer.getPivot());
            currentPoint.mousePos.x = rotatedPoint.x;
            currentPoint.mousePos.y = rotatedPoint.y;
        }
    }
    


}

export class EraserAction extends BrushAction {

    constructor(layer: Layer, actionData: ActionData) {
        super(layer, actionData);
        this.compositionOperation = "destination-out";
    }

    calculateBounds() {

    }
}
export interface PodDocMetaData {
    docName: string,
    podPreset: PodPreset,
    backgroundColor: BackgroundColor
}
export interface DrawPoint {
    mousePos: Vector2D;
}

export interface ActionData {
    pixel?: Vector2D;
    fill?: { r: number, g: number, b: number, a?: number }
    mousePos?: Vector2D;
    utensilSize?: number;
    htmlImageElement?: HTMLImageElement;
}