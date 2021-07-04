import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PodComponent } from './pages/pod/pod.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PodFeatureContextMenuComponent } from './tools/pod-feature-context-menu/pod-feature-context-menu.component';
import { MatSliderModule } from '@angular/material/slider';
import { ColorPickerComponent } from './tools/color-picker/color-picker.component';
import { NewPodWindowComponent } from './windows/new-pod-window/new-pod-window.component';
import { PodPresetComponent } from './tools/pod-preset/pod-preset.component';
import { PodAppToolsComponent } from './tools/pod-app-tools/pod-app-tools.component';
import { PodDocumentControllerComponent } from './windows/pod-document-controller/pod-document-controller.component';
import { PodDocumentComponent } from './tools/pod-document/pod-document.component';

@NgModule({
  declarations: [
    AppComponent,
    PodComponent,
    PodFeatureContextMenuComponent,
    ColorPickerComponent,
    NewPodWindowComponent,
    PodPresetComponent,
    PodAppToolsComponent,
    PodDocumentControllerComponent,
    PodDocumentComponent
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
