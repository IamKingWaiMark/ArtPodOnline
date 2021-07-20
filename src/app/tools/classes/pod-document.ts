
import { PodFeature } from "../enums/pod-feature";
import { PodPreset } from "./pod-preset";
import { Vector2D } from "./vectors";

export class PodDocument {
    private metaData: PodDocMetaData;
    private layers: Layer[] = [];
    private layerCounter = 1;
    private activeLayer: Layer;
    private zoomScale: number;
    private initialZoomScale: number = null;
    private worldPosition: Vector2D;

    constructor(metaData: PodDocMetaData) {
        this.metaData = metaData;
        this.setWorldPosition({x: 0, y:0});
    }

    addLayer(index: number) {
        let layer = new Layer(`Layer ${this.layerCounter++}`);
        this.layers.splice(index, 0, layer);
        return layer;
    }

    deleteLayer(index: number) {
        if (this.layers.length > 1)
            this.layers.splice(index, 1);
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

    getWorldPosition(){
        return this.worldPosition;
    }
    setWorldPosition(position: Vector2D){
        this.worldPosition = position;
    }

    getActiveLayer(){
        return this.activeLayer;
    }

    getInitialZoomScale(){
        return this.initialZoomScale;
    }

    setZoomScale(scale: number) {
        this.zoomScale = scale;
    }

    setActiveLayer(layer: Layer){
        this.activeLayer = layer;
    }

    setInitialZoomScale(scale: number){
        if(this.initialZoomScale == null) this.initialZoomScale = scale;
    }


}


export class Layer {
    name: string;
    visible = true;
    actions: LayerAction [] = [];
    constructor(name: string) {
        this.name = name;
    }
    getVisibilityIconSrc() {
        return this.visible ? "assets/icons/visibility_on_icon.png" : "assets/icons/visibility_off_icon.png";
    }

    toggleVisibility() {
        this.visible = this.visible ? false : true;
    }

    setAction(podFeature: PodFeature, data: ActionData){
        switch(podFeature) {
            case PodFeature.BRUSH: 
                let brushAction = new BrushAction(data);
                brushAction.addToData(<DrawPoint>data);
                this.actions.push(brushAction);
                break;
        }
    }

    offsetMousePosWithScale(mousePos: Vector2D, activeDocument: PodDocument) {
        let offsetByScale = activeDocument.getZoomScale() / activeDocument.getInitialZoomScale();
        
        return {x: mousePos.x / offsetByScale, y: mousePos.y / offsetByScale}
    }
    getCurrentAction(){
        if(this.actions.length > 0) return this.actions[this.actions.length - 1];
        else return null;
    }
}


export class LayerAction {
    data: DrawPoint [] = [];
    fill: {r: number, g: number, b: number} = {r: 0, g: 0, b: 0};
    utensilSize: number;
    startTime: Date;
    constructor(actionData: ActionData){
        this.fill = actionData.fill;
        this.utensilSize = actionData.utensilSize;
        this.startTime = new Date();
    }
    render(canvas: HTMLCanvasElement, activeDocument: PodDocument) {

    }
    onDraw(canvas: HTMLCanvasElement, mousePos: Vector2D, activeDocument: PodDocument){
        let nowTime = new Date();
        let elapsed = nowTime.getTime() - this.startTime.getTime();
        
        if(elapsed >= 17 || elapsed == 0) {
            this.startTime = nowTime;
        } else {
            return;
        }
        this.onDrawAction(canvas, mousePos, activeDocument);
        
    }

    onDrawAction(canvas: HTMLCanvasElement, mousePos: Vector2D, activeDocument: PodDocument){

    }
    getData() {
        return this.data;
    }

    addToData<T extends DrawPoint>(data: DrawPoint) {
        this.data.push(<T>data);
    }
}


export class BrushAction extends LayerAction {

    render(canvas: HTMLCanvasElement, activeDocument: PodDocument) {
        let drawPoints = this.getData();
        let utensil = canvas.getContext("2d");
        utensil.lineWidth = this.utensilSize * activeDocument.getZoomScale();
        let fill = this.fill;
        utensil.strokeStyle = `rgb(${fill.r}, ${fill.g}, ${fill.b})`;
        utensil.lineCap = "round";
        let offsetByScale = activeDocument.getZoomScale() / activeDocument.getInitialZoomScale();
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

    onDrawAction(canvas: HTMLCanvasElement, mousePos: Vector2D, activeDocument: PodDocument){
        let drawCanvas = canvas;
        let currentMousePos = {x: mousePos.x, y: mousePos.y};

        let utensil = drawCanvas.getContext("2d");
        let lastDrawPoint = this.getLastDrawPoint();

        utensil.beginPath();
        utensil.lineWidth = this.utensilSize * activeDocument.getZoomScale();
        utensil.strokeStyle = `rgb(${this.fill.r}, ${this.fill.g}, ${this.fill.b})`;
        utensil.lineCap = "round";
        let lineOffset = this.getOffset(canvas, activeDocument);
        let offsetByScale = activeDocument.getZoomScale() / activeDocument.getInitialZoomScale();
        utensil.moveTo(
            (lastDrawPoint.mousePos.x * offsetByScale),
            (lastDrawPoint.mousePos.y * offsetByScale));
        utensil.lineTo(
            (currentMousePos.x) - lineOffset.x, 
            (currentMousePos.y) - lineOffset.y);
        utensil.stroke();
        let calculatedMousePos = {x: (currentMousePos.x - lineOffset.x) / offsetByScale, y: (currentMousePos.y - lineOffset.y) / offsetByScale}
        this.getData().push( {mousePos: calculatedMousePos});
    }

    getOffset(canvas: HTMLCanvasElement, activeDocument: PodDocument): Vector2D{
        let canvasDimensions = canvas.getBoundingClientRect();
        return {
            x: canvasDimensions.x + activeDocument.getWorldPosition().x, 
            y: canvasDimensions.y + activeDocument.getWorldPosition().y};
    }

    getData(): DrawPoint [] {
        return <DrawPoint []>this.data;
    }

    getLastDrawPoint(): DrawPoint {
        if(this.data.length > 0) {
            return <DrawPoint>this.data[this.data.length - 1];
        } 
        return null;
    }
    getDrawPointBefore(index: number): DrawPoint {
        if(this.data.length > 0) {
            return <DrawPoint>this.data[index - 1];
        } 
        return null;
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
    fill?: { r: number, g: number, b: number }
    mousePos?: Vector2D;
    utensilSize?: number;
}

/*

export class FillAction extends LayerAction {
    fillDetectorColor: {r: number, g: number, b: number};
    onDraw(canvas: HTMLCanvasElement, mousePos: Vector2D){
        let utensil = canvas.getContext("2d");
        utensil.fillStyle = "rgb(255,0,0)";
        utensil.fillRect(0, 0, canvas.width, canvas.height);
        this.fillDetectorColor = {r: 255, g: 0, b: 0};
        this.fillArea(mousePos, utensil);
        

    }
    fillArea(startPixel: Vector2D, utensil: CanvasRenderingContext2D) {

    } 
    pixelIsSameAsFill(pixelPos: Vector2D, utensil: CanvasRenderingContext2D){
        let pixelColor = this.getPixelColorAt(pixelPos, utensil);
        let matchRed = pixelColor.r == this.fill.r;
        let matchGreen = pixelColor.g == this.fill.g;
        let matchBlue = pixelColor.b == this.fill.b;
        return matchRed && matchGreen && matchBlue;
    }
    pixelIsInside(pixelPos: Vector2D, utensil: CanvasRenderingContext2D){
        let pixelColor = this.getPixelColorAt(pixelPos, utensil);
        let matchRed = pixelColor.r == this.fillDetectorColor.r;
        let matchGreen = pixelColor.g == this.fillDetectorColor.g;
        let matchBlue = pixelColor.b == this.fillDetectorColor.b;
        return matchRed && matchGreen && matchBlue;
    }

    getPixelColorAt(pixelPos: Vector2D, utensil: CanvasRenderingContext2D){
        let pixelColorOnCanvas = utensil.getImageData(pixelPos.x, pixelPos.y, 1, 1);
        return {r: pixelColorOnCanvas.data[0], g: pixelColorOnCanvas.data[1], b: pixelColorOnCanvas.data[2]};
    }
    getData(): DrawPoint [] {
        return <DrawPoint []>this.data;
    }

    getLastDrawPoint(){
        if(this.data.length > 0) {
            return this.data[this.data.length - 1];
        } 
        return null;
    }
}*/