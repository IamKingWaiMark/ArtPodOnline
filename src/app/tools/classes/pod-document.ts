
import { PodPreset } from "./pod-preset";
import { Vector2D } from "./vectors";

export class PodDocument {
    private metaData: PodDocMetaData;
    private layers: Layer [] = [];
    private layerCounter = 1;


    constructor(metaData: PodDocMetaData) {
        this.metaData = metaData;
        this.metaData.zoomScale = 1;
        this.metaData.position = {x: 0, y: 0};
    }

    addLayer(index: number){
        let layer = new Layer(`Layer ${this.layerCounter++}`);
        this.layers.splice(index, 0, layer);
        return layer;
    }

    deleteLayer(index: number){
        if(this.layers.length > 1)
            this.layers.splice(index, 1);
    }

    addBackgroundLayer(){
        
    }

    getZoomPercent(){
        return (this.metaData.zoomScale * 100).toFixed(2) + "%";
    }

    setZoomScale(scale: number){
        this.metaData.zoomScale = scale;
    }

    setPosition(x: number, y: number) {
        this.metaData.position = {x, y};
    }

    getPosition(){
        return this.metaData.position;
    }

    getZoomScale(){
        return this.metaData.zoomScale;
    }

    getWidth(){
        return this.metaData.podPreset.w * this.metaData.podPreset.ppi;
    }

    getHeight(){
        return this.metaData.podPreset.h * this.metaData.podPreset.ppi;
    }

    getLayers(){
        return this.layers;
    }




}

export interface PodDocMetaData {
    docName: string,
    podPreset: PodPreset,
    zoomScale: number;
    position: {x: number, y: number}
}


export class Layer {
    images: {src: HTMLImageElement, imageDimensions: ImageDimenions} [] = [];
    name: string;
    visible = true;
    drawPoints: {mousePos: Vector2D, fill: {r: number, g: number, b: number}}[] = []


    constructor(name: string){
        this.name = name;
    }
    addImage(dataUrl: string, imageDimensions: ImageDimenions){
        let imageElement = new Image();
        imageElement.src = dataUrl;
        this.images.push({
            src: imageElement,
            imageDimensions: imageDimensions
        });
    }

    getVisibilityIconSrc(){
        return this.visible? "assets/icons/visibility_on_icon.png": "assets/icons/visibility_off_icon.png";
    }

    toggleVisibility(){
        this.visible = this.visible? false: true;
    }

}

export interface ImageDimenions {
    xAxis: {x1: number, x2: number},
    yAxis: {y1: number, y2: number}
    w: number,
    h: number
}