import { PodPreset } from "./pod-preset";

export class PodDocument {
    metaData: PodDocMetaData;
    layers: number [] = [];

    constructor(metaData: PodDocMetaData) {
        this.metaData = metaData;
    }


}

export interface PodDocMetaData {
    docName: string,
    podPreset: PodPreset
}