import { isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Inject, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { PodPreset, PresetMetric, PresetSize } from 'src/app/tools/classes/pod-preset';

@Component({
  selector: 'app-new-pod-window',
  templateUrl: './new-pod-window.component.html',
  styleUrls: ['./new-pod-window.component.css']
})
export class NewPodWindowComponent implements OnInit {

  @Output() action = new EventEmitter<NewPodWindowAction>();

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
      presetSize: PresetSize.LONG,
      w: 8.5,
      h: 11,
      ppi: 72,
      type: PresetMetric.INCHES,
      name: "Letter"
    })
  ];

  selectedPresetIndex = 0;

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
    metricsSelect.value = podPreset.type;
  }

  onCreateClick(){
    this.action.emit(NewPodWindowAction.CREATE);
  }
  onCloseClick(){
    this.action.emit(NewPodWindowAction.CLOSE);
  }

}


export enum NewPodWindowAction {
  CREATE,
  CLOSE
}