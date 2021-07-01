import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pod',
  templateUrl: './pod.component.html',
  styleUrls: ['./pod.component.css']
})
export class PodComponent implements OnInit {
  layers: Layer [] = [];
  GLOBAL_spacebarPressed = true;
  selectedPodFeature: PodFeatures;
  hideCursor = false;
  eraserRadius = 100;
  
  constructor() { }

  ngOnInit(): void {
    this.layers.push(new Layer(500, 500, "#FFFFFF", true)); 
    this.addWindowKeyEvents();
  }

  private addWindowKeyEvents(){
    try {
      window.onkeydown = (event) => {
        switch(event.key) {
          case " ": this.onSpacebarPressed();
            break;
        }
      }
      window.onkeyup = (event) => {
        switch(event.key) {
          case " ": this.onSpacebarReleased();
            break;
        }
      }
    } catch (eer) {

    }
  }

  onFeatureChanged(selectedFeature: string) {
    switch(selectedFeature) {
      case "MOVE": this.selectedPodFeature = PodFeatures.MOVE; break;
      case "BRUSH": this.selectedPodFeature = PodFeatures.BRUSH; break;
      case "ERASER": this.selectedPodFeature = PodFeatures.ERASER; break;
    }

  }

  onSpacebarPressed(){
    this.GLOBAL_spacebarPressed = true;
  }
  onSpacebarReleased(){
    this.GLOBAL_spacebarPressed = false;
  }

  onMouseMoveOnPodDiv(ev: MouseEvent, podDiv: HTMLDivElement) {
    
    let podCursorSpanEle = <HTMLSpanElement>document.getElementById("pod-cursor");


    switch(this.selectedPodFeature) {
      case PodFeatures.ERASER: this.eraserCursor(podCursorSpanEle, ev, podDiv); break;
      default: this.defaultCursor(podCursorSpanEle, podDiv);
    } 

  }

  eraserCursor(podCursorSpanEle: HTMLSpanElement, ev: MouseEvent, podDiv: HTMLDivElement){
    podDiv.style.cursor = "none"
    let podDivDimensions = podDiv.getBoundingClientRect();
    let mouseX = ev.x;
    let mouseY = ev.y;
    podCursorSpanEle.style.left = `${mouseX - (this.eraserRadius / 2) - podDivDimensions.x}px`;
    podCursorSpanEle.style.top = `${mouseY - (this.eraserRadius / 2) - podDivDimensions.y}px`;
    podCursorSpanEle.style.border = "1px solid white";
    podCursorSpanEle.style.borderRadius = `${50}%`;
    podCursorSpanEle.style.width = `${this.eraserRadius}px`;
    podCursorSpanEle.style.height = `${this.eraserRadius}px`;
  }

  defaultCursor(podCursorSpanEle: HTMLSpanElement, podDiv: HTMLDivElement){
    podDiv.style.cursor = "auto"

    podCursorSpanEle.style.left = `unset`;
    podCursorSpanEle.style.top = `unset`;
    podCursorSpanEle.style.border = `unset`;
    podCursorSpanEle.style.borderRadius = `unset`;
    podCursorSpanEle.style.width = `unset`;
    podCursorSpanEle.style.height = `unset`;
  }

}


export class Layer {
  width: number;
  height: number;
  style: string = "";
  constructor(width: number, height: number, backgroundColor: string, center?: boolean){
    this.width = width;
    this.height = height;
    this.style += `background-color: ${backgroundColor};`;
    if(center) {
      this.centerLayerInsidePodLayersDiv();
    } else {

    }
    
  }


  private centerLayerInsidePodLayersDiv(){
    try {
      let podLayersDivDimensions = (<HTMLDivElement>document.getElementById("pod-layers")).getBoundingClientRect();
      this.style += `left: ${(podLayersDivDimensions.width / 2) - (this.width/2)}px; 
                    top: ${(podLayersDivDimensions.height / 2) - (this.height/2)}px`;
    } catch (err) {

    }
  }


}

export enum PodFeatures {
  MOVE,
  BRUSH,
  ERASER="#00000000"
}