import { Component, Input, OnInit } from '@angular/core';
import { Layer, PodFeatures } from 'src/app/pages/pod/pod.component';

@Component({
  selector: 'app-layer',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.css']
})
export class LayerComponent implements OnInit {
  @Input() layer: Layer;
  @Input() selectedPodFeature: PodFeatures;

  editModeOn = false;

  constructor() { }

  ngOnInit(): void {
    try {

      window.onmousedown = (ev: MouseEvent) => {
        let canvas = document.querySelector("canvas");
        let pen = canvas.getContext("2d");
        this.editModeOn = true;
        pen.beginPath();
        pen.moveTo(ev.offsetX, ev.offsetY);
      }
      window.onmouseup = (ev: MouseEvent) => {
        this.editModeOn = false;
      }

    } catch (err) {

    }
  }

  onMouseMove(ev: MouseEvent, canvas: HTMLCanvasElement) {
    let pen = canvas.getContext("2d");
    if (!this.editModeOn) return;
    switch (this.selectedPodFeature) {
      case PodFeatures.BRUSH: this.brushMode(pen, ev); break;
      case PodFeatures.ERASER: this.eraserMode(pen, ev); break;
    }
  }

  onMouseEnter(ev: MouseEvent, canvas: HTMLCanvasElement) {
    let pen = canvas.getContext("2d");
    pen.beginPath();
    pen.moveTo(ev.offsetX, ev.offsetY);
  }

  onMouseDown(ev: MouseEvent, canvas: HTMLCanvasElement) {
    let pen = canvas.getContext("2d");
    this.editModeOn = true;
    pen.beginPath();
    pen.moveTo(ev.offsetX, ev.offsetY);
    
    if (!this.editModeOn) return;
    switch (this.selectedPodFeature) {
      case PodFeatures.BRUSH: this.brushMode(pen, ev); break;
      case PodFeatures.ERASER: this.eraserMode(pen, ev); break;
    }
  }

  brushMode(pen: CanvasRenderingContext2D, ev: MouseEvent) {
    pen.strokeStyle = `${'#000000'}`;
    pen.globalCompositeOperation = "source-over";
    let mouseX = ev.offsetX;
    let mouseY = ev.offsetY;
    pen.lineTo(mouseX, mouseY);
    pen.stroke();
  }

  eraserMode(pen: CanvasRenderingContext2D, ev: MouseEvent) {
    pen.beginPath();
    let mouseX = ev.offsetX;
    let mouseY = ev.offsetY;
    pen.globalCompositeOperation = "destination-out";
    pen.arc(mouseX, mouseY, (100/2), 0, Math.PI * 2, false);
    pen.fill();
    pen.closePath();
  }

}
