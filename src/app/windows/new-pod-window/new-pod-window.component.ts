import { isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { PodDocMetaData, PodDocument } from 'src/app/tools/classes/pod-document';
import { PodPreset, PresetMetric, PresetSize } from 'src/app/tools/classes/pod-preset';

@Component({
  selector: 'app-new-pod-window',
  templateUrl: './new-pod-window.component.html',
  styleUrls: ['./new-pod-window.component.css']
})
export class NewPodWindowComponent implements OnInit {
  @Input() podDocuments: PodDocument [];
  @Output() action = new EventEmitter<NewPodWindowActionData>();

  presets = [
    new PodPreset({
      presetSize: PresetSize.LONG,
      w: 1920,
      h: 1080,
      ppi: 1,
      type: PresetMetric.PIXEL,
      name: "Wallpaper"
    }),
    new PodPreset({
      presetSize: PresetSize.VERTICAL,
      w: 1080,
      h: 1920,
      ppi: 1,
      type: PresetMetric.PIXEL,
      name: "Poster"
    }),
    new PodPreset({
      presetSize: PresetSize.VERTICAL,
      w: 8.5,
      h: 11,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "Letter"
    }),
    new PodPreset({
      presetSize: PresetSize.VERTICAL,
      w: 33.1,
      h: 46.8,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A0"
    }),
    new PodPreset({
      presetSize: PresetSize.VERTICAL,
      w: 23.4,
      h: 33.1,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A1"
    }),
    new PodPreset({
      presetSize: PresetSize.VERTICAL,
      w: 16.5,
      h: 23.4,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A2"
    }),
    new PodPreset({
      presetSize: PresetSize.VERTICAL,
      w: 11.7,
      h: 16.5,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A3"
    }),
    new PodPreset({
      presetSize: PresetSize.VERTICAL,
      w: 8.3,
      h: 11.7,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A4"
    }),
    new PodPreset({
      presetSize: PresetSize.SMALL,
      w: 5.8,
      h: 8.3,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A5"
    }),
    new PodPreset({
      presetSize: PresetSize.SMALL,
      w: 4.1,
      h: 5.8,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A6"
    }),
    new PodPreset({
      presetSize: PresetSize.SMALL,
      w: 2.9,
      h: 4.1,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A7"
    }),
    new PodPreset({
      presetSize: PresetSize.SMALL,
      w: 2.0,
      h: 2.9,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A8"
    }),
    new PodPreset({
      presetSize: PresetSize.SMALL,
      w: 1.5,
      h: 2.0,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A9"
    }),
    new PodPreset({
      presetSize: PresetSize.SMALL,
      w: 1,
      h: 1.5,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "A10"
    })
  ];
  private readonly MAX_PIXELS = 5000;
  private readonly MAX_INCHES = 35;
  private readonly MAX_PIXELS_PER_INCH = 300;
  selectedPresetIndex = 0;
  maxDimensions = 5000;
  maxPPI = this.MAX_PIXELS_PER_INCH;
  selectedMetrics: PresetMetric = PresetMetric.PIXEL;
 
  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platform)) {
      this.setDocumentMetrics(this.presets[0]);
    }
    
  }

  onPresetClick(index: number) {
    this.selectedPresetIndex = index;
  }
  onPresetValueReceived(podPreset: PodPreset) {
    this.setDocumentMetrics(podPreset);
  }

  setDocumentMetrics(podPreset: PodPreset) {
    let widthInput = <HTMLInputElement>document.getElementById("pod-window-width-input");
    widthInput.value = podPreset.w + "";
    let heightInput = <HTMLInputElement>document.getElementById("pod-window-height-input");
    heightInput.value = podPreset.h + "";
    let ppiInput = <HTMLInputElement>document.getElementById("pod-window-ppi-input");
    ppiInput.value = podPreset.ppi + "";
    let metricsSelect = <HTMLSelectElement>document.getElementById("pod-window-metrics-select");
    this.selectedMetrics = metricsSelect.value = podPreset.type;
  }

  getDocumentMetaData() {
    let widthInput = <HTMLInputElement>document.getElementById("pod-window-width-input");
    let heightInput = <HTMLInputElement>document.getElementById("pod-window-height-input");
    let ppiInput = <HTMLInputElement>document.getElementById("pod-window-ppi-input");
    let nameInout = <HTMLInputElement>document.getElementById("pod-window-title-input");
    let presetData = new PodPreset(
      {
        presetSize: null,
        w: parseInt(widthInput.value),
        h: parseInt(heightInput.value),
        ppi: parseInt(ppiInput.value),
        type: this.selectedMetrics,
        name: null
      }
    );

    return <PodDocMetaData> {
      docName: nameInout.value,
      podPreset: presetData
    };
  } 

  metricSelectValueToPresetMetric(metrics: string): PresetMetric{
    switch(metrics) {
      case "px": return PresetMetric.PIXEL;
      case "in": return PresetMetric.INCHES;
    }
    return PresetMetric.PIXEL;
  }

  onCreateClick(){
    this.action.emit({
      newPodWindowAction: NewPodWindowAction.CREATE,
      podDocument: new PodDocument(this.getDocumentMetaData())
    });
  }
  onCloseClick(){
    this.action.emit({
      newPodWindowAction: NewPodWindowAction.CLOSE
    });
  }

  hasPodDocuments(){
    try {
      return this.podDocuments.length > 0;
    } catch (err) {
      return false;
    }
  }

  onMetricsClick(){
    let metricsSelector = <HTMLSelectElement> document.getElementById("pod-window-metrics-select");

    if(!metricsSelector || metricsSelector.value.length < 0) return;
    this.selectedMetrics = this.metricSelectValueToPresetMetric(metricsSelector.value);
    switch(this.selectedMetrics) {
      case PresetMetric.PIXEL:
        this.maxPPI = 1;
        this.maxDimensions = this.MAX_PIXELS; 
        this.clampPPIAndDimensionsForPixels();
        break;
      case PresetMetric.INCHES:
        this.maxPPI = this.MAX_PIXELS_PER_INCH;
        this.maxDimensions = this.MAX_INCHES;
        this.clampPPIAndDimensionsForInches();
        break;
    }
  }
  clampPPIAndDimensionsForPixels() {
    let widthInput = <HTMLInputElement> document.getElementById("pod-window-width-input");
    let heightInput = <HTMLInputElement> document.getElementById("pod-window-height-input");
    let ppiInput = <HTMLInputElement> document.getElementById("pod-window-ppi-input");
    let w = parseInt(widthInput.value);
    let h = parseInt(heightInput.value);
    widthInput.value = w > this.MAX_PIXELS? this.MAX_PIXELS + "": w + "";
    heightInput.value = h > this.MAX_PIXELS? this.MAX_PIXELS + "": h + "";
    ppiInput.value = "1";
    
  }
  clampPPIAndDimensionsForInches() {
    let widthInput = <HTMLInputElement> document.getElementById("pod-window-width-input");
    let heightInput = <HTMLInputElement> document.getElementById("pod-window-height-input");
    let ppiInput = <HTMLInputElement> document.getElementById("pod-window-ppi-input");
    let w = parseInt(widthInput.value);
    let h = parseInt(heightInput.value);
    let ppi = parseInt(ppiInput.value);
    widthInput.value = w > this.MAX_INCHES? this.MAX_INCHES + "": w + "";
    heightInput.value = h > this.MAX_INCHES? this.MAX_INCHES + "": h + "";
    ppiInput.value = ppi > this.MAX_PIXELS_PER_INCH? this.MAX_PIXELS_PER_INCH + "": ppi + "";
    
  }

  shouldNotDisplayPPIInput(){
    return this.selectedMetrics == PresetMetric.PIXEL;
  }


}


export enum NewPodWindowAction {
  CREATE,
  CLOSE
}

export interface NewPodWindowActionData {
  newPodWindowAction: NewPodWindowAction;
  podDocument?: PodDocument;
}