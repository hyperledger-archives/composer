import {Routes} from '@angular/router';
import {EditorComponent} from './editor';
import {TestComponent} from './test';
import {AssetRegistriesComponent} from './assetregistries';
import {AssetRegistryComponent} from './assetregistry';
import {ParticipantRegistriesComponent} from './participantregistries';
import {ParticipantRegistryComponent} from './participantregistry';
import {TransactionRegistryComponent} from './transactionregistry';
import {SettingsComponent} from './settings';
import {NoContentComponent} from './no-content';
import {GithubComponent} from './github';
import {ConnectionProfileComponent} from './connectionprofile/connectionprofile.component.ts';

export const ROUTES: Routes = [
  {path: 'editor', component: EditorComponent},
  {path: 'test', component: TestComponent},
  {path: 'assetregistries', component: AssetRegistriesComponent},
  {path: 'assetregistries/:id', component: AssetRegistryComponent},
  {path: 'participantregistries', component: ParticipantRegistriesComponent},
  {path: 'participantregistries/:id', component: ParticipantRegistryComponent},
  {path: 'transactionregistry', component: TransactionRegistryComponent},
  {path: 'settings', component: SettingsComponent},
  {path: 'profile', component: ConnectionProfileComponent},
  {path: 'github', component: GithubComponent},
  {path: '', redirectTo: 'editor', pathMatch: 'full'},
  {path: '**', component: NoContentComponent}
];
