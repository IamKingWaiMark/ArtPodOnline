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
  colorScheme = ColorScheme.DARK;

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
        for (let i = 0; i < actionLists.length; i++) {
          let actionList = <HTMLDivElement>actionLists[i];
          let dimensions = actionList.getBoundingClientRect();
          if (ev.x >= dimensions.x && ev.x <= dimensions.x + dimensions.width &&
            ev.y >= dimensions.y && ev.y <= dimensions.y + dimensions.height) {
            clickedOutside = false;
          }
        }
        if (clickedOutside) {
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


  onColorSchemeClick(){
    this.activePodTool = ActivePodTool.THEME;
  }

  fileToolActive() {
    return this.activePodTool == ActivePodTool.FILE;
  }

  editToolActive() {
    return this.activePodTool == ActivePodTool.EDIT;
  }
  colorSchemeActive() {
    return this.activePodTool == ActivePodTool.THEME;
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
      case "save_as":
        this.FILE_ACTIONS.emit(PodFileAction.SAVE_AS);
        break;
      case "import":
        this.FILE_ACTIONS.emit(PodFileAction.IMPORT);
        break;
    }
    this.activePodTool = null;
  }

  onEditActionItemClick(action: string) {
    switch (action.toLowerCase()) {
      case "undo":
        this.EDIT_ACTIONS.emit(PodEditAction.UNDO);
        break;
      case "redo":
        this.EDIT_ACTIONS.emit(PodEditAction.REDO);
        break;
    }
    this.activePodTool = null;
  }

  onDarkColorSchemeClick(){
    this.removeSchemes();
    document.body.classList.add("dark-mode");
    this.activePodTool = null;
    this.colorScheme = ColorScheme.DARK;
  }

  onLightColorSchemeClick(){
    this.removeSchemes();
    document.body.classList.add("light-mode");
    this.activePodTool = null;
    this.colorScheme = ColorScheme.LIGHT;
  }

  removeSchemes(){
    document.body.classList.remove("dark-mode");
    document.body.classList.remove("light-mode");
  }

  isDarkTheme(){
    return this.colorScheme == ColorScheme.DARK;
  }
  isLightTheme(){
    return this.colorScheme == ColorScheme.LIGHT;
  }

}

export enum ColorScheme {
  DARK,
  LIGHT
}
export enum ActivePodTool {
  FILE,
  EDIT,
  THEME
}

export enum PodFileAction {
  NEW,
  SAVE_AS,
  IMPORT
}

export enum PodEditAction {
  UNDO,
  REDO
}
