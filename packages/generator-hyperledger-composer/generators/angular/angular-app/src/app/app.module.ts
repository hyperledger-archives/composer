/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { DataService } from './data.service';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NoopInterceptor } from 'app/http.interceptor';
import { Configuration }     from './configuration';
import { CookieService } from 'ngx-cookie-service';

import { HomeComponent } from './home/home.component';

import { CommodityComponent } from './Commodity/Commodity.component';

import { TraderComponent } from './Trader/Trader.component';

import { TradeComponent } from './Trade/Trade.component';


  import { TradeLogicComponent } from './TradeLogic/TradeLogic.transaction';

  @NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    
      TradeLogicComponent,
      
    
    CommodityComponent,
    TraderComponent,
    TradeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    Configuration,
    DataService,
    CookieService ,
   {
       provide: HTTP_INTERCEPTORS,
       useClass: NoopInterceptor,
       multi: true,
    }

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
