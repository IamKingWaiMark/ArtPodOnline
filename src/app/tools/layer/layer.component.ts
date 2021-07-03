import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { FeatureInfo, Layer, PodFeatures } from 'src/app/pages/pod/pod.component';

@Component({
  selector: 'app-layer',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.css']
})
export class LayerComponent implements OnInit {
  @Input() layer: Layer;
  @Input() selectedPodFeature: PodFeatures;
  @Input() FEATURE_INFO: FeatureInfo;
  
  editModeOn = false;

  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platform)){
      window.addEventListener("mousedown", this.WINDOW_EVNT_onMouseDown);
        window.addEventListener("mouseup", this.WINDOW_EVNT_onMouseUp);
    }
  }
  onMouseMove(ev: MouseEvent, canvas: HTMLCanvasElement) {
    let pen = canvas.getContext("2d");
    switch (this.selectedPodFeature) {
      case PodFeatures.BRUSH: this.brushMode(pen, ev); break;
      case PodFeatures.ERASER: this.eraserMode(pen, ev); break;
    }
  }
  brushMode(pen: CanvasRenderingContext2D, ev: MouseEvent) {
    if(!this.editModeOn) return;
    let brushColor = this.FEATURE_INFO.getBrushColor();
    pen.strokeStyle = `rgb(${brushColor.r}, ${brushColor.g}, ${brushColor.b})`;
    pen.globalCompositeOperation = "source-over";
    let mouseX = ev.offsetX;
    let mouseY = ev.offsetY;
    pen.lineWidth = this.FEATURE_INFO.getBrushSize();
    pen.lineCap = "round";
    pen.lineTo(mouseX, mouseY);


    pen.stroke();

  }

  eraserMode(pen: CanvasRenderingContext2D, ev: MouseEvent) {
    if(!this.editModeOn) return;
    pen.beginPath();
    let mouseX = ev.offsetX;
    let mouseY = ev.offsetY;
    pen.globalCompositeOperation = "destination-out";
    pen.arc(mouseX, mouseY, (this.FEATURE_INFO.getEraserSize() / 2), 0, Math.PI * 2, false);
    pen.fill();
    pen.closePath();
  }
  ngOnDestroy() {
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
    pen.moveTo(ev.x, ev.y);

  }
  WINDOW_EVNT_onMouseUp = (ev: MouseEvent) => {
    this.editModeOn = false;
  }




  onMouseEnter(ev: MouseEvent, canvas: HTMLCanvasElement) {
    let pen = canvas.getContext("2d");
    pen.beginPath();
    pen.moveTo(ev.offsetX, ev.offsetY);
  }




}
