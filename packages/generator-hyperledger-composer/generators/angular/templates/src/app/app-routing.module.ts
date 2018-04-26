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

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// import { TransactionComponent } from './Transaction/Transaction.component'
import { HomeComponent } from './home/home.component';
<% for(var x=0;x<assetComponentNames.length;x++){ %>
import { <%= assetComponentNames[x] %> } from './<%= assetList[x].name %>/<%= assetList[x].name %>.component';<% } %>

<% for(var x=0;x<participantComponentNames.length;x++){ %>
  import { <%= participantComponentNames[x] %> } from './<%= participantList[x].name %>/<%= participantList[x].name %>.component';<% } %>

<% for(var x=0;x<transactionComponentNames.length;x++){ %>
  import { <%= transactionComponentNames[x] %> } from './<%= transactionList[x].name %>/<%= transactionList[x].name %>.component';<% } %>  
const routes: Routes = [
     //{ path: 'transaction', component: TransactionComponent },
    {path: '', component: HomeComponent},
		<% for(var x=0;x<assetComponentNames.length;x++){ %>
		{ path: '<%= assetList[x].name %>', component: <%= assetComponentNames[x] %>},
    <% } %>
    <% for(var x=0;x<participantComponentNames.length;x++){ %>
      { path: '<%= participantList[x].name %>', component: <%= participantComponentNames[x] %>},
      <% } %>
      <% for(var x=0;x<transactionComponentNames.length;x++){ %>
        { path: '<%= transactionList[x].name %>', component: <%= transactionComponentNames[x] %>},
        <% } %>
		{path: '**', redirectTo:''}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
