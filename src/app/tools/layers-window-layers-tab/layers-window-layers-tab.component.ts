import { isPlatformBrowser } from '@angular/common';
import { Component, HostListener, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GlobalEvents } from '../classes/global-events';
import { Layer, PodDocument } from '../classes/pod-document';

@Component({
  selector: 'layers-window-layers-tab',
  templateUrl: './layers-window-layers-tab.component.html',
  styleUrls: ['./layers-window-layers-tab.component.css']
})
export class LayersWindowLayersTabComponent implements OnInit {
  @Input() activePodDocumentSubscription: BehaviorSubject<PodDocument>;
  @Input() activeLayerSubscription: BehaviorSubject<Layer>;
  @Input() GLOBAL_EVENTS: GlobalEvents;
  activePodDocument: PodDocument;
  dragging = false;
  selectedLayer: Layer;
  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platform)) {
      this.subscribeToGlobalEvents();
      this.subscribeToActibePodDocument();

    }
  }

  subscribeToGlobalEvents(){
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_MOVE_EVENT.subscribe(
      ev => {
        
      }
    );
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_UP_EVENT.subscribe(
      ev => {
        this.dragging = false;

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
    if(!this.activePodDocument) return;
    let activeLayerIndex = this.activePodDocument?.getActiveLayerIndex();
    this.activePodDocument.addLayer(activeLayerIndex);
    let activeLayer = this.activePodDocument.getLayers()[activeLayerIndex];
    this.activePodDocument.setActiveLayer(activeLayer);
    this.activeLayerSubscription.next(activeLayer);
  }
  
  onDeleteLayerClick(){
    let activeLayerIndex = this.activePodDocument?.getActiveLayerIndex();
    if(this.activePodDocument.canDeleteLayer()) {
      this.activePodDocument.removeUndoAndRedoActionsWithLayerWhenDeleted(this.activePodDocument.getActiveLayer());
      this.activePodDocument.deleteLayer(activeLayerIndex);
      activeLayerIndex = this.clampActiveLayerIndex(activeLayerIndex);
      let activeLayer = this.activePodDocument.getLayers()[activeLayerIndex];
      
      this.activePodDocument.setActiveLayer(activeLayer);
      this.activeLayerSubscription.next(activeLayer);
    }


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

  onLayerDragIconClick(layer: Layer){
    this.dragging = true;
    this.selectedLayer = layer;
  }
  onToggleLayerVisibilityClick(layer: Layer) {
    layer.toggleVisibility();
    this.activeLayerSubscription.next(layer);
  }

  onLayerMouseUp(layer: Layer){
    if(layer == this.selectedLayer || !this.dragging) return;
    let newLayerIndex = this.activePodDocument.getLayers().indexOf(layer);
    let oldLayerIndex = this.activePodDocument.getLayers().indexOf(this.selectedLayer);
    if(newLayerIndex > oldLayerIndex) {
      this.activePodDocument.getLayers().splice(newLayerIndex + 1, 0, this.selectedLayer);
      this.activePodDocument.getLayers().splice(oldLayerIndex, 1);
    } else {
      this.activePodDocument.getLayers().splice(newLayerIndex + 1, 0, this.selectedLayer);
      this.activePodDocument.getLayers().splice(oldLayerIndex + 1, 1);
    }
    
    this.activeLayerSubscription.next(this.activePodDocument.getActiveLayer());
  }


  onLayerNameInputTyped(layer: Layer, layerNameInput: HTMLInputElement) {
    let name = layerNameInput.value;
    name = (!name && name.length > 0)? name: layer.name;
    layer.name = name;
  }


}
