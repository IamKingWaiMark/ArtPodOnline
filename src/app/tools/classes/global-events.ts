import { EventEmitter } from "@angular/core";

export class GlobalEvents {
    public readonly GLOBAL_MOUSE_MOVE_EVENT = new EventEmitter<MouseEvent>();
    public readonly GLOBAL_MOUSE_UP_EVENT = new EventEmitter<MouseEvent>();
    public readonly GLOBAL_KEYDOWN_EVENT = new EventEmitter<KeyboardEvent>();
    public readonly GLOBAL_HOT_KEY_EVENT = new EventEmitter<HotKey>();
}

export enum HotKey {
    SWAP_SWATCH
  }