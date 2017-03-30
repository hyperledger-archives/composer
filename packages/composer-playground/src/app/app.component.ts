import {Component, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';

import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {AppState} from './app.service';
import {AdminService} from './services/admin.service';
import {ClientService} from './services/client.service';
import {AlertService} from './services/alert.service';
import {ConnectionProfileService} from './services/connectionprofile.service';
import {EditorService} from './services/editor.service';

import {WalletService} from './wallet.service';
import {IdentityService} from './identity.service';
import {InitializationService} from './initialization.service';
import {AddIdentityComponent} from './addidentity';
import {BusyComponent} from './busy';
import {ErrorComponent} from './error';
import {ResetComponent} from './reset';
import {SuccessComponent} from './success';
import {WelcomeComponent} from './welcome';
import { VersionCheckComponent } from './version-check/version-check.component.ts';
import { LocalStorageService } from 'angular-2-local-storage';
import { AboutService } from './services/about.service';

const LZString = require('lz-string');

const composerPackageVersion = require('../../package.json').version;

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
export class AppComponent {
  angularclassLogo = 'assets/img/angularclass-avatar.png';
  name = 'Angular 2 Webpack Starter';
  url = 'https://twitter.com/AngularClass';

  private connectionProfiles: any = [];
  private currentConnectionProfile: any = null;
  private identities: any = [];
  private currentIdentity: any = null;
  private subs: any = null;

  private composerPackageVersion = composerPackageVersion;
  private composerRuntimeVersion = '<none>';
  private participantFQI = '<none>';

  constructor(public appState: AppState,
              private route: ActivatedRoute,
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
              private editorService: EditorService) {

  }

  ngOnInit() {
    console.log('Initial App State', this.appState.state);

    this.subs = [
          this.alertService.busyStatus$.subscribe((busyStatus) => {
            this.onBusyStatus(busyStatus);
          }),
          this.alertService.errorStatus$.subscribe((errorStatus) => {
            this.onErrorStatus(errorStatus);
          }),
          this.alertService.successStatus$.subscribe((successStatus) => {
            this.onSuccessStatus(successStatus);
          }),
          this.adminService.connectionProfileChanged$.subscribe(() => {
            this.updateConnectionData();
          }),
          this.route.queryParams.subscribe((queryParams) => {
            this.queryParamsUpdated(queryParams);
          }),
          this.router.events.filter(e => e instanceof NavigationEnd).subscribe((e) => {
            if(e.url === '/') {
              this.openWelcomeModal();
            }
            else{
              return this.checkVersion().then((success)=>{
                if(!success){
                  this.openVersionModal();
                }
              });
            }

          })
        ];


  }

  ngOnDestroy() {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  queryParamsUpdated(queryParams: Object): Promise <any> {
    // Check for the invitation if specified.
    let invitation = queryParams['invitation'];
    if (invitation) {
      let invitationData = JSON.parse(LZString.decompressFromEncodedURIComponent(invitation));
      let connectionProfileName = invitationData.connectionProfileName;
      let connectionProfile = invitationData.connectionProfile;
      let userID = invitationData.userID;
      let userSecret = invitationData.userSecret;
      // Create the connection profile and set it as the default.
      this.connectionProfileService.createProfile(connectionProfileName, connectionProfile);
      this.connectionProfileService.setCurrentConnectionProfile(connectionProfileName);
      // Add the credentials to the wallet.
      let wallet = this.walletService.getWallet(connectionProfileName);
      return wallet.contains(userID)
        .then((exists) => {
          if (exists) {
            return wallet.update(userID, userSecret);
          } else {
            return wallet.add(userID, userSecret);
          }
        })
        .then(() => {
          return this.identityService.setIdentity(connectionProfileName, userID);
        })
        .then(() => {
          return this.router.navigate(['/editor'])
            .then((result) => {
              if (result) {
                window.location.reload();
              } else {
                throw new Error('Failed to navigate to main page');
              }
            });
        })
        .catch((error) => {
          this.alertService.errorStatus$.next(error);
        });
    } else {
      console.log('no invitation here');
    }

    // We load the connection profiles now, so we can immediately populate the menu.
    this.currentConnectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
    return this.updateConnectionData()
      .then(() => {
        return this.initializationService.initialize();
      })
      .then(() => {
        return this.clientService.getBusinessNetworkConnection().ping();
      })
      .then((ping) => {
        this.composerRuntimeVersion = ping.version || this.composerRuntimeVersion;
        this.participantFQI = ping.participant || this.participantFQI;
        // We then load the connection profiles again, as the connect calls may have
        // created versions of the default connection profiles.
        return this.updateConnectionData();
      })
      .then(() => {
        return this.identityService.getCurrentIdentity();
      })
      .then((currentIdentity) => {
        this.currentIdentity = currentIdentity;
      });
  }

  reset(): Promise <any> {
    return this.modalService.open(ResetComponent).result.then((result) => {
      if (result) {
        window.location.reload();
      }
    });
  }

  private updateConnectionData(): Promise <any > {
    let newConnectionProfiles = [];
    return this.connectionProfileService.getAllProfiles()
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

  private changeCurrentConnectionProfile(connectionProfile): Promise <any> {
    console.log('Changing current connection profile', connectionProfile.name);
    return this.identityService.getIdentities(connectionProfile.name)
      .then((credentials) => {
        // If there are no credentials in the wallet then we need to ask.
        if (credentials.length === 0) {
          console.log('No credentials in wallet');
          // Ask for a new identity.
          return this.addIdentity(connectionProfile.name)
            .then((identity) => {
              if (identity) {
                // Set the current identity to the new identity.
                this.identityService.setIdentity(connectionProfile.name, identity);
                return identity;
              }
            });
          // Otherwise there are credentials in the wallet, but we need to check
          // that the current identity is valid.
        } else {
          console.log('Have credentials in wallet', credentials.join(', '));
          // Get the current identity.
          return this.identityService.getIdentity(connectionProfile.name)
            .then((identity) => {
              // Does it exist in the list, if not select another oen.
              if (credentials.indexOf(identity) === -1) {
                // Select the first identity.
                identity = credentials[0];
                // Set the current identity to the first identity.
                this.identityService.setIdentity(connectionProfile.name, identity);
              }
              return identity;
            });
        }
      }).then((result) => {
        if (result) {
          this.connectionProfileService.setCurrentConnectionProfile(connectionProfile.name);
          window.location.reload();
        }
      });
  }

  private addIdentity(connectionProfile ?: string): Promise < string > {
    let modalRef = this.modalService.open(AddIdentityComponent);
    modalRef.componentInstance.connectionProfileOverride = connectionProfile;

    return modalRef.result.then((result) => {
      if (result) {
        return this.updateConnectionData()
          .then(() => {
            return result;
          });
      } else {
        return result;
      }
    });
  }

  private changeCurrentIdentity(identity) {
    this.identityService.setCurrentIdentity(identity);
    window.location.reload();
  }

  private onBusyStatus(busyStatus) {
    let currentConnectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
    if (currentConnectionProfile === '$default') {
      // Don't show the modal for the web runtime, as it's too fast to care.
      return;
    }
    if (busyStatus) {
      const modalRef = this.modalService.open(BusyComponent);
      modalRef.componentInstance.busy = busyStatus;
    }
  }

  private onErrorStatus(errorStatus) {
    if (errorStatus) {
      const modalRef = this.modalService.open(ErrorComponent);
      modalRef.componentInstance.error = errorStatus;
    }
  }

  private onSuccessStatus(successStatus) {
    if (successStatus) {
      const modalRef  = this.modalService.open(SuccessComponent);
      modalRef.componentInstance.success = successStatus;
    }
  }

  private openWelcomeModal() {
    return this.checkVersion().then((success)=>{
      if(success){
        this.modalService.open(WelcomeComponent);
      }
      else{
        this.modalService.open(VersionCheckComponent);
      }
    });
  }

  private openVersionModal() {
    this.modalService.open(VersionCheckComponent);
  }


  private checkVersion():Promise<boolean> {
    let currentPlaygroundVersion = this.getPlaygroundDetails();

    if(currentPlaygroundVersion === null){
      return this.setPlaygroundDetails().then(()=>{
        return true;
      });
    }
    else{
      return this.aboutService.getVersions().then((versions) => {
        let latestPlaygroundVersion = versions.playground.version;
        if(currentPlaygroundVersion != latestPlaygroundVersion){
          return false;
        }
        else{
          return true;
        }
      });
    }
  }

  private setPlaygroundDetails(): Promise<any> {
    let key = `playgroundVersion`;
    return this.aboutService.getVersions().then((versions) => {
      this.localStorageService.set(key, versions.playground.version);
    })
  }

  private getPlaygroundDetails(): string {
    let key = `playgroundVersion`;
    let result = this.localStorageService.get<string>(key);
    return result;
  }


}
