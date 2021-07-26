import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
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
  activeLayerIndex = 0;
  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platform)) {
      this.subscribeToActibePodDocument();
      this.subscribeToActiveLayer();
    }
  }

  subscribeToActiveLayer(){
    this.activeLayerSubscription.subscribe(
      activeLayer => {
        this.activeLayerIndex = this.activePodDocument?.getActiveLayerIndex();
      }
    );
  }

  subscribeToActibePodDocument(){
    this.activePodDocumentSubscription.subscribe(
      podDocument => {
        this.activePodDocument = podDocument;
      }
    );
  }

  onAddLayerClick(){
    this.activePodDocument.addLayer(this.activeLayerIndex);
    this.clampActiveLayerIndex();
    let activeLayer = this.activePodDocument.getLayers()[this.activeLayerIndex];
    this.activePodDocument.setActiveLayer(activeLayer);
    this.activeLayerSubscription.next(activeLayer);
  }
  
  onDeleteLayerClick(){
    this.activePodDocument.deleteLayer(this.activeLayerIndex);
    this.clampActiveLayerIndex();
    let activeLayer = this.activePodDocument.getLayers()[this.activeLayerIndex];
    this.activePodDocument.setActiveLayer(activeLayer);
    this.activeLayerSubscription.next(activeLayer);
  }

  clampActiveLayerIndex(){
    const MIN_INDEX = 0;
    const MAX_INDEX = this.activePodDocument.getLayers().length - 1;
    if(this.activeLayerIndex < MIN_INDEX) this.activeLayerIndex = MIN_INDEX;
    if(this.activeLayerIndex > MAX_INDEX) this.activeLayerIndex = MAX_INDEX;
  }

  isActiveLayer(layer: Layer){
    return layer == this.activePodDocument.getLayers()[this.activeLayerIndex];
  }

  onLayerClick(layerIndex: number) {
    this.activeLayerIndex = layerIndex;
    this.activeLayerSubscription.next(this.activePodDocument.getLayers()[this.activeLayerIndex]);
  }

}
