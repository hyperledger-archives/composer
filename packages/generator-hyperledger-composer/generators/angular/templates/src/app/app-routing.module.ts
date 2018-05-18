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

import { HomeComponent } from './home/home.component';
<%_ for(var x=0;x<assetComponentNames.length;x++){ %>
import { <%= assetComponentNames[x] %> } from './<%= assetList[x].name %>/<%= assetList[x].name %>.component';<% } %>
<%_ _%>
<%_ for(var x=0;x<participantComponentNames.length;x++){ %>
import { <%= participantComponentNames[x] %> } from './<%= participantList[x].name %>/<%= participantList[x].name %>.component';<% } %>
<%_ _%>
<%_ for(var x=0;x<transactionComponentNames.length;x++){ %>
import { <%= transactionComponentNames[x] %> } from './<%= transactionList[x].name %>/<%= transactionList[x].name %>.component';<% } %>

const routes: Routes = [
  { path: '', component: HomeComponent },
		<%_ for(var x=0;x<assetComponentNames.length;x++){ _%>
  { path: '<%= assetList[x].name %>', component: <%= assetComponentNames[x] %> },
    <%_ } _%>
    <%_ for(var x=0;x<participantComponentNames.length;x++){ _%>
  { path: '<%= participantList[x].name %>', component: <%= participantComponentNames[x] %> },
    <%_ } _%>
    <%_ for(var x=0;x<transactionComponentNames.length;x++){ _%>
  { path: '<%= transactionList[x].name %>', component: <%= transactionComponentNames[x] %> },
        <%_ } _%>
  { path: '**', redirectTo: '' }
];

@NgModule({
 imports: [RouterModule.forRoot(routes)],
 exports: [RouterModule],
 providers: []
})
export class AppRoutingModule { }
