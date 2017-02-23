/*
 * Angular 2 decorators and services
 */
import {Component, ViewChild, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import {AppState} from './app.service';
import {AdminService} from './admin.service';
import {ClientService} from './client.service';
import {ConnectionProfileService} from './connectionprofile.service';
import {WalletService} from './wallet.service';
import {IdentityService} from './identity.service';
import {InitializationService} from './initialization.service';
import {AddIdentityComponent} from './addidentity';
import {BusyComponent} from './busy';
import {ErrorComponent} from './error';
import {ResetComponent} from './reset';

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

  @ViewChild(BusyComponent) private busyComponent: BusyComponent;
  @ViewChild(ErrorComponent) private errorComponent: ErrorComponent;
  @ViewChild(ResetComponent) private resetComponent: ResetComponent;
  @ViewChild(AddIdentityComponent) private addIdentityComponent: AddIdentityComponent;

  constructor(public appState: AppState,
              private route: ActivatedRoute,
              private router: Router,
              private adminService: AdminService,
              private clientService: ClientService,
              private connectionProfileService: ConnectionProfileService,
              private walletService: WalletService,
              private identityService: IdentityService,
              private initializationService: InitializationService,
              private modalService: NgbModal) {

  }

  ngOnInit() {
    console.log('Initial App State', this.appState.state);
    // Subscribe for status updates.
    this.subs = [
      this.adminService.busyStatus$.subscribe((busyStatus) => {
        this.onBusyStatus(busyStatus);
      }),
      this.adminService.errorStatus$.subscribe((errorStatus) => {
        this.onErrorStatus(errorStatus);
      }),
      this.clientService.busyStatus$.subscribe((busyStatus) => {
        this.onBusyStatus(busyStatus);
      }),
      this.clientService.errorStatus$.subscribe((errorStatus) => {
        this.onErrorStatus(errorStatus);
      }),
      this.adminService.connectionProfileChanged$.subscribe(() => {
        this.updateConnectionData();
      }),
      this.route.queryParams.subscribe((queryParams) => {
        this.queryParamsUpdated(queryParams);
      })
    ];
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  queryParamsUpdated(queryParams: Object): Promise<any> {
    // Check for the invitation if specified.
    let invitation = queryParams['invitation'];
    if (invitation) {
      let invitationData = JSON.parse(LZString.decompressFromEncodedURIComponent(invitation));
      let connectionProfileName = invitationData.connectionProfileName;
      let connectionProfile = invitationData.connectionProfile;
      let userID = invitationData.userID;
      let userSecret = invitationData.userSecret;
      // Create the connection profile and set it as the default.
      this.adminService.getAdminConnection().createProfile(connectionProfileName, connectionProfile);
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
          this.clientService.errorStatus$.next(error);
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

  reset(): Promise<any> {
    return this.resetComponent.displayAndWait()
      .then((result) => {
        if (result) {
          window.location.reload();
        }
      });
  }

  private updateConnectionData(): Promise<any> {
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

  private changeCurrentConnectionProfile(connectionProfile): Promise<any> {
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

  private addIdentity(connectionProfile?: string): Promise<string> {
    return this.addIdentityComponent.displayAndWait(connectionProfile)
      .then((result) => {
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
      this.busyComponent.displayAndWait(busyStatus);
    } else {
      this.busyComponent.close();
    }
  }

  private onErrorStatus(errorStatus) {
    if (errorStatus) {
      const modalRef  = this.modalService.open(ErrorComponent);
      modalRef.componentInstance.error = errorStatus;
    }
  }

}
