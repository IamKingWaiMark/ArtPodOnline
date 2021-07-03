import { isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { GlobalEvents, HotKey } from '../classes/global-events';

import { Swatch } from '../classes/swatch';

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.css']
})
export class ColorPickerComponent implements OnInit {
  @Input() GLOBAL_EVENTS: GlobalEvents;
  @Output() selectedColor = new EventEmitter<Swatch>();

  colorPicker = new ColorPicker(this.selectedColor);
  colorPickerMode: ColorPickerMode = null;
  leftClicked = false;


  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {

    if (isPlatformBrowser(this.platform)) {
      this.subscribeToSelectedColor();
      this.colorPicker.createColorPickerSlider();
      this.colorPicker.createColorPicker();
      this.colorPicker.emitSwatch();
      this.subscribeToGlobalEvents();
      
    }

  }
  subscribeToSelectedColor() {
    this.selectedColor.subscribe(
      (swatch: Swatch) => {
        this.colorPicker.setColorPickerSliderPointerPosition(swatch);
        this.colorPicker.changeColorPickerColor(swatch);
        this.colorPicker.setColorPickerCirclePosition(swatch);
        this.colorPicker.setSwatchesColor();
        //this.colorPicker.setSwatchesColor(<HTMLDivElement>document.querySelector(".color-picker-swatches"), color);
      }
    );
  }
  subscribeToGlobalEvents() {
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_MOVE_EVENT.subscribe(
      (ev: MouseEvent) => {
        if (this.leftClicked) {

          switch (this.colorPickerMode) {
            case ColorPickerMode.PICKER:
              this.colorPicker.setMainSwatchCirclePosition(ev);
              break;
            case ColorPickerMode.SLIDER:
              this.colorPicker.setMainSwatchSliderPosition(ev);
              break;
          }

        }
      }
    );

    this.GLOBAL_EVENTS.GLOBAL_MOUSE_UP_EVENT.subscribe(
      (ev: MouseEvent) => {
        this.leftClicked = false;
        this.colorPickerMode = null;
      }
    );


    this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.subscribe(
      (hotkey: HotKey) => {
        switch (hotkey) {
          case HotKey.SWAP_SWATCH:
            this.colorPicker.swapSwatch();
            this.colorPicker.emitSwatch();
            break;
        }
      }
    );
  }




  COLOR_PICKER_SLIDER_onMouseDown(ev: MouseEvent, colorPickerSlider: HTMLCanvasElement, colorPicker: HTMLCanvasElement) {

    switch (ev.button) {
      case 0:
        this.leftClicked = true;
        this.colorPickerMode = ColorPickerMode.SLIDER;
        this.colorPicker.setMainSwatchSliderPosition(ev);
        break;
    }
  }

  COLOR_PICKER_onMouseDown(ev: MouseEvent, colorPicker: HTMLCanvasElement) {

    switch (ev.button) {
      case 0:
        this.leftClicked = true;
        this.colorPickerMode = ColorPickerMode.PICKER;
        this.colorPicker.setMainSwatchCirclePosition(ev);
        break;
    }
  }

  COLOR_SELECTOR_CIRCLE_onMouseMove(ev: MouseEvent) {
    if (this.leftClicked) {

    }
  }
}


export enum ColorPickerMode {
  SLIDER,
  PICKER
}

export class ColorPicker {

  readonly pointerDimensions = { w: 8, h: 8 };
  readonly circleDimensions = { w: 8, h: 8 };
  private selectedColor: EventEmitter<Swatch>;

  swatches: Swatch[] = [new Swatch(), new Swatch()];
  colorPickerSelectorPos = { x: 0, y: 0 };

  constructor(selectedColor: EventEmitter<Swatch>) {
    this.selectedColor = selectedColor;
  }
  createColorPicker() {
    let colorPicker = <HTMLCanvasElement>document.querySelector(".color-picker")
    colorPicker.draggable = false;
    let canvasDimension = colorPicker.getBoundingClientRect();
    colorPicker.height = canvasDimension.height;
    colorPicker.width = canvasDimension.width;
    this.getMainSwatch().colorPickerCirclePosition = { x: 0, y: 0 };
    this.getSubSwatch().colorPickerCirclePosition = { x: 0, y: 0 };

  }
  createColorPickerSlider() {
    let colorPickerSlider = <HTMLCanvasElement>document.querySelector(".color-picker-slider");
    colorPickerSlider.draggable = false;
    let canvasDimension = colorPickerSlider.getBoundingClientRect();
    colorPickerSlider.height = canvasDimension.height;
    colorPickerSlider.width = canvasDimension.width;
    let pen = colorPickerSlider.getContext("2d");
    let sliderGradient = pen.createLinearGradient(0, 0, canvasDimension.width, canvasDimension.height);
    sliderGradient.addColorStop(0, 'rgba(255, 0, 42, 1)');
    sliderGradient.addColorStop(.17, 'rgba(255, 0, 255, 1)');
    sliderGradient.addColorStop(.34, 'rgba(0, 0, 255, 1)');
    sliderGradient.addColorStop(.51, 'rgba(0, 255, 255, 1)');
    sliderGradient.addColorStop(.68, 'rgba(0, 255, 0, 1)');
    sliderGradient.addColorStop(.85, 'rgba(255, 255, 0, 1)');
    sliderGradient.addColorStop(1, 'rgba(255, 0, 0, 1)');
    pen.fillStyle = sliderGradient;
    pen.fillRect(0, 0, canvasDimension.width, canvasDimension.height);
    
    this.getMainSwatch().sliderPointerPosition = { x: 0, y: canvasDimension.y + canvasDimension.height + (this.pointerDimensions.h/2)};
    this.getSubSwatch().sliderPointerPosition = { x: 0, y: canvasDimension.y + canvasDimension.height + (this.pointerDimensions.h/2)};
    let sliderColor = pen.getImageData(0, canvasDimension.height, 1, 1).data;
    this.getMainSwatch().sliderColor = {r: sliderColor[0], g: sliderColor[1], b: sliderColor[2]}
    this.getSubSwatch().sliderColor = {r: sliderColor[0], g: sliderColor[1], b: sliderColor[2]}

  }

  emitSwatch(){
    this.selectedColor.emit(this.getMainSwatch());
  }

  changeColorPickerColor(swatch: Swatch) {

    let colorPicker = <HTMLCanvasElement>document.querySelector(".color-picker");
    let canvasDimension = colorPicker.getBoundingClientRect();
    let pen = colorPicker.getContext("2d");
    let whiteToColorGradLayer = pen.createLinearGradient(0, 0, canvasDimension.width, 0);
    whiteToColorGradLayer.addColorStop(0.02, `rgba(255, 255, 255, 1)`);
    whiteToColorGradLayer.addColorStop(0.8, `rgba(${swatch.sliderColor.r}, ${swatch.sliderColor.g}, ${swatch.sliderColor.b}, 1)`);

    pen.fillStyle = whiteToColorGradLayer;
    pen.fillRect(0, 0, canvasDimension.width, canvasDimension.height);
    let blackGradLayer = pen.createLinearGradient(0, canvasDimension.height, 0, 0);
    blackGradLayer.addColorStop(0.01, 'rgba(0, 0, 0, 1)');
    blackGradLayer.addColorStop(.15, 'rgba(30, 30, 30, 1)');
    blackGradLayer.addColorStop(1, 'rgba(0, 0, 0, 0)');
    pen.fillStyle = blackGradLayer;
    pen.fillRect(0, 0, canvasDimension.width, canvasDimension.height);
    
  }

  setColorPickerCirclePosition(swatch: Swatch) {
    let colorPicker = <HTMLCanvasElement>document.querySelector(".color-picker");
    
    let colorPickerDimensions = colorPicker.getBoundingClientRect();
    let circle = <HTMLImageElement>document.querySelector(".color-picker-content-container .color-picker-selector-circle");
    circle.draggable = false;
    var mouseX = (swatch.colorPickerCirclePosition.x - colorPickerDimensions.x);
    mouseX = mouseX < 0 ? 0 : mouseX;
    mouseX = mouseX > colorPickerDimensions.width ? colorPickerDimensions.width : mouseX;
    circle.style.left = `${mouseX - (this.circleDimensions.w / 2)}px`;

    var mouseY = (swatch.colorPickerCirclePosition.y - colorPickerDimensions.y);
    mouseY = mouseY < 0 ? 0 : mouseY;
    mouseY = mouseY > colorPickerDimensions.height ? colorPickerDimensions.height : mouseY;
    circle.style.top = `${mouseY - (this.circleDimensions.h / 2)}px`;

    this.getMainSwatch().color = this.getColorPickerColor(swatch);

  }



  getColorPickerColor(swatch: Swatch) {
    let colorPicker = <HTMLCanvasElement>document.querySelector(".color-picker-content-container .color-picker");
    let colorPickerDimensions = colorPicker.getBoundingClientRect();
    var mouseX = (swatch.colorPickerCirclePosition.x - colorPickerDimensions.x);
    mouseX = mouseX < 0 ? 0 : mouseX;
    mouseX = mouseX > colorPickerDimensions.width ? colorPickerDimensions.width - this.circleDimensions.w/2: mouseX;

    var mouseY = (swatch.colorPickerCirclePosition.y - colorPickerDimensions.y);
    mouseY = mouseY < 0 ? 0 : mouseY;
    mouseY = mouseY > colorPickerDimensions.height ? colorPickerDimensions.height : mouseY;
    let rgbData = colorPicker.getContext("2d").getImageData(
      mouseX,
      mouseY,
      1, 1
    ).data;

    return { r: rgbData[0], g: rgbData[1], b: rgbData[2] };
  }

  getColorPickerSliderColor(swatch: Swatch) {
    let colorPickerSlider = <HTMLCanvasElement>document.querySelector(".color-picker-slider");
    let maxHeight = colorPickerSlider.getBoundingClientRect().height - 6;
    var mouseY = swatch.sliderPointerPosition.y - colorPickerSlider.getBoundingClientRect().y;
    mouseY = mouseY <= 0? 0: mouseY;
    mouseY = mouseY >= maxHeight? maxHeight: mouseY; 
    let rgbData = colorPickerSlider.getContext("2d").getImageData(
      5,
      mouseY,
      1, 1
    ).data;

    return { r: rgbData[0], g: rgbData[1], b: rgbData[2] };
  }

  setColorPickerSliderPointerPosition(swatch: Swatch) {
    let colorPickerSlider = <HTMLCanvasElement>document.querySelector(".color-picker-slider");
    
    let pickerPointer = <HTMLImageElement>document.querySelector(".color-picker-slider-container .color-picker-slider-pointer");
    pickerPointer.draggable = false;
    let maxHeight = colorPickerSlider.getBoundingClientRect().height;
    var mouseY =  swatch.sliderPointerPosition.y - colorPickerSlider.getBoundingClientRect().y;
    mouseY = mouseY <= 0? 0: mouseY;
    mouseY = mouseY >= maxHeight? maxHeight-1: mouseY; 
    pickerPointer.style.top = `${mouseY - (this.pointerDimensions.h/2)}px`;
    this.getMainSwatch().sliderColor = this.getColorPickerSliderColor(swatch);
  }

  setMainSwatchSliderPosition(ev: MouseEvent){
    this.getMainSwatch().sliderPointerPosition = {x: ev.x, y: ev.y};
    this.selectedColor.emit(this.getMainSwatch());
  }
  setMainSwatchCirclePosition(ev: MouseEvent){
    this.getMainSwatch().colorPickerCirclePosition = {x: ev.x, y: ev.y};
    this.selectedColor.emit(this.getMainSwatch());
  }


  getMainSwatch() {
    return this.swatches[0];
  }

  getSubSwatch() {
    return this.swatches[1];
  }

  setSwatchesColor() {
    let swatches = document.getElementsByClassName("swatch");
    let mainSwatchDiv = <HTMLDivElement>swatches[0];
    let subSwatchDiv = <HTMLDivElement>swatches[1];
    mainSwatchDiv.style.backgroundColor = `rgb(${this.getMainSwatch().color.r}, ${this.getMainSwatch().color.g}, ${this.getMainSwatch().color.b})`;
    subSwatchDiv.style.backgroundColor = `rgb(${this.getSubSwatch().color.r}, ${this.getSubSwatch().color.g}, ${this.getSubSwatch().color.b})`;
  }





  

  swapSwatch() {
    let oldMainSwatch = this.swatches[0];
    let oldSubSwatch = this.swatches[1];
    this.swatches[0] = oldSubSwatch;
    this.swatches[1] = oldMainSwatch;
  }









  /*setColorPickerColorBasedOnSliderColor(ev: MouseEvent, colorPickerSlider: HTMLCanvasElement, colorPicker: HTMLCanvasElement) {
    let colorPickerSliderDimensions = colorPickerSlider.getBoundingClientRect();
    var mouseY = ev.y - colorPickerSliderDimensions.y;
    mouseY = mouseY <= 0 ? 0 : mouseY;
    let maxHeight = colorPickerSliderDimensions.height - 1;
    mouseY = mouseY >= maxHeight ? maxHeight : mouseY;
    var pixelValue = colorPickerSlider.getContext("2d")
      .getImageData(
        5,
        mouseY >= maxHeight ? mouseY - (this.colorPickerSliderYOffset) : mouseY,
        1, 1).data;
    let rgb = { r: pixelValue[0], g: pixelValue[1], b: pixelValue[2] };
    //this.setColorPickerSliderPointerPosition({ x: 0, y: mouseY });
    //this.changeColorPickerColor(colorPicker, rgb);
    //this.selectedColor.emit(this.getColorPickerColor());
  }
*/


}


