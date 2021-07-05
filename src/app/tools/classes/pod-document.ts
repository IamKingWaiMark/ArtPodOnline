import { PodPreset } from "./pod-preset";

export class PodDocument {
    metaData: PodDocMetaData;
    layers: number [] = [1];

    constructor(metaData: PodDocMetaData) {
        this.metaData = metaData;
    }


}

export interface PodDocMetaData {
    docName: string,
    podPreset: PodPreset
}