import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, PreloadAllModules } from '@angular/router';
import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr';
import { ModalModule, TooltipModule } from 'ng2-bootstrap';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageModule } from 'angular-2-local-storage';

import {APP_BASE_HREF} from '@angular/common';

/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';
// App is our top level component
import { AppComponent } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';
import { EditorComponent } from './editor';
import { TestComponent } from './test';
import { RegistryComponent } from './registry';
import { SettingsComponent } from './settings';
import { AddIdentityComponent } from './addidentity';
import { AboutComponent } from './about';
import { BusyComponent } from './busy';
import { ErrorComponent } from './error';
import { ResetComponent } from './reset';
import { FileImporterComponent } from './file-importer';
import { ImportComponent } from './import';
import { ExportComponent } from './export';
import { ResourceComponent } from './resource';
import { AddFileComponent } from './add-file';
import { ConnectionProfileComponent } from './connectionprofile/connectionprofile.component.ts';
import { WelcomeComponent } from './welcome';

import { GithubComponent } from './github';
import { NoContentComponent } from './no-content';
import { CodemirrorModule } from 'ng2-codemirror';


import { FileDragDropDirective } from './directives/file-drag-drop';
import { CheckOverFlowDirective } from './directives/check-overflow';

import { AdminService } from './services/admin.service';
import { ClientService } from './services/client.service';
import { ConnectionProfileService } from './connectionprofile.service';
import { WalletService } from './wallet.service';
import { IdentityService } from './identity.service';
import { NotificationService } from './notification.service';
import { InitializationService } from './initialization.service';
import { SampleBusinessNetworkService } from './services/samplebusinessnetwork.service';
import { AboutService } from './services/about.service';
import { AlertService } from './services/alert.service';

let actionBasedIcons = require.context('../assets/svg/action-based', false, /.*\.svg$/);
actionBasedIcons.keys().forEach(actionBasedIcons);
let formattingIcons = require.context('../assets/svg/formatting', false, /.*\.svg$/);
formattingIcons.keys().forEach(formattingIcons);
let objectBasedIcons = require.context('../assets/svg/object-based', false, /.*\.svg$/);
objectBasedIcons.keys().forEach(objectBasedIcons);
let otherIcons = require.context('../assets/svg/other', false, /.*\.svg$/);
otherIcons.keys().forEach(otherIcons);

// Application wide providers
const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AppState
];

type StoreType = {
  state: InternalStateType,
  restoreInputValues: () => void,
  disposeOldHosts: () => void
};

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ AppComponent ],
  entryComponents: [
    ImportComponent,
    ExportComponent,
    ErrorComponent,
    ResourceComponent,
    AddFileComponent,
    WelcomeComponent,
    ResetComponent,
    BusyComponent
  ],
  declarations: [
    AppComponent,
    FileImporterComponent,
    EditorComponent,
    TestComponent,
    RegistryComponent,
    SettingsComponent,
    AddIdentityComponent,
    BusyComponent,
    ErrorComponent,
    ResetComponent,
    ImportComponent,
    ExportComponent,
    GithubComponent,
    NoContentComponent,
    AboutComponent,
    FileDragDropDirective,
    ConnectionProfileComponent,
    ResourceComponent,
    CheckOverFlowDirective,
    AddFileComponent,
    WelcomeComponent
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(ROUTES, { useHash: false, preloadingStrategy: PreloadAllModules }),
    CodemirrorModule,
    ModalModule.forRoot(),
    TooltipModule.forRoot(),
    NgbModule.forRoot(),
    LocalStorageModule.withConfig({
      prefix: 'Concerto',
      storageType: 'localStorage'
    })
  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    ENV_PROVIDERS,
    APP_PROVIDERS,
    {provide: APP_BASE_HREF, useValue: '/'},
    AdminService,
    ClientService,
    ConnectionProfileService,
    WalletService,
    IdentityService,
    NotificationService,
    InitializationService,
    SampleBusinessNetworkService,
    AboutService,
    AlertService
  ]
})
export class AppModule {
  constructor(public appRef: ApplicationRef, public appState: AppState) {}

  hmrOnInit(store: StoreType) {
    if (!store || !store.state) return;
    console.log('HMR store', JSON.stringify(store, null, 2));
    // set state
    this.appState._state = store.state;
    // set input values
    if ('restoreInputValues' in store) {
      let restoreInputValues = store.restoreInputValues;
      setTimeout(restoreInputValues);
    }

    this.appRef.tick();
    delete store.state;
    delete store.restoreInputValues;
  }

  hmrOnDestroy(store: StoreType) {
    const cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);
    // save state
    const state = this.appState._state;
    store.state = state;
    // recreate root elements
    store.disposeOldHosts = createNewHosts(cmpLocation);
    // save input values
    store.restoreInputValues  = createInputTransfer();
    // remove styles
    removeNgStyles();
  }

  hmrAfterDestroy(store: StoreType) {
    // display new elements
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }

}
