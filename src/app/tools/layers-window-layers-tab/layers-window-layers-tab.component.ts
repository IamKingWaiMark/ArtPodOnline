import { isPlatformBrowser } from '@angular/common';
import { Component, HostListener, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Layer, PodDocument } from '../classes/pod-document';

@Component({
  selector: 'layers-window-layers-tab',
  templateUrl: './layers-window-layers-tab.component.html',
  styleUrls: ['./layers-window-layers-tab.component.css']
})
export class LayersWindowLayersTabComponent implements OnInit {
  @Input() activePodDocumentSubscription: BehaviorSubject<PodDocument>;
  @Input() activeLayerSubscription: BehaviorSubject<Layer>;
  activePodDocument: PodDocument;
  dragging = false;
  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platform)) {
      this.subscribeToActibePodDocument();

    }
  }



  subscribeToActibePodDocument(){
    this.activePodDocumentSubscription.subscribe(
      podDocument => {
        this.activePodDocument = podDocument;
      }
    );
  }

  onAddLayerClick(){
    if(!this.activePodDocument) return;
    let activeLayerIndex = this.activePodDocument?.getActiveLayerIndex();
    this.activePodDocument.addLayer(activeLayerIndex);
    let activeLayer = this.activePodDocument.getLayers()[activeLayerIndex];
    this.activePodDocument.setActiveLayer(activeLayer);
    this.activeLayerSubscription.next(activeLayer);
  }
  
  onDeleteLayerClick(){
    let activeLayerIndex = this.activePodDocument?.getActiveLayerIndex();
    this.activePodDocument.deleteLayer(activeLayerIndex);
    activeLayerIndex = this.clampActiveLayerIndex(activeLayerIndex);
    let activeLayer = this.activePodDocument.getLayers()[activeLayerIndex];
    this.activePodDocument.setActiveLayer(activeLayer);
    this.activeLayerSubscription.next(activeLayer);
  }

  clampActiveLayerIndex(num: number){
    const MIN_INDEX = 0;
    const MAX_INDEX = this.activePodDocument.getLayers().length - 1;
    if(num < MIN_INDEX) return MIN_INDEX;
    if(num > MAX_INDEX) return MAX_INDEX;
    return num;
  }

  isActiveLayer(layer: Layer){
    return layer == this.activePodDocument.getActiveLayer();
  }

  onLayerClick(layer: Layer) {

    this.activeLayerSubscription.next(layer);
  }

  onLayerDragIconClick(){

  }
  onToggleLayerVisibilityClick(layer: Layer) {
    layer.toggleVisibility();
    this.activeLayerSubscription.next(layer);
  }



}
