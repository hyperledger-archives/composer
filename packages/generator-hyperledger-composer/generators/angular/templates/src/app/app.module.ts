import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CookieService } from 'ngx-cookie-service';

import { AppRoutingModule } from './app-routing.module';
import { Configuration }     from './configuration';
import { DataService }     from './data.service';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NoopInterceptor } from 'app/http.interceptor';

<% for(var x=0;x<assetComponentNames.length;x++){ %>
import { <%= assetComponentNames[x] %> } from './<%= assetList[x].name %>/<%= assetList[x].name %>.component';<% } %>

<% for(var x=0;x<transactionComponentNames.length;x++){ %>
  import { <%= transactionComponentNames[x] %> } from './<%= transactionList[x].name %>/<%= transactionList[x].name %>.transaction';<% } %>
  
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    <% for(var x=0;x<transactionComponentNames.length;x++){ %>
    <%= transactionComponentNames[x] %>,
    <% } %>
  
    // TransactionComponent,
    <% for(var x=0;x<assetComponentNames.length;x++){ %><% if(x == assetComponentNames.length-1){ %>
    <%= assetComponentNames[x] %><%}else{%><%= assetComponentNames[x] %>,<% } %>
		<% } %>
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
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
