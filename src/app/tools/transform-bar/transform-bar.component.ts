import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PodDocument } from '../classes/pod-document';

@Component({
  selector: 'app-transform-bar',
  templateUrl: './transform-bar.component.html',
  styleUrls: ['./transform-bar.component.css']
})
export class TransformBarComponent implements OnInit {
  @Output() cancledSubscription = new EventEmitter<boolean>();
  @Output() acceptChangesSubscription = new EventEmitter<TransformValues>();
  @Input() activePodDocument: PodDocument;
  constructor() { }

  ngOnInit(): void { 

  }

  onCancelClick(){
    this.cancledSubscription.emit(false);
  }

  onAcceptClick(){
    this.acceptChangesSubscription.emit({
      x: 0,
      y: 0,
      scaleW: 0,
      scaleH: 0,
      rotation: 0
    });
  }
}

export interface TransformValues {
  x: number,
  y: number,
  scaleW: number,
  scaleH: number,
  rotation: number
}
