import { PodPreset } from "./pod-preset";

export class PodDocument {
    metaData: PodDocMetaData;
    layers: number [] = [1];


    constructor(metaData: PodDocMetaData) {
        this.metaData = metaData;
        this.metaData.zoomScale = 1;
        this.metaData.position = {x: 0, y: 0};
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


}

export interface PodDocMetaData {
    docName: string,
    podPreset: PodPreset,
    zoomScale: number;
    position: {x: number, y: number}
}