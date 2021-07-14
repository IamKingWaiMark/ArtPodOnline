import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { FeatureInfo } from '../classes/feature-info';
import { PodFeature } from '../enums/pod-feature';


@Component({
  selector: 'pod-feature-context-menu',
  templateUrl: './pod-feature-context-menu.component.html',
  styleUrls: ['./pod-feature-context-menu.component.css']
})
export class PodFeatureContextMenuComponent implements OnInit {
  @Input() FEATURE_INFO: FeatureInfo;
  @Input() currentFeature: PodFeature;
  @Input() container: HTMLDivElement;

  readonly MAX_BRUSH_SIZE = 1000;
  readonly MIN_BRUSH_SIZE = 1;
  readonly MAX_ERASER_SIZE = 1000;
  readonly MIN_ERASER_SIZE = 1;


  BRUSH_FEATURE: BrushFeatureContextMenu;
  ERASER_FEATURE: EraserFeatureContextMenu;


  constructor(@Inject(PLATFORM_ID) private platform: Object) { 
    
  }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platform)) {
      this.BRUSH_FEATURE = new BrushFeatureContextMenu(this.FEATURE_INFO);
      this.ERASER_FEATURE = new EraserFeatureContextMenu(this.FEATURE_INFO);
      this.addEventListenerToContainerDiv();
    }
  }

  private addEventListenerToContainerDiv(){
    this.container.addEventListener("click", (ev: MouseEvent) => {
      let activeContextMenu = <HTMLDivElement>document.querySelector(".feature-context-menu");
      if(!activeContextMenu) return;
      let contextMenuDimension = activeContextMenu.getBoundingClientRect();
      if(!(ev.x > contextMenuDimension.x && ev.x < contextMenuDimension.x + contextMenuDimension.width &&
          ev.y > contextMenuDimension.y && ev.y < contextMenuDimension.y + contextMenuDimension.height
        )) {
          if(this.FEATURE_INFO.getShouldShowContextMenu()) this.FEATURE_INFO.setShouldShowContextMenu(false);
      } 
    });
  }

  isFeatureMove(){
    return this.currentFeature == PodFeature.MOVE;
  }
  isFeatureBrush(){
    return this.currentFeature == PodFeature.BRUSH;
  }
  isFeatureEraser(){
    return this.currentFeature == PodFeature.ERASER;
  }
  getStyle(){
    if(!this.container) return "";
    return `left: ${this.FEATURE_INFO.getMouseX() - this.container.getBoundingClientRect().x}px; 
            top: ${this.FEATURE_INFO.getMouseY() - this.container.getBoundingClientRect().y}px; 
            position: absolute;`;
  }


  SIZE_SLIDER_onChange(event: MatSliderChange) {
    switch(this.currentFeature) {
      case PodFeature.BRUSH: this.BRUSH_FEATURE.onSizeSliderChanged(event); break;
      case PodFeature.ERASER: this.ERASER_FEATURE.onSizeSliderChanged(event); break;
    }
  }
  SIZE_SLIDER_INPUT_onKeyUp(input: HTMLInputElement) {
    let featureMetadata = this.getFeatureMetaData();
    var size = featureMetadata.value;
    try {
      let inputValue = parseInt(input.value);
      size = inputValue;
    } catch (err) {}

    if(size && size >= featureMetadata.max) { 
      size = featureMetadata.max;
    } else if(size <= featureMetadata.min) {
      size = featureMetadata.min;
    } 
    this.setFeatureValue(size);
    input.value = `${size}`;
  }


  setFeatureValue(value: any){
    switch(this.currentFeature) {
      case PodFeature.BRUSH: this.FEATURE_INFO.setBrushSize(value); break;
      case PodFeature.ERASER: this.FEATURE_INFO.setEraserSize(value); break;
    }
  }


  getFeatureMetaData(){
    var metadata = {value: 0, min: 0, max: 0};
    switch(this.currentFeature) {
      case PodFeature.BRUSH:  
        metadata.value = this.FEATURE_INFO.getBrushSize();
        metadata.min = this.MIN_BRUSH_SIZE;
        metadata.max = this.MAX_BRUSH_SIZE;
      case PodFeature.ERASER:  
        metadata.value = this.FEATURE_INFO.getEraserSize();
        metadata.min = this.MIN_ERASER_SIZE;
        metadata.max = this.MAX_ERASER_SIZE;
    }
    return metadata;
  }
}

export class BrushFeatureContextMenu {
  featureInfo: FeatureInfo;

  constructor(featureInfo: FeatureInfo) {
    this.featureInfo = featureInfo;
  }
  onSizeSliderChanged(event: MatSliderChange){
    this.featureInfo.setBrushSize(event.value);
  }
}

export class EraserFeatureContextMenu {
  featureInfo: FeatureInfo;

  constructor(featureInfo: FeatureInfo) {
    this.featureInfo = featureInfo;
  }
  onSizeSliderChanged(event: MatSliderChange){
    this.featureInfo.setEraserSize(event.value);
  }
}