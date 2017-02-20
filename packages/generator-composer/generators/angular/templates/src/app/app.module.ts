import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { Configuration }     from './configuration';
import { DataService }     from './data.service';
import { AppComponent } from './app.component';
// import { TransactionComponent } from './Transaction/Transaction.component'
<% for(var x=0;x<assetComponentNames.length;x++){ %>
import { <%= assetComponentNames[x] %> } from './<%= assetList[x].name %>/<%= assetList[x].name %>.component';<% } %>

<% for(var x=0;x<assetServiceNames.length;x++){ %>
import { <%= assetServiceNames[x] %> } from './<%= assetList[x].name %>/<%= assetList[x].name %>.service';<% } %>


@NgModule({
  declarations: [
    AppComponent,
    // TransactionComponent,
    <% for(var x=0;x<assetComponentNames.length;x++){ %><% if(x == assetComponentNames.length-1){ %>
    <%= assetComponentNames[x] %><% } else{ %>
    <%= assetComponentNames[x] %>,<% } %><% } %>
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    AppRoutingModule
  ],
  providers: [
    Configuration,
    DataService,<% for(var x=0;x<assetServiceNames.length;x++){ %><% if(x == assetServiceNames.length-1){ %>
    <%= assetServiceNames[x] %><% } else{ %>
    <%= assetServiceNames[x] %>,<% } %><% } %>
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
