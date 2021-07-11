import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PodDocument } from 'src/app/tools/classes/pod-document';

@Component({
  selector: 'layers-window',
  templateUrl: './layers-window.component.html',
  styleUrls: ['./layers-window.component.css']
})
export class LayersWindowComponent implements OnInit {
  @Input() activePodDocumentSubscription: BehaviorSubject<PodDocument>;
  
  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
  }
  

}
