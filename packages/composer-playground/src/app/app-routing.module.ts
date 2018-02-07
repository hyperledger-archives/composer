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
import { NgModule }             from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { NoContentComponent } from './no-content';
import { CanActivateViaLogin } from './can-activate';

export const ROUTES: Routes = [
    {path: 'editor', loadChildren: 'app/editor/editor.module#EditorModule', canActivate: [CanActivateViaLogin]},
    {path: 'test', loadChildren: 'app/test/test.module#TestModule', canActivate: [CanActivateViaLogin]},
    {path: 'identity', loadChildren: 'app/identity/identity.module#IdentityModule', canActivate: [CanActivateViaLogin]},
    {path: 'login', loadChildren: 'app/login/login.module#LoginModule'},
    {path: '', redirectTo: 'editor', pathMatch: 'full'},
    {path: '**', component: NoContentComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(ROUTES, {useHash: false, preloadingStrategy: PreloadAllModules})],
    providers: [CanActivateViaLogin],
    exports: [RouterModule]
})

export class AppRoutingModule {
}
