import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { DataService }     from './data.service';
import { Configuration }     from './configuration';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { NoopInterceptor } from './http.interceptor';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// import { TransactionComponent } from './Transaction/Transaction.component'
<% for(var x=0;x<assetComponentNames.length;x++){ %>
import { <%= assetComponentNames[x] %> } from './<%= assetList[x].name %>/<%= assetList[x].name %>.component';<% } %>

@NgModule({
  declarations: [
    AppComponent,
		HomeComponent,
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
    HttpModule,
    AppRoutingModule
  ],
  providers: [
    Configuration,
    DataService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NoopInterceptor,
      multi: true,
    },
    CookieService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
