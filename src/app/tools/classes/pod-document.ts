import { PodPreset } from "./pod-preset";

export class PodDocument {
    private metaData: PodDocMetaData;
    private layers: Layer [] = [];


    constructor(metaData: PodDocMetaData) {
        this.metaData = metaData;
        this.metaData.zoomScale = 1;
        this.metaData.position = {x: 0, y: 0};
    }

    addLayer(index: number){
        this.layers.splice(index, 0, new Layer(`Layer ${this.layers.length + 1}`));
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
    images: HTMLImageElement [] = [];
    name: string;
    visible = true;
    constructor(name: string){
        this.name = name;
    }
    addImage(dataUrl: string){
        let imageElement = new Image();
        imageElement.src = dataUrl;
        this.images.push(imageElement);
    }

    getVisibilityIconSrc(){
        return this.visible? "assets/icons/visibility_on_icon.png": "assets/icons/visibility_off_icon.png";
    }

    toggleVisibility(){
        this.visible = this.visible? false: true;
    }


}