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
