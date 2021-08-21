import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PodDocument } from '../classes/pod-document';
import { Transform } from '../interfaces/transform-values';

@Component({
  selector: 'app-transform-bar',
  templateUrl: './transform-bar.component.html',
  styleUrls: ['./transform-bar.component.css']
})
export class TransformBarComponent implements OnInit {
  @Output() cancledSubscription = new EventEmitter<boolean>();
  @Output() acceptChangesSubscription = new EventEmitter<Transform>();
  @Output() transformChangesSubscription = new EventEmitter<Transform>();
  @Input() activePodDocument: PodDocument;
  readonly MAX_SCALE = 1000;
  readonly MIN_SCALE = 1;
  readonly MAX_ORIGIN = 100000;
  readonly MIN_ORIGIN = -100000;
  transformSnapshot: Transform;
  scaleX = 1;
  scaleY = 1;
  constructor() { }

  ngOnInit(): void { 
    this.transformSnapshot = {
      origin: {
        x: this.activePodDocument.getActiveLayer().transform.origin.x,
        y: this.activePodDocument.getActiveLayer().transform.origin.y
      },
      bounds: {
        x: this.activePodDocument.getActiveLayer().transform.bounds.x,
        y: this.activePodDocument.getActiveLayer().transform.bounds.y,
        x2: this.activePodDocument.getActiveLayer().transform.bounds.x2,
        y2: this.activePodDocument.getActiveLayer().transform.bounds.y2,
        w: this.activePodDocument.getActiveLayer().transform.bounds.w,
        h: this.activePodDocument.getActiveLayer().transform.bounds.h
      },
      rotationAngle: this.activePodDocument.getActiveLayer().transform.rotationAngle,
      scale: {
        x: this.activePodDocument.getActiveLayer().transform.scale.x,
        y: this.activePodDocument.getActiveLayer().transform.scale.y,
      }
    }
  }

  onCancelClick(){
    this.activePodDocument.getActiveLayer().transform = this.transformSnapshot;
    this.transformChangesSubscription.emit(this.transformSnapshot);
    this.cancledSubscription.emit(false);
  }

  onAcceptClick(){
    this.activePodDocument.getActiveLayer().transform.scale.x = this.transformSnapshot.scale.x * this.scaleX;
    this.activePodDocument.getActiveLayer().transform.scale.y = this.transformSnapshot.scale.y * this.scaleY;
    this.acceptChangesSubscription.emit(this.activePodDocument.getActiveLayer().transform);
  }

  onOriginXChanged(event: HTMLInputElement) {
    let x = "0";
    if(event.value) {
      x = event.value;
    } 
    let xToNumber = parseInt(x);
    xToNumber = xToNumber > this.MAX_ORIGIN? this.MAX_ORIGIN: xToNumber;
    xToNumber = xToNumber < this.MIN_ORIGIN? this.MIN_ORIGIN: xToNumber;
    this.activePodDocument.getActiveLayer().transform.origin.x = xToNumber;
    this.transformChangesSubscription.emit(this.activePodDocument.getActiveLayer().transform);
  }
  onOriginYChanged(event: HTMLInputElement) {
    let y = "0";
    if(event.value) {
      y = event.value;
    } 
    let yToNumber = parseFloat(y);
    yToNumber = yToNumber > this.MAX_ORIGIN? this.MAX_ORIGIN: yToNumber;
    yToNumber = yToNumber < this.MIN_ORIGIN? this.MIN_ORIGIN: yToNumber;
    this.activePodDocument.getActiveLayer().transform.origin.y = yToNumber;
    this.transformChangesSubscription.emit(this.activePodDocument.getActiveLayer().transform);
  }

  transformScaleXToPercent(){
    return `${this.scaleX * 100}`;
  }
  transformScaleYToPercent(){
    return `${this.scaleY * 100}`;
  }

  onScaleXChanged(scaleWInput: HTMLInputElement){
    let scaleX = "100";
    if(scaleWInput.value) {
      scaleX = scaleWInput.value;
    } 
    let scaleXToNumber =  Math.floor(parseFloat(scaleX.replace("%", "")));
    scaleXToNumber = scaleXToNumber > this.MAX_SCALE? this.MAX_SCALE: scaleXToNumber;
    scaleXToNumber = scaleXToNumber < this.MIN_SCALE? this.MIN_SCALE: scaleXToNumber;
    this.scaleX = scaleXToNumber / 100;

    this.transformChangesSubscription.emit({
      origin: this.activePodDocument.getActiveLayer().transform.origin,
      bounds: this.activePodDocument.getActiveLayer().transform.bounds,
      rotationAngle: this.activePodDocument.getActiveLayer().transform.rotationAngle,
      scale: {
        x: this.transformSnapshot.scale.x * this.scaleX,
        y: this.transformSnapshot.scale.y * this.scaleY
      }
      
    });
  }
  onScaleYChanged(scaleHInput: HTMLInputElement){
    let scaleY = "100";
    if(scaleHInput.value) {
      scaleY = scaleHInput.value;
    } 
    let scaleYToNumber =  Math.floor(parseFloat(scaleY.replace("%", "")));
    scaleYToNumber = scaleYToNumber > this.MAX_SCALE? this.MAX_SCALE: scaleYToNumber;
    scaleYToNumber = scaleYToNumber < this.MIN_SCALE? this.MIN_SCALE: scaleYToNumber;

    this.scaleY = scaleYToNumber / 100;
    this.transformChangesSubscription.emit({
      origin: this.activePodDocument.getActiveLayer().transform.origin,
      bounds: this.activePodDocument.getActiveLayer().transform.bounds,
      rotationAngle: this.activePodDocument.getActiveLayer().transform.rotationAngle,
      scale: {
        x: this.transformSnapshot.scale.x * this.scaleX,
        y: this.transformSnapshot.scale.y * this.scaleY
      }
      
    });
  }
}

