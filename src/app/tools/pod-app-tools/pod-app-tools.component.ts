import { isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { GlobalEvents } from '../classes/global-events';

@Component({
  selector: 'app-pod-app-tools',
  templateUrl: './pod-app-tools.component.html',
  styleUrls: ['./pod-app-tools.component.css']
})
export class PodAppToolsComponent implements OnInit {
  @Input() GLOBAL_EVENTS: GlobalEvents;
  @Output() FILE_ACTIONS = new EventEmitter<PodFileAction>();
  @Output() EDIT_ACTIONS = new EventEmitter<PodEditAction>();

  activePodTool: ActivePodTool = null;

  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      this.subscribeToGlobalEvents();
    }
  }

  subscribeToGlobalEvents() {
    this.GLOBAL_EVENTS.GLOBAL_MOUSE_DOWN_EVENT.subscribe(
      (ev: MouseEvent) => {
        let actionLists = document.getElementsByClassName("pod-tool-action-list");
        var clickedOutside = true;
        for(let i = 0; i < actionLists.length; i++) {
          let actionList = <HTMLDivElement>actionLists[i];
          let dimensions = actionList.getBoundingClientRect();
          if(ev.x >= dimensions.x && ev.x <= dimensions.x + dimensions.width &&
            ev.y >= dimensions.y && ev.y <= dimensions.y + dimensions.height) {
              clickedOutside = false;
            }
        }
        if(clickedOutside) {
          this.activePodTool = null;
        }
        
      }
    );
  }

  onFileToolClick() {
    this.activePodTool = ActivePodTool.FILE;
  }

  onEditToolClick() {
    this.activePodTool = ActivePodTool.EDIT;
  }

  fileToolActive() {
    return this.activePodTool == ActivePodTool.FILE;
  }

  editToolActive() {
    return this.activePodTool == ActivePodTool.EDIT;
  }

  getCtrlKeyText() {
    try {
      let isMac = navigator.platform.match("Mac");
      return isMac ? "Cmd" : "Ctrl";
    } catch (err) {
      return "Ctrl";
    }
  }


  onFileActionItemClick(action: string) {
    switch (action.toLowerCase()) {
      case "file":
        this.FILE_ACTIONS.emit(PodFileAction.NEW);
        break;
    }
    this.activePodTool = null;
  }

  onEditActionItemClick(action: string) {
    switch (action.toLowerCase()) {
      case "undo":
        this.EDIT_ACTIONS.emit(PodEditAction.UNDO);
        break;
    }
    this.activePodTool = null;
  }
}


export enum ActivePodTool {
  FILE,
  EDIT
}

export enum PodFileAction {
  NEW
}

export enum PodEditAction {
  UNDO
}

