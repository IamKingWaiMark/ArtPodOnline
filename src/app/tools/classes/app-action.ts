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
            let actionIndexInLayer = drawActionData.layer.actions.indexOf(drawActionData.action);
            drawActionData.layer.actions.splice(actionIndexInLayer, 1);
            break;
        }
    }

    redo(){
        switch(this.type) {
            case AppActionType.DRAW:
            let drawActionData = <DrawActionData>this.data;
            drawActionData.layer.actions.push(drawActionData.action);
            break;
        }
    }
}

