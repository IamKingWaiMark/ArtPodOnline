import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FeatureInfo, PodFeatures } from 'src/app/pages/pod/pod.component';
import { GlobalEvents } from 'src/app/tools/classes/global-events';
import { Layer, PodDocument } from 'src/app/tools/classes/pod-document';

@Component({
  selector: 'app-pod-document-controller',
  templateUrl: './pod-document-controller.component.html',
  styleUrls: ['./pod-document-controller.component.css']
})
export class PodDocumentControllerComponent implements OnInit {
  @Input() podDocumentsSubscription: BehaviorSubject<PodDocument[]>;
  @Input() selectedPodFeatureSubscription: BehaviorSubject<PodFeatures>;
  @Input() FEATURE_INFO: FeatureInfo;
  @Input() GLOBAL_EVENTS: GlobalEvents;
  
  podDocuments: PodDocument [];
  activeTabIndex = 0;
  activePodDocumentSubscription = new BehaviorSubject<PodDocument>(null);
  activeLayerSubscription = new BehaviorSubject<Layer>(null);

  constructor(@Inject(PLATFORM_ID) private platform: Object ) { }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platform)) {
      this.podDocumentsSubscription.subscribe(
        podDocuments => {
          if(!podDocuments) return;
          this.podDocuments = podDocuments;
          this.activeTabIndex = podDocuments.length - 1;
          this.activePodDocumentSubscription.next(this.getCurrentPodDocument());
        }
      );
    }
  }



  isActiveTab(tabIndex: number) {
    return this.activeTabIndex == tabIndex;
  }

  onTabClick(tabIndex: number){
    this.activeTabIndex = tabIndex;
    this.activePodDocumentSubscription.next(this.getCurrentPodDocument());
  }

  onDeleteTabClick(tabIndex: number) {
    this.podDocuments.splice(tabIndex, 1);
    if(tabIndex == this.activeTabIndex) {
      this.activeTabIndex = tabIndex - 1;
      this.activeTabIndex = this.activeTabIndex < 0? 0: this.activeTabIndex;
    } else {
      this.activeTabIndex--;
      this.activeTabIndex = this.activeTabIndex < 0? 0: this.activeTabIndex;
    }
    this.activePodDocumentSubscription.next(this.getCurrentPodDocument());
  }

  getCurrentPodDocument(){
    return this.podDocuments[this.activeTabIndex];
  }



}


