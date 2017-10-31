import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule } from '@angular/http';
import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageModule } from 'angular-2-local-storage';

import { APP_BASE_HREF } from '@angular/common';

/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { AppRoutingModule } from './app-routing.module';
// App is our top level component
import { AppComponent } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';
import { AboutComponent } from './about';
import { BasicModalsModule } from './basic-modals/basic-modals.module';
import { WelcomeComponent } from './welcome';
import { NoContentComponent } from './no-content';
import { VersionCheckComponent } from './version-check';
import { ServicesModule } from './services/services.module';
import { DrawerModule } from './common/drawer';
import { TutorialLinkModule } from './common/tutorial-link';
import { ImportModule } from './import/import.module';

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
        VersionCheckComponent,
        WelcomeComponent
    ],
    declarations: [
        AboutComponent,
        AppComponent,
        NoContentComponent,
        VersionCheckComponent,
        WelcomeComponent
    ],
    imports: [ // import Angular's modules
        AppRoutingModule,
        BasicModalsModule,
        ImportModule,
        BrowserAnimationsModule,
        BrowserModule,
        HttpModule,
        ServicesModule,
        LocalStorageModule.withConfig({
            prefix: '',
            storageType: 'localStorage'
        }),
        NgbModule.forRoot(),
        DrawerModule.forRoot(),
        TutorialLinkModule
    ],
    providers: [ // expose our Services and Providers into Angular's dependency injection
        ENV_PROVIDERS,
        APP_PROVIDERS,
        {provide: APP_BASE_HREF, useValue: '/'}
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
