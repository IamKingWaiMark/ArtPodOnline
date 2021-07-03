export class Swatch {
    DEFAULTS = {
      COLOR: {r: 255, g: 255, b: 255},
      SLIDER_COLOR: {r: 255, g: 255, b: 255},
      CIRCLE_POSITION: {x: 0, y: 0},
      SLIDER_POSITION: {x: 0, y: 0}
    };
 
    color = this.DEFAULTS.COLOR;
    sliderColor = this.DEFAULTS.SLIDER_COLOR;
    sliderPointerPosition = this.DEFAULTS.SLIDER_POSITION;
    colorPickerCirclePosition = this.DEFAULTS.CIRCLE_POSITION;

 }