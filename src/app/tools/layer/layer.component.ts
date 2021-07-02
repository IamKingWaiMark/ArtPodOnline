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
    /*try {
      window.addEventListener("mousedown", this.WINDOW_EVNT_onMouseDown);
      window.addEventListener("mouseup", this.WINDOW_EVNT_onMouseUp);
    } catch (err) {

    }*/
  }

  /*ngOnDestroy() {
    try {
      window.removeEventListener("mousedown", this.WINDOW_EVNT_onMouseDown);
      window.removeEventListener("mouseup", this.WINDOW_EVNT_onMouseUp);
    } catch (err) {

    }
  }

  WINDOW_EVNT_onMouseDown = (ev: MouseEvent) => {
    let canvas = document.querySelector("canvas");
    let pen = canvas.getContext("2d");
    this.editModeOn = true;
    pen.beginPath();
    pen.moveTo(ev.offsetX, ev.offsetY);
  }
  WINDOW_EVNT_onMouseUp = (ev: MouseEvent) => {
    this.editModeOn = false;
  }



  onMouseMove(ev: MouseEvent, canvas: HTMLCanvasElement) {
    if (!this.editModeOn || ev.button != 0) return;
    let pen = canvas.getContext("2d");
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


  brushMode(pen: CanvasRenderingContext2D, ev: MouseEvent) {
    pen.strokeStyle = `${'#000000'}`;
    pen.globalCompositeOperation = "source-over";
    let mouseX = ev.offsetX;
    let mouseY = ev.offsetY;
    pen.lineTo(mouseX, mouseY);
    pen.lineWidth = 10;
    pen.lineCap = "round";
    pen.stroke();
  }

  eraserMode(pen: CanvasRenderingContext2D, ev: MouseEvent) {
    pen.beginPath();
    let mouseX = ev.offsetX;
    let mouseY = ev.offsetY;
    pen.globalCompositeOperation = "destination-in";
    pen.arc(mouseX, mouseY, (100 / 2), 0, Math.PI * 2, false);
    pen.fill();
    pen.closePath();
  }*/

}
