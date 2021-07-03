import { isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { FeatureInfo, PodFeatures } from 'src/app/pages/pod/pod.component';


@Component({
  selector: 'pod-feature-context-menu',
  templateUrl: './pod-feature-context-menu.component.html',
  styleUrls: ['./pod-feature-context-menu.component.css']
})
export class PodFeatureContextMenuComponent implements OnInit {
  @Input() featureInfo: FeatureInfo;
  @Input() currentFeature: PodFeatures;
  @Input() podDiv: HTMLDivElement;

  BRUSH_FEATURE: BrushFeatureContextMenu;
  ERASER_FEATURE: EraserFeatureContextMenu;


  constructor(@Inject(PLATFORM_ID) private platform: Object) { 
    
  }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platform)) {
      this.BRUSH_FEATURE = new BrushFeatureContextMenu(this.featureInfo);
      this.ERASER_FEATURE = new EraserFeatureContextMenu(this.featureInfo);
      this.addEventListenerToPodDiv();
    }
  }

  private addEventListenerToPodDiv(){
    this.podDiv.addEventListener("click", (ev) => {
      let activeContextMenu = <HTMLDivElement>document.querySelector(".feature-context-menu");
      if(!activeContextMenu) return;

      let contextMenuDimension = activeContextMenu.getBoundingClientRect();
      if(!(ev.x > contextMenuDimension.x && ev.x < contextMenuDimension.x + contextMenuDimension.width &&
          ev.y > contextMenuDimension.y && ev.y < contextMenuDimension.y + contextMenuDimension.height
        )) {
          if(this.featureInfo.getShouldShowContextMenu()) this.featureInfo.setShouldShowContextMenu(false);
      }
    });
  }

  isFeatureMove(){
    return this.currentFeature == PodFeatures.MOVE;
  }
  isFeatureBrush(){
    return this.currentFeature == PodFeatures.BRUSH;
  }
  isFeatureEraser(){
    return this.currentFeature == PodFeatures.ERASER;
  }
  getStyle(){
    return `left: ${this.featureInfo.getMouseX() - this.podDiv.getBoundingClientRect().x}px; 
            top: ${this.featureInfo.getMouseY() - this.podDiv.getBoundingClientRect().y}px; 
            position: absolute`;
  }


  SIZE_SLIDER_onChange(event: MatSliderChange) {
    switch(this.currentFeature) {
      case PodFeatures.BRUSH: this.BRUSH_FEATURE.onSizeSliderChanged(event); break;
      case PodFeatures.ERASER: this.ERASER_FEATURE.onSizeSliderChanged(event); break;
    }
  }
  SIZE_SLIDER_INPUT_onChange(input: HTMLInputElement) {
    let size = parseInt(input.value);
    if(size && size > 1000) { 
      size = 1000;
      input.value = `${size}`;
      this.featureInfo.setBrushSize(size);
    } else if(size) {
      this.featureInfo.setBrushSize(size);
    }
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