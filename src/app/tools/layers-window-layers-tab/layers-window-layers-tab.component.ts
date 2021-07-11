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

  activePodDocument: PodDocument;
  activeLayerIndex = 0;
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
    this.activePodDocument.addLayer(this.activeLayerIndex);
  }

  isActiveLayer(layer: Layer){
    return layer == this.activePodDocument.getLayers()[this.activeLayerIndex];
  }

  onLayerClick(layerIndex: number) {
    this.activeLayerIndex = layerIndex;
  }

}
