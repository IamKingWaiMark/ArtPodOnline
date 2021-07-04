import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PodPreset, PresetMetric } from '../classes/pod-preset';

@Component({
  selector: 'app-pod-preset',
  templateUrl: './pod-preset.component.html',
  styleUrls: ['./pod-preset.component.css']
})
export class PodPresetComponent implements OnInit {
  
  @Input() preset: PodPreset;
  @Input() selected: boolean;
  @Output() value = new EventEmitter<PodPreset>();
  
    

  constructor() { }

  ngOnInit(): void {
  }

  getDimensions(){
    var dimensionsText = "";
    switch(this.preset.type){
      case PresetMetric.PIXEL: 
        dimensionsText = `${this.preset.w * this.preset.ppi} x ${this.preset.h * this.preset.ppi} ${this.preset.type}`;
        break;
      case PresetMetric.INCHES: 
        dimensionsText = `${this.preset.w } x ${this.preset.h} ${this.preset.type} @ ${this.preset.ppi} ppi`;
        break;
    }

    return dimensionsText;
  }

  onPresetClick(){
    this.value.emit(this.preset);
  }

}


