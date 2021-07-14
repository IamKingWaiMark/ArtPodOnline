
import { PodFeature } from "../enums/pod-feature";
import { PodPreset } from "./pod-preset";
import { Vector2D } from "./vectors";

export class PodDocument {
    private metaData: PodDocMetaData;
    private layers: Layer[] = [];
    private layerCounter = 1;
    private documentScale = 0;


    constructor(metaData: PodDocMetaData) {
        this.metaData = metaData;
        this.metaData.zoomScale = 1;
        this.metaData.position = { x: 0, y: 0 };
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

    addBackgroundLayer() {

    }

    getZoomPercent() {
        return (this.metaData.zoomScale * 100).toFixed(2) + "%";
    }

    setZoomScale(scale: number) {
        this.metaData.zoomScale = scale;
    }

    setPosition(x: number, y: number) {
        this.metaData.position = { x, y };
    }

    setDocumentScale(scale: number) {
        this.documentScale = scale;
    }

    getPosition() {
        return this.metaData.position;
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

    getDocumentScale() {
        return this.documentScale;
    }




}

export interface PodDocMetaData {
    docName: string,
    podPreset: PodPreset,
    zoomScale: number;
    position: { x: number, y: number }
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

    setAction(podFeature: PodFeature, data: DrawPoint){
        switch(podFeature) {
            case PodFeature.BRUSH: 
                let brushAction = new BrushAction();
                brushAction.addToData(data);
                this.actions.push(brushAction);
                break;
        }
    }
    getCurrentAction(){
        if(this.actions.length > 0) return this.actions[this.actions.length - 1];
        else return null;
    }
}

export interface DrawPoint {
    mousePos: Vector2D;
    fill: { r: number, g: number, b: number }
    utensilSize: number;
}
export class LayerAction {
    data: DrawPoint [] = [];

    render(canvas: HTMLCanvasElement) {

    }
    onDraw(canvas: HTMLCanvasElement, mousePos: Vector2D){
        
    }
    getData() {
        return this.data;
    }

    addToData(data: DrawPoint){
        this.data.push(data);
    }
}

export class BrushAction extends LayerAction {

    render(canvas: HTMLCanvasElement) {
        let drawPoints = this.getData();
        let utensil = canvas.getContext("2d");
        
        for (let i = 1; i < drawPoints.length; i++) {
            let lastDrawPoint = this.getLastDrawPointBefore(i);
            let fill = lastDrawPoint.fill;
            utensil.beginPath();
            utensil.lineWidth = lastDrawPoint.utensilSize;
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
        utensil.lineWidth = lastDrawPoint.utensilSize;
        utensil.strokeStyle = `rgb(${lastDrawPoint.fill.r}, ${lastDrawPoint.fill.g}, ${lastDrawPoint.fill.b})`;
        utensil.lineCap = "round";
        
        utensil.moveTo(lastDrawPoint.mousePos.x, lastDrawPoint.mousePos.y);
        utensil.lineTo(currentMousePos.x, currentMousePos.y);
        utensil.stroke();
        this.getData().push(
          {
            mousePos: currentMousePos, 
            fill: lastDrawPoint.fill,
            utensilSize: lastDrawPoint.utensilSize
          }
        );
    }

    getData(): DrawPoint [] {
        return this.data;
    }

    getLastDrawPoint(){
        if(this.data.length > 0) {
            return this.data[this.data.length - 1];
        } 
        return null;
    }
    getLastDrawPointBefore(index: number){
        if(this.data.length > 0) {
            return this.data[index - 1];
        } 
        return null;
    }

}

