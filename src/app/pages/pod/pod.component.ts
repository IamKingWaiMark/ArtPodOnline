import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FeatureInfo } from 'src/app/tools/classes/feature-info';
import { GlobalEvents, HotKey } from 'src/app/tools/classes/global-events';
import { PodDocument } from 'src/app/tools/classes/pod-document';
import { PodFeature } from 'src/app/tools/enums/pod-feature';
import { PodEditAction, PodFileAction } from 'src/app/tools/pod-app-tools/pod-app-tools.component';
import { NewPodWindowAction, NewPodWindowActionData } from 'src/app/windows/new-pod-window/new-pod-window.component';

@Component({
  selector: 'app-pod',
  templateUrl: './pod.component.html',
  styleUrls: ['./pod.component.css']
})
export class PodComponent implements OnInit {
  public readonly GLOBAL_EVENTS = new GlobalEvents();
  public readonly FEATURE_INFO: FeatureInfo = new FeatureInfo();

  public readonly DEFAULTS = {
    POD_FEATURES: PodFeature.MOVE
  }

  featureInfoSubscription = new BehaviorSubject<FeatureInfo>(this.FEATURE_INFO);
  selectedPodFeatureSubscription = new BehaviorSubject<PodFeature>(this.DEFAULTS.POD_FEATURES);
  showNewPodWindow = true;

  podDocuments: PodDocument[] = [];
  podDocumentsSubscription = new BehaviorSubject<PodDocument[]>(this.podDocuments);



  constructor(@Inject(PLATFORM_ID) private platform: Object) { }

  ngOnInit(): void {

    if (isPlatformBrowser(this.platform)) {
      this.addWindowKeyEvents();
    }
  }

  private addWindowKeyEvents() {
    window.oncontextmenu = () => {
      return false;
    }
    window.addEventListener("mousedown", (ev: MouseEvent) => {
      this.GLOBAL_EVENTS.GLOBAL_MOUSE_DOWN_EVENT.emit(ev);
    });
    window.addEventListener("mousemove", (ev: MouseEvent) => {
      this.GLOBAL_EVENTS.GLOBAL_MOUSE_MOVE_EVENT.emit(ev);
    });
    window.addEventListener("mouseup", (ev: MouseEvent) => {
      this.GLOBAL_EVENTS.GLOBAL_MOUSE_UP_EVENT.emit(ev);
    });
    window.addEventListener("keyup", (ev: KeyboardEvent) => {
      this.GLOBAL_EVENTS.GLOBAL_KEYUP_EVENT.emit(ev);
    });
    window.addEventListener("keydown", (ev: KeyboardEvent) => {


      let CTRL_KEY = (navigator.platform.match("Mac") ? ev.metaKey : ev.ctrlKey);
      if (CTRL_KEY && ev.shiftKey && ev.altKey) {
        ev.preventDefault();
        ev.stopPropagation();
      } else if (CTRL_KEY && ev.shiftKey) {
        ev.preventDefault();
        ev.stopPropagation();
        switch (ev.key.toLowerCase()) {
          case "s": this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.SAVE_AS); break;
        }
      } else if (CTRL_KEY && ev.altKey) {
        ev.preventDefault();
        ev.stopPropagation();
        switch (ev.key.toLowerCase()) {
          case "n": this.showNewPodWindow = true; break;
        }
      } else if (CTRL_KEY) {
        ev.preventDefault();
        ev.stopPropagation();
        switch (ev.key.toLowerCase()) {
          case "z": this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.UNDO); break;
          case "y": this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.REDO); break;
        }
      } else if (ev.shiftKey) {

      } else {
        switch (ev.key.toLowerCase()) {
          case "x": this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.SWAP_SWATCH); break;
          case " ": this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.MOVE_POD_DCOUMENT); break;
        }
      }
      this.GLOBAL_EVENTS.GLOBAL_KEYDOWN_EVENT.emit(ev);
    });
    window.addEventListener("resize", (ev: UIEvent) => {
      this.GLOBAL_EVENTS.GLOBAL_WINDOW_RESIZE.emit(ev);
    });
  }
  /*
    POD
  */
  onFeatureChanged(selectedFeature: string) {
    switch (selectedFeature) {
      case "MOVE": this.selectedPodFeatureSubscription.next(PodFeature.MOVE); break;
      case "BRUSH": this.selectedPodFeatureSubscription.next(PodFeature.BRUSH); break;
      case "ERASER": this.selectedPodFeatureSubscription.next(PodFeature.ERASER); break;
      case "FILL": this.selectedPodFeatureSubscription.next(PodFeature.FILL); break;
      case "ZOOM": this.selectedPodFeatureSubscription.next(PodFeature.ZOOM); break;
    }
    this.FEATURE_INFO.setShouldShowContextMenu(false);
  }



  /*
    NEW POD WINDOW
  */
  onNewPodWindowAction(action: NewPodWindowActionData) {
    switch (action.newPodWindowAction) {
      case NewPodWindowAction.CREATE: this.showNewPodWindow = false; this.createNewDocument(action); break;
      case NewPodWindowAction.CLOSE: this.showNewPodWindow = false; break;
    }
  }

  createNewDocument(action: NewPodWindowActionData) {
    this.podDocuments.push(action.podDocument);
    this.podDocumentsSubscription.next(this.podDocuments);
  }

  shouldShowNewPodWindow() {
    return this.showNewPodWindow || (this.podDocuments && this.podDocuments.length <= 0);
  }
  /*
    NEW POD WINDOW END
  */

  /*
    POD TOOL
  */
  onFileActionReceived(fileAction: PodFileAction) {
    switch (fileAction) {
      case PodFileAction.NEW:
        this.showNewPodWindow = true;
        break;
      case PodFileAction.SAVE_AS:
        this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.SAVE_AS);
        break;
    }
  }

  onEditActionReceived(editAction: PodEditAction) {
    switch (editAction) {
      case PodEditAction.UNDO:
        this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.UNDO);
        break;
      case PodEditAction.REDO:
        this.GLOBAL_EVENTS.GLOBAL_HOT_KEY_EVENT.emit(HotKey.REDO);
        break;
    }
  }
  /*
    POD TOOL END
  */

}



