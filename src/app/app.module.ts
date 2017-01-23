import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
//import { HttpModule } from '@angular/http';

//import { MapService } from './services/map-service';

import { AppComponent } from './app.component';
//import { MapComponent } from './components/map-component';



@NgModule({
    declarations: [
        AppComponent//, MapComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        //HttpModule
    ],
    //providers: [MapService],
    bootstrap: [AppComponent]
})
export class AppModule { }
