import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AdminService } from './services/admin.service';
import { ClientService } from './services/client.service';
import { AlertService } from './basic-modals/alert.service';
import { ConnectionProfileService } from './services/connectionprofile.service';
import { WalletService } from './services/wallet.service';
import { IdentityService } from './services/identity.service';
import { InitializationService } from './services/initialization.service';
import { BusyComponent } from './basic-modals/busy';
import { ErrorComponent } from './basic-modals/error';
import { WelcomeComponent } from './welcome';
import { VersionCheckComponent } from './version-check/version-check.component';
import { LocalStorageService } from 'angular-2-local-storage';
import { AboutService } from './services/about.service';
import { TransactionService } from './services/transaction.service';
import { ViewTransactionComponent } from './test/view-transaction';

/* tslint:disable-next-line:no-var-requires */
const LZString = require('lz-string');

/*
 * App Component
 * Top Level Component
 */
@Component({
    selector: 'app',
    encapsulation: ViewEncapsulation.None,
    styles: [
        require('../assets/styles/composer.scss').toString(),
        require('codemirror/lib/codemirror.css'),
        require('codemirror/addon/scroll/simplescrollbars.css'),
        require('./app.component.scss').toString()
    ],
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
    private connectionProfiles: any = [];
    private currentConnectionProfile: any = null;
    private identities: any = [];
    private currentIdentity: any = null;
    private subs: any = null;

    private usingLocally = false;
    private showHeaderLinks = false;
    private showWelcome = true;
    private dropListActive = false;

    private composerRuntimeVersion = '<none>';
    private participantFQI = '<none>';
    private composerBanner = ['Hyperledger', 'Composer Playground'];

    private busyModalRef = null;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private adminService: AdminService,
                private clientService: ClientService,
                private connectionProfileService: ConnectionProfileService,
                private walletService: WalletService,
                private identityService: IdentityService,
                private initializationService: InitializationService,
                private alertService: AlertService,
                private modalService: NgbModal,
                private localStorageService: LocalStorageService,
                private aboutService: AboutService,
                private transactionService: TransactionService) {

    }

    ngOnInit() {
        this.subs = [
            this.alertService.busyStatus$.subscribe((busyStatus) => {
                this.onBusyStatus(busyStatus);
            }),
            this.alertService.errorStatus$.subscribe((errorStatus) => {
                this.onErrorStatus(errorStatus);
            }),
            this.route.queryParams.subscribe((queryParams) => {
                this.queryParamsUpdated(queryParams);
            }),
            this.transactionService.event$.subscribe((eventStatus) => {
                this.onEvent(eventStatus);
            }),
            this.router.events.filter((e) => e instanceof NavigationEnd).subscribe((e) => {
                this.processRouteEvent(e);
            })
        ];
    }

    ngOnDestroy() {
        this.subs.forEach((sub) => {
            sub.unsubscribe();
        });
    }

    logout() {
        this.clientService.disconnect();
        this.identityService.setCurrentIdentity(null);
        this.connectionProfileService.setCurrentConnectionProfile(null);
        this.identityService.setLoggedIn(false);
        this.composerBanner = ['Hyperledger', 'Composer Playground'];
        this.showWelcome = false;

        return this.router.navigate(['/login']);
    }

    processRouteEvent(event): Promise<void> {
        let welcomePromise;
        if (event['url'] === '/login' && this.showWelcome) {
            welcomePromise = this.openWelcomeModal();
        } else {
            welcomePromise = this.checkVersion().then((success) => {
                if (!success) {
                    this.openVersionModal();
                }
            });
        }

        if (event['url'] === '/login' || event['urlAfterRedirects'] === '/login') {
            this.showHeaderLinks = false;
        } else {
            this.showHeaderLinks = true;
            this.clientService.ensureConnected()
            .then(() => {
                let profileName = this.connectionProfileService.getCurrentConnectionProfile() === '$default' ? 'Web' : this.connectionProfileService.getCurrentConnectionProfile();
                let busNetName = this.clientService.getBusinessNetworkName();
                this.composerBanner = [profileName, busNetName];
            });
        }

        return welcomePromise;
    }

    queryParamsUpdated(queryParams: Object): Promise<any> {
        // We load the connection profiles now, so we can immediately populate the menu.
        this.currentConnectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        return this.updateConnectionData()
            .then(() => {
                return this.initializationService.initialize();
            })
            .then(() => {
                // We then load the connection profiles again, as the connect calls may have
                // created versions of the default connection profiles.
                return this.updateConnectionData();
            })
            .then(() => {
                return this.initializationService.isWebOnly();
            })
            .then((webOnly) => {
                if (webOnly) {
                    this.usingLocally = false;
                } else {
                    this.usingLocally = true;
                }
            });
    }

    updateConnectionData(): Promise<any> {
        let newConnectionProfiles = [];
        return this.adminService.getAdminConnection().getAllProfiles()
            .then((connectionProfiles) => {
                let keys = Object.keys(connectionProfiles).sort();
                keys.forEach((key) => {
                    let connectionProfile = connectionProfiles[key];
                    newConnectionProfiles.push({
                        name: key,
                        profile: connectionProfile,
                        default: key === '$default'
                    });
                });
                this.connectionProfiles = newConnectionProfiles;
                return this.identityService.getCurrentIdentities();
            })
            .then((identities) => {
                this.identities = identities;
            });
    }

    onBusyStatus(busyStatus) {
        let currentConnectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        if (currentConnectionProfile === '$default') {
            // Don't show the modal for the web runtime, as it's too fast to care.
            return;
        }

        if (!this.busyModalRef && busyStatus) {
            this.busyModalRef = this.modalService.open(BusyComponent);
            this.busyModalRef.componentInstance.busy = busyStatus;
        } else if (this.busyModalRef && busyStatus) {
            this.busyModalRef.componentInstance.busy = busyStatus;
        } else if (this.busyModalRef && !busyStatus) {
            this.busyModalRef.close();
            this.busyModalRef = null;
        }
    }

    onErrorStatus(errorStatus) {
        if (errorStatus) {
            const modalRef = this.modalService.open(ErrorComponent);
            modalRef.componentInstance.error = errorStatus;
        }
    }

    onEvent(eventStatus) {
        if (eventStatus) {
            let transactionModalRef = this.modalService.open(ViewTransactionComponent);
            transactionModalRef.componentInstance.transaction = this.transactionService.lastTransaction;
            transactionModalRef.componentInstance.events = this.transactionService.events;
        }
    }

    onToggle(open) {
        if (open) {
            this.dropListActive = true;
        } else {
            this.dropListActive = false;
        }
    }

    onToggle(open) {
        if (open) {
            this.dropListActive = true;
        } else {
            this.dropListActive = false;
        }
    }

    private openWelcomeModal() {
        return this.checkVersion().then((success) => {
            if (success) {
                this.modalService.open(WelcomeComponent);
            } else {
                this.modalService.open(VersionCheckComponent);
            }
        });
    }

    private openVersionModal() {
        this.modalService.open(VersionCheckComponent);
    }

    private checkVersion(): Promise<boolean> {
        let currentPlaygroundVersion = this.getPlaygroundDetails();

        if (currentPlaygroundVersion === null) {
            return this.setPlaygroundDetails().then(() => {
                return true;
            });
        } else {
            return this.aboutService.getVersions().then((versions) => {
                let latestPlaygroundVersion = versions.playground.version;
                if (currentPlaygroundVersion !== latestPlaygroundVersion) {
                    return false;
                } else {
                    return true;
                }
            });
        }
    }

    private setPlaygroundDetails(): Promise<any> {
        let key = `playgroundVersion`;
        return this.aboutService.getVersions().then((versions) => {
            this.localStorageService.set(key, versions.playground.version);
        });
    }

    private getPlaygroundDetails(): string {
        let key = `playgroundVersion`;
        return this.localStorageService.get<string>(key);
    }
}
