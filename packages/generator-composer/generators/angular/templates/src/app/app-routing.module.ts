import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// import { TransactionComponent } from './Transaction/Transaction.component'
<% for(var x=0;x<assetComponentNames.length;x++){ %>
import { <%= assetComponentNames[x] %> } from './<%= assetList[x].name %>/<%= assetList[x].name %>.component';<% } %>

const routes: Routes = [
    // { path: 'transaction', component: TransactionComponent },
<% for(var x=0;x<assetComponentNames.length;x++){ %><% if(x == assetList.length-1){ %>
    { path: '<%= assetList[x].name %>', component: <%= assetComponentNames[x] %>}<% } else{ %>
    { path: '<%= assetList[x].name %>', component: <%= assetComponentNames[x] %>},<% } %><% } %>

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
