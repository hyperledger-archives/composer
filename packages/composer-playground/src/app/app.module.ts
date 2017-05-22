import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, PreloadAllModules } from '@angular/router';
import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr';
import { ModalModule, TooltipModule } from 'ng2-bootstrap';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageModule } from 'angular-2-local-storage';

import { APP_BASE_HREF } from '@angular/common';

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
import { EditorFileComponent } from './editor-file';
import { TestComponent } from './test';
import { RegistryComponent } from './registry';
import { AddIdentityComponent } from './add-identity';
import { IssueIdentityComponent } from './issue-identity';
import { IdentityIssuedComponent } from './identity-issued';
import { SwitchIdentityComponent } from './switch-identity';
import { AboutComponent } from './about';
import { BusyComponent } from './basic-modals/busy';
import { ErrorComponent } from './basic-modals/error';
import { SuccessComponent } from './basic-modals/success';
import { FileImporterComponent } from './file-importer';
import { ImportComponent } from './import';
import { ResourceComponent } from './resource';
import { AddFileComponent } from './add-file';
import { TransactionComponent } from './transaction';
import { IdentityComponent } from './identity';
import { WelcomeComponent } from './welcome';
import { ConfirmComponent } from './basic-modals/confirm';
import { DeleteComponent } from './basic-modals/delete-confirm';
import { ReplaceComponent } from './basic-modals/replace-confirm';
import { GithubComponent } from './github';
import { NoContentComponent } from './no-content';
import { CodemirrorModule } from 'ng2-codemirror';
import { VersionCheckComponent } from './version-check';
import { ConnectionProfileComponent } from './connection-profile';
import { ConnectionProfileDataComponent } from './connection-profile-data';
import { AddConnectionProfileComponent } from './add-connection-profile';
import { DeleteConnectionProfileComponent } from './delete-connection-profile';
import { AddCertificateComponent } from './add-certificate';
import { ViewCertificateComponent } from './view-certificate';
import { FileDragDropDirective } from './directives/file-drag-drop';
import { CheckOverFlowDirective } from './directives/check-overflow';
import { FocusHereDirective } from './directives/focus-here';

import { AdminService } from './services/admin.service';
import { ClientService } from './services/client.service';
import { ConnectionProfileService } from './services/connectionprofile.service';
import { WalletService } from './services/wallet.service';
import { IdentityService } from './services/identity.service';
import { InitializationService } from './services/initialization.service';
import { SampleBusinessNetworkService } from './services/samplebusinessnetwork.service';
import { AboutService } from './services/about.service';
import { AlertService } from './services/alert.service';
import { EditorService } from './services/editor.service';

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
    bootstrap: [AppComponent],
    entryComponents: [
        ImportComponent,
        ErrorComponent,
        SuccessComponent,
        ConfirmComponent,
        DeleteComponent,
        ReplaceComponent,
        ResourceComponent,
        TransactionComponent,
        AddFileComponent,
        AddConnectionProfileComponent,
        AddCertificateComponent,
        DeleteConnectionProfileComponent,
        ViewCertificateComponent,
        AddIdentityComponent,
        IssueIdentityComponent,
        IdentityIssuedComponent,
        WelcomeComponent,
        VersionCheckComponent,
        BusyComponent,
        SwitchIdentityComponent
    ],
    declarations: [
        AppComponent,
        FileImporterComponent,
        EditorComponent,
        EditorFileComponent,
        TestComponent,
        RegistryComponent,
        AddIdentityComponent,
        IssueIdentityComponent,
        IdentityIssuedComponent,
        SwitchIdentityComponent,
        BusyComponent,
        ErrorComponent,
        SuccessComponent,
        ConfirmComponent,
        DeleteComponent,
        ReplaceComponent,
<<<<<<< 4eb3fd391dd9f1b7edd24b5254c56ccc8bd713a1
=======
        ResetComponent,
>>>>>>> add BND deploy warning modal and move basic-modals into sub folder
        ImportComponent,
        GithubComponent,
        NoContentComponent,
        AboutComponent,
        FileDragDropDirective,
        ConnectionProfileComponent,
        ConnectionProfileDataComponent,
        AddConnectionProfileComponent,
        DeleteConnectionProfileComponent,
        AddCertificateComponent,
        ViewCertificateComponent,
        IdentityComponent,
        ResourceComponent,
        TransactionComponent,
        CheckOverFlowDirective,
        AddFileComponent,
        WelcomeComponent,
        VersionCheckComponent,
        FocusHereDirective
    ],
    imports: [ // import Angular's modules
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        RouterModule.forRoot(ROUTES, {useHash: false, preloadingStrategy: PreloadAllModules}),
        CodemirrorModule,
        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        NgbModule.forRoot(),
        LocalStorageModule.withConfig({
            prefix: '',
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
        InitializationService,
        SampleBusinessNetworkService,
        AboutService,
        AlertService,
        EditorService
    ]
})
export class AppModule {
    constructor(public appRef: ApplicationRef, public appState: AppState) {
    }

    hmrOnInit(store: StoreType) {
        if (!store || !store.state) {
            return;
        }

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
        const cmpLocation = this.appRef.components.map((cmp) => cmp.location.nativeElement);
        // save state
        const state = this.appState._state;
        store.state = state;
        // recreate root elements
        store.disposeOldHosts = createNewHosts(cmpLocation);
        // save input values
        store.restoreInputValues = createInputTransfer();
        // remove styles
        removeNgStyles();
    }

    hmrAfterDestroy(store: StoreType) {
        // display new elements
        store.disposeOldHosts();
        delete store.disposeOldHosts;
    }

}
