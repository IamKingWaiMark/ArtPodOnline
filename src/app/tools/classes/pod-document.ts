import { AppActionType } from "../enums/app-action-type";
import { PodFeature } from "../enums/pod-feature";
import { DrawActionData } from "../interfaces/app-action-data";
import { PodDocumentComponent } from "../pod-document/pod-document.component";
import { AppAction } from "./app-action";
import { PodPreset } from "./pod-preset";
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

    canDeleteLayer(){
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

    removeUndoAndRedoActionsWithLayerWhenDeleted(layer: Layer){
        let a = 0;
        for(let i = 0; i < this.undoActions.length; i++) {
            let actionLayer = this.undoActions[i].getLayer();
            if(actionLayer == layer) {
                this.undoActions.splice(i--, 1);
            }
            console.log(a++);
        }
        for(let i = 0; i < this.redoActions.length; i++) {
            let actionLayer = this.redoActions[i].getLayer();
            if(actionLayer == layer) {
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

}






export class Layer {
    name: string;
    visible = true;
    actions: LayerAction[] = [];
    podDocComp: PodDocumentComponent;
    snapshotImageSrc: string;
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

    setBackgroundColor(podDocComp: PodDocumentComponent, data: ActionData, addToUndoStack?: boolean){
        this.setPodDocComp(podDocComp);
        let action = new FillAction(this, data);
        this.actions.push(action);
        if(addToUndoStack) {
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

}


export class LayerAction {
    data: any [] = [];
    fill: { r: number, g: number, b: number, a?: number } = { r: 0, g: 0, b: 0, a: 1 };
    utensilSize: number;
    startTime: Date;
    layer: Layer;
    constructor(layer: Layer, actionData: ActionData) {
        this.layer = layer;
        this.fill = actionData.fill;
        this.fill.a = 1;
        this.utensilSize = actionData.utensilSize;
        this.startTime = new Date();
    }
    render(canvas: HTMLCanvasElement, activeDocument: PodDocument) {

    }

    renderForFinal(canvas: HTMLCanvasElement, activeDocument: PodDocument) {

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
}

export class FillAction extends LayerAction {
    currentScale: number;
    initialWorldPositionX: number;
    initialWorldPositionY: number;
    compositionOperation = "source-over";
    constructor(layer: Layer, actionData: ActionData) {
        super(layer, actionData);
        let temporaryCanvas = <HTMLCanvasElement>document.createElement("canvas");
        let drawCanvas = this.layer.podDocComp.RENDER_ACTIONS.getDrawCanvas();
        temporaryCanvas.width = drawCanvas.width;
        temporaryCanvas.height = drawCanvas.height;
        let activeDocument = this.layer.podDocComp.activePodDocument;
        this.currentScale = activeDocument.getZoomScale();
        this.initialWorldPositionX = activeDocument.getWorldPosition().x;
        this.initialWorldPositionY = activeDocument.getWorldPosition().y;
        this.turnCanvasToBlackAndWhite(actionData.mousePos.x, actionData.mousePos.y, drawCanvas, temporaryCanvas);
        this.findContours(actionData.mousePos.x, actionData.mousePos.y, drawCanvas, temporaryCanvas);
        this.render(drawCanvas, this.layer.podDocComp.activePodDocument);
    
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
        let redScope = 24;
        let greenScope = 24;
        let blueScope = 24;

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
        cv.findContours(src, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
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
        if(!c) return;
        let offsetByScale = activeDocument.getZoomScale() / this.currentScale;
        

        let utensil = canvas.getContext("2d");
        utensil.globalCompositeOperation = this.compositionOperation;
        utensil.beginPath();
        let p = { x: 0, y: 0 };
        p.x = (c.data32S[c.data32S.length - 2] * offsetByScale) + activeDocument.getWorldPosition().x - this.initialWorldPositionX * offsetByScale;
        p.y = (c.data32S[c.data32S.length - 1] * offsetByScale) + activeDocument.getWorldPosition().y - this.initialWorldPositionY * offsetByScale;
        utensil.moveTo(p.x, p.y);
        for (let j = c.data32S.length - 1; j >= 0; j -= 2) {
            let p = { x: 0, y: 0 };
            p.x = (c.data32S[j - 1] * offsetByScale) + activeDocument.getWorldPosition().x - this.initialWorldPositionX * offsetByScale;
            p.y = (c.data32S[j] * offsetByScale) + activeDocument.getWorldPosition().y - this.initialWorldPositionY * offsetByScale;
            utensil.lineTo(p.x, p.y);

        }
        utensil.closePath();
        for (let k = 1; k < this.data.length; k++) {
            let outsideContour = this.data[k];


            let p = { x: 0, y: 0 };
            p.x = (outsideContour.data32S[outsideContour.data32S.length - 2] * offsetByScale) + activeDocument.getWorldPosition().x - this.initialWorldPositionX * offsetByScale;
            p.y = (outsideContour.data32S[outsideContour.data32S.length - 1] * offsetByScale) + activeDocument.getWorldPosition().y - this.initialWorldPositionY * offsetByScale;

            utensil.moveTo(p.x, p.y);
            for (let j = outsideContour.data32S.length - 1; j >= 0; j -= 2) {
                let p = { x: 0, y: 0 };
                p.x = (outsideContour.data32S[j - 1] * offsetByScale) + activeDocument.getWorldPosition().x - this.initialWorldPositionX * offsetByScale;
                p.y = (outsideContour.data32S[j] * offsetByScale) + activeDocument.getWorldPosition().y - this.initialWorldPositionY * offsetByScale;
                utensil.lineTo(p.x, p.y);
            }
            utensil.closePath();

        }
        utensil.strokeStyle = `rgb(${this.fill.r}, ${this.fill.g}, ${this.fill.b})`;
        
        utensil.lineWidth = 4 * offsetByScale;
        utensil.stroke();
        utensil.fillStyle = `rgb(${this.fill.r}, ${this.fill.g}, ${this.fill.b})`;
        utensil.fill();

    }
}

export class BrushAction extends LayerAction {
    compositionOperation = "source-over";
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
            x: ((actionData.mousePos.x - lineOffset.x) / offsetByScale) - activeDocument.getWorldPosition().x / offsetByScale,
            y: ((actionData.mousePos.y - lineOffset.y) / offsetByScale) - activeDocument.getWorldPosition().y / offsetByScale
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
        let offsetByScale = activeDocument.getZoomScale() / activeDocument.getInitialZoomScale();
        for (let i = 1; i < drawPoints.length; i++) {
            let lastDrawPoint = this.getDrawPointBefore(i);
            utensil.beginPath();
            utensil.moveTo(
                (lastDrawPoint.mousePos.x * offsetByScale) + activeDocument.getWorldPosition().x /** offsetByScale*/,
                (lastDrawPoint.mousePos.y * offsetByScale) + activeDocument.getWorldPosition().y /** offsetByScale*/);
            utensil.lineTo(
                (drawPoints[i].mousePos.x * offsetByScale) + activeDocument.getWorldPosition().x /** offsetByScale*/,
                (drawPoints[i].mousePos.y * offsetByScale) + activeDocument.getWorldPosition().y /** offsetByScale*/);

            utensil.stroke();
        }

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
                (lastDrawPoint.mousePos.x * offsetByScale),
                (lastDrawPoint.mousePos.y * offsetByScale));
            utensil.lineTo(
                (drawPoints[i].mousePos.x * offsetByScale),
                (drawPoints[i].mousePos.y * offsetByScale));

            utensil.stroke();
        }
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
            (lastDrawPoint.mousePos.x * offsetByScale) + activeDocument.getWorldPosition().x,
            (lastDrawPoint.mousePos.y * offsetByScale) + activeDocument.getWorldPosition().y);
        utensil.lineTo(
            (currentMousePos.x) - lineOffset.x,
            (currentMousePos.y) - lineOffset.y);
        utensil.stroke();
        let calculatedMousePos = {
            x: ((currentMousePos.x - lineOffset.x) / offsetByScale) - activeDocument.getWorldPosition().x / offsetByScale,
            y: ((currentMousePos.y - lineOffset.y) / offsetByScale) - activeDocument.getWorldPosition().y / offsetByScale
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

}

export class EraserAction extends BrushAction {

    constructor(layer: Layer, actionData: ActionData) {
        super(layer, actionData);
        this.compositionOperation = "destination-out";
    }


}
export interface PodDocMetaData {
    docName: string,
    podPreset: PodPreset,
}
export interface DrawPoint {
    mousePos: Vector2D;
}

export interface ActionData {
    pixel?: Vector2D;
    fill?: { r: number, g: number, b: number, a?: number }
    mousePos?: Vector2D;
    utensilSize?: number;
}

