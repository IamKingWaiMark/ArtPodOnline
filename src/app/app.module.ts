import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PodComponent } from './pages/pod/pod.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayerComponent } from './tools/layer/layer.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PodFeatureContextMenuComponent } from './tools/pod-feature-context-menu/pod-feature-context-menu.component';
import { MatSliderModule } from '@angular/material/slider';
import { ColorPickerComponent } from './tools/color-picker/color-picker.component';

@NgModule({
  declarations: [
    AppComponent,
    PodComponent,
    LayerComponent,
    PodFeatureContextMenuComponent,
    ColorPickerComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonToggleModule,
    MatSliderModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
