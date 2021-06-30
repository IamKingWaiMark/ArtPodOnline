import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pod',
  templateUrl: './pod.component.html',
  styleUrls: ['./pod.component.css']
})
export class PodComponent implements OnInit {
  layers: Layer [] = [];
  GLOBAL_spacebarPressed = true;


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

  onSpacebarPressed(){
    this.GLOBAL_spacebarPressed = true;
    
  }
  onSpacebarReleased(){
    this.GLOBAL_spacebarPressed = false;
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