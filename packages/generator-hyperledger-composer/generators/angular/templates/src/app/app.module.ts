import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { Configuration }     from './configuration';
import { DataService }     from './data.service';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
// import { TransactionComponent } from './Transaction/Transaction.component'
<% for(var x=0;x<assetComponentNames.length;x++){ %>
import { <%= assetComponentNames[x] %> } from './<%= assetList[x].name %>/<%= assetList[x].name %>.component';<% } %>

<% for(var x=0;x<participantComponentNames.length;x++){ %>
  import { <%= participantComponentNames[x] %> } from './<%= participantList[x].name %>/<%= participantList[x].name %>.component';<% } %>

@NgModule({
  declarations: [
    AppComponent,
		HomeComponent,
    // TransactionComponent,
    <% for(var x=0;x<assetComponentNames.length;x++){ %><% if(x == assetComponentNames.length-1){ %>
    <%= assetComponentNames[x] %><%}else{%><%= assetComponentNames[x] %>,<% } %>
    <% } %>,
    
    <% for(var x=0;x<participantComponentNames.length;x++){ %><% if(x == participantComponentNames.length-1){ %>
      <%= participantComponentNames[x] %><%}else{%><%= participantComponentNames[x] %>,<% } %>
      <% } %>
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
    DataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
