
import { PodFeature } from "../enums/pod-feature";
import { PodPreset } from "./pod-preset";
import { Vector2D } from "./vectors";

export class PodDocument {
    private metaData: PodDocMetaData;
    private layers: Layer[] = [];
    private layerCounter = 1;
    private activeLayer: Layer;


    constructor(metaData: PodDocMetaData) {
        this.metaData = metaData;
    }

    addLayer(index: number) {
        let layer = new Layer(`Layer ${this.layerCounter++}`);
        this.layers.splice(index, 0, layer);
        this.setActiveLayer(layer);
        return layer;
    }

    deleteLayer(index: number) {
        if (this.layers.length > 1)
            this.layers.splice(index, 1);
    }


    getZoomPercent() {
        return (this.metaData.zoomScale * 100).toFixed(2) + "%";
    }



    getZoomScale() {
        return this.metaData.zoomScale;
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

    setWorldPosition(position: Vector2D){
        this.metaData.worldPosition = position;
    }

    getActiveLayer(){
        return this.activeLayer;
    }

    setZoomScale(scale: number) {
        this.metaData.zoomScale = scale;
    }

    setActiveLayer(layer: Layer){
        this.activeLayer = layer;
    }


}

export interface PodDocMetaData {
    docName: string,
    podPreset: PodPreset,
    zoomScale: number;
    worldPosition: Vector2D;
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
            case PodFeature.FILL: 
                let fillAction = new FillAction(data);
                this.actions.push(fillAction);
                break;
        }
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
    constructor(actionData: ActionData){
        this.fill = actionData.fill;
        this.utensilSize = actionData.utensilSize;
    }
    render(canvas: HTMLCanvasElement) {

    }
    onDraw(canvas: HTMLCanvasElement, mousePos: Vector2D){
        
    }
    getData() {
        return this.data;
    }

    addToData<T extends DrawPoint>(data: DrawPoint) {
        this.data.push(<T>data);
    }
}

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
}

export class BrushAction extends LayerAction {

    render(canvas: HTMLCanvasElement) {
        let drawPoints = this.getData();
        let utensil = canvas.getContext("2d");
        
        for (let i = 1; i < drawPoints.length; i++) {
            let lastDrawPoint = this.getDrawPointBefore(i);
            let fill = this.fill;
            utensil.beginPath();
            utensil.lineWidth = this.utensilSize;
            utensil.strokeStyle = `rgb(${fill.r}, ${fill.g}, ${fill.b})`;
            utensil.lineCap = "round";
            utensil.moveTo(lastDrawPoint.mousePos.x, lastDrawPoint.mousePos.y);
            utensil.lineTo(drawPoints[i].mousePos.x, drawPoints[i].mousePos.y);
            utensil.stroke();
            utensil.closePath();
        }
    }
    onDraw(canvas: HTMLCanvasElement, mousePos: Vector2D){
        let drawCanvas = canvas;
        let currentMousePos = mousePos;
        let utensil = drawCanvas.getContext("2d");
        let lastDrawPoint = this.getLastDrawPoint();
        utensil.beginPath();
        utensil.lineWidth = this.utensilSize;
        utensil.strokeStyle = `rgb(${this.fill.r}, ${this.fill.g}, ${this.fill.b})`;
        utensil.lineCap = "round";
        
        utensil.moveTo(lastDrawPoint.mousePos.x, lastDrawPoint.mousePos.y);
        utensil.lineTo(currentMousePos.x, currentMousePos.y);
        utensil.stroke();
        this.getData().push(
          {
            mousePos: currentMousePos
          }
        );
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

