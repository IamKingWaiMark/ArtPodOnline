export class PodPreset {
    DEFAULTS = {
        presetSize: PresetSize.SMALL,
        w: 0,
        h: 0,
        ppi: 0,
        type: PresetMetric.PIXEL,
        name: "Custom",
        presetImgUrl: "assets/icons/short_folder.png"
    }
    presetSize = this.DEFAULTS.presetSize;
    w = this.DEFAULTS.w;
    h = this.DEFAULTS.h;
    ppi = this.DEFAULTS.ppi;
    type = this.DEFAULTS.type;
    name = this.DEFAULTS.name;
    presetImgUrl = this.DEFAULTS.presetImgUrl;

    constructor(preset: {presetSize: PresetSize, w: number, h: number, ppi: number, type: PresetMetric, name: string}){
        this.presetSize = preset.presetSize;
        this.w = preset.w;
        this.h = preset.h;
        this.ppi = preset.ppi;
        this.type = preset.type;
        this.name = preset.name;
        this.presetImgUrl = this.getPresetImgUrlFrom(this.presetSize);
    }

    getPresetImgUrlFrom(presetSize: PresetSize){
        switch(presetSize) {
            case PresetSize.LONG: return "assets/icons/long_folder.png";
            case PresetSize.SMALL: return "assets/icons/short_folder.png";
            case PresetSize.VERTICAL: return "assets/icons/verticle_folder.png"
        }
    }

}

export enum PresetSize {
    SMALL,
    LONG,
    VERTICAL
}

export enum PresetMetric {
    PIXEL = "px",
    INCHES = "in"
}