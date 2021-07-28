import { EventEmitter } from "@angular/core";

export class GlobalEvents {
    public readonly GLOBAL_MOUSE_MOVE_EVENT = new EventEmitter<MouseEvent>();
    public readonly GLOBAL_MOUSE_UP_EVENT = new EventEmitter<MouseEvent>();
    public readonly GLOBAL_MOUSE_DOWN_EVENT = new EventEmitter<MouseEvent>();
    public readonly GLOBAL_KEYDOWN_EVENT = new EventEmitter<KeyboardEvent>();
    public readonly GLOBAL_KEYUP_EVENT = new EventEmitter<KeyboardEvent>();
    public readonly GLOBAL_HOT_KEY_EVENT = new EventEmitter<HotKey>();
    public readonly GLOBAL_WINDOW_RESIZE = new EventEmitter<UIEvent>();
}

export enum HotKey {
    SWAP_SWATCH,
    NEW_POD,
    MOVE_POD_DCOUMENT,
    SAVE_AS,
    UNDO,
    REDO,
    FIX_MOUSE_POS
}