import { Routes } from '@angular/router';
import { EditorComponent } from './editor';
import { TestComponent } from './test';
import { SettingsComponent } from './settings';
import { NoContentComponent } from './no-content';
import { GithubComponent } from './github';
import { ConnectionProfileComponent } from './connection-profile/connection-profile.component.ts';
import { IdentityComponent } from './identity';

export const ROUTES: Routes = [
  {path: 'editor', component: EditorComponent},
  {path: 'test', component: TestComponent},
  {path: 'identity', component: IdentityComponent},
  {path: 'profile', component: ConnectionProfileComponent},
  {path: 'github', component: GithubComponent},
  {path: '', redirectTo: 'editor', pathMatch: 'full'},
  {path: '**', component: NoContentComponent}
];
