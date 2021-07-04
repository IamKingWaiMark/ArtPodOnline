import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PodDocument } from '../classes/pod-document';

@Component({
  selector: 'app-pod-document',
  templateUrl: './pod-document.component.html',
  styleUrls: ['./pod-document.component.css']
})
export class PodDocumentComponent implements OnInit {
  @Input() activePodDocumentSubscription: BehaviorSubject<PodDocument>;

  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if(isPlatformBrowser(this.platform)) {
      this.activePodDocumentSubscription.subscribe(
        podDocument => {
          if(!podDocument) return;
        }
      );
    }
  }


  

}
