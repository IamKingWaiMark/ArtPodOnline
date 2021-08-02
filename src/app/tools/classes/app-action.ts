import { AppActionType } from "../enums/app-action-type";
import { DrawActionData } from "../interfaces/app-action-data";

export class AppAction {
    type: AppActionType;
    data: any;
    constructor(type: AppActionType, data: any) {
        this.type = type;
        this.data = data;
    }


    undo(){
        switch(this.type) {
            case AppActionType.DRAW:
            let drawActionData = <DrawActionData>this.data;
            let layer = drawActionData.layer;
            let actionIndexInLayer = layer.actions.indexOf(drawActionData.action);
            layer.actions.splice(actionIndexInLayer, 1);
            layer.podDocComp.activeLayerSubscription.next(layer);
            break;
        }
    }

    redo(){
        switch(this.type) {
            case AppActionType.DRAW:
            let drawActionData = <DrawActionData>this.data;
            let layer = drawActionData.layer;
            layer.actions.push(drawActionData.action);
            layer.podDocComp.activeLayerSubscription.next(layer);
            break;
        }
    }

    getLayer(){
        return this.data.layer;
    }
}

