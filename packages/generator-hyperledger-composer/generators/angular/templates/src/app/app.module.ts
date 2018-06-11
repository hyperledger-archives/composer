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
<%_ _%>
<%_ for(var x=0;x<assetComponentNames.length;x++){ %>
import { <%= assetComponentNames[x] %> } from './<%= assetList[x].name %>/<%= assetList[x].name %>.component';<% } %>
<%_ _%>
<%_ for(var x=0;x<participantComponentNames.length;x++){ %>
import { <%= participantComponentNames[x] %> } from './<%= participantList[x].name %>/<%= participantList[x].name %>.component';<% } %>
<%_ _%>
<%_ for(var x=0;x<transactionComponentNames.length;x++){ %>
import { <%= transactionComponentNames[x] %> } from './<%= transactionList[x].name %>/<%= transactionList[x].name %>.component';<% } %>

<% for(var x=0;x<transactionLogicComponentNames.length;x++){ %>
  import { <%= transactionLogicComponentNames[x] %> } from './<%= transactionListLogic[x].name %>/<%= transactionListLogic[x].name %>.transaction';<% } %>

  @NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    <% for(var x=0;x<transactionLogicComponentNames.length;x++){ %>
      <%= transactionLogicComponentNames[x] %>,
      <% } %>
    
          <%_ for(var x=0;x<assetComponentNames.length;x++){ _%>
            <%_ if(x == assetComponentNames.length-1) {_%>
    <%_ %>    <%= assetComponentNames[x] _%>
            <%_ } else { _%>
    <%_ %>    <%= assetComponentNames[x] %>,
            <%_ } _%>
          <%_ } _%>,
          <%_ for(var x=0;x<participantComponentNames.length;x++){ _%>
            <%_ if(x == participantComponentNames.length-1){ _%>
    <%_ %>    <%= participantComponentNames[x] _%>
            <%_ } else { _%>
    <%_ %>    <%= participantComponentNames[x] %>,
            <%_ } _%>
          <%_ } _%>,
          <%_ for(var x=0;x<transactionComponentNames.length;x++){ _%>
            <%_ if(x == transactionComponentNames.length-1){ _%>
    <%_ %>    <%= transactionComponentNames[x] _%>
            <%_ } else { _%>
    <%_ %>    <%= transactionComponentNames[x] %>,
            <%_ } _%>
          <%_ } %>
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
