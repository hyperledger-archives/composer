import { NgModule }             from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { SettingsComponent } from './settings';
import { NoContentComponent } from './no-content';
import { GithubComponent } from './github';
import { IdentityComponent } from './identity';

export const ROUTES: Routes = [
    {path: 'editor', loadChildren: 'app/editor/editor.module#EditorModule'},
    {path: 'test', loadChildren: 'app/test/test.module#TestModule'},
    {path: 'identity', loadChildren: 'app/identity/identity.module#IdentityModule'},
    {path: 'profile', loadChildren: 'app/connection-profile/connection-profile.module#ConnectionProfileModule'},
    {path: 'github', component: GithubComponent},
    {path: '', redirectTo: 'editor', pathMatch: 'full'},
    {path: '**', component: NoContentComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(ROUTES, {useHash: false, preloadingStrategy: PreloadAllModules})],
    exports: [RouterModule]
})

export class AppRoutingModule {
}
