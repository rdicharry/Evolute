import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
//import { HttpModule } from '@angular/http';

//import { MapService } from './services/map-service';

import { AppComponent } from './app.component';
import { GraphComponent } from './components/graph-component';
import { D3Service} from 'd3-ng2-service';



@NgModule({
    declarations: [
        AppComponent, GraphComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        //HttpModule
    ],
    providers: [D3Service],
    bootstrap: [AppComponent]
})
export class AppModule { }
