import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AdminService } from '../admin.service';
import { ConnectionProfileService } from '../connectionprofile.service';
import { InitializationService } from '../initialization.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  private inUseConnectionProfile: any = null;
  private connectionProfiles: any = [];
  private currentConnectionProfile: any = null;
  private changingCurrentConnectionProfile: boolean = false;
  private code: string = null;
  private codeConfig = {
    lineNumbers: true,
    lineWrapping: true,
    readOnly: false,
    mode: 'javascript',
    autofocus: true,
    extraKeys: { 'Ctrl-Q': function(cm) { cm.foldCode(cm.getCursor()); } },
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    json: true
  };
  private addConnectionProfileName: string = null;
  private addConnectionProfilePeerURL: string = null;
  private addConnectionProfileMembershipServicesURL: string = null;
  private addConnectionProfileEventHubURL: string = null;
  private addConnectionProfileKeyValStore: string = null;
  private addConnectionProfileDeployWaitTime: number = null;
  private addConnectionProfileInvokeWaitTime: number = null;
  private addConnectionProfileCertificate: string = null;
  private addConnectionProfileCertificatePath: string = null;

  constructor(
    private adminService: AdminService,
    private connectionProfileService: ConnectionProfileService,
    private initializationService: InitializationService
  ) {

  }

  ngOnInit(): Promise<any> {
    this.setDefaults();
    this.inUseConnectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
    return this.updateConnectionProfiles()
      .then(() => {
        this.currentConnectionProfile = null;
        this.connectionProfiles.some((connectionProfile) => {
          if (!connectionProfile.default) {
            this.setCurrentConnectionProfile(connectionProfile);
            return true;
          }
          return false;
        });
      })
      .then(() => {
        return this.initializationService.initialize();
      });
  }

  private updateConnectionProfiles(): Promise<any> {
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
      });
  }

  private setCurrentConnectionProfile(currentConnectionProfile) {
    this.changingCurrentConnectionProfile = true;
    try {
      this.currentConnectionProfile = currentConnectionProfile;
      this.code = this.getCurrentCode();
    } finally {
      this.changingCurrentConnectionProfile = false;
    }
  }

  private getCurrentCode(): string {
    if (!this.currentConnectionProfile) {
      return null;
    }
    return JSON.stringify(this.currentConnectionProfile.profile, null, 2);
  }

  private setCurrentCode(): Promise<any> {
    let connectionProfile = this.currentConnectionProfile.profile;
    return this.adminService.getAdminConnection().createProfile(this.currentConnectionProfile.name, connectionProfile);
  }

  private onCodeChanged(): Promise<any> {
    if (this.changingCurrentConnectionProfile) {
      return Promise.resolve();
    }
    // Do we have a connection profile certificate?
    if (this.currentConnectionProfile.profile.certificate) {
      // That isn't just whitespace?
      if (this.currentConnectionProfile.profile.certificate.trim()) {
        let end = this.currentConnectionProfile.profile.certificate.slice(-1);
        if (end !== '\n') {
          this.currentConnectionProfile.profile.certificate += '\n';
        }
      }
    }
    return this.setCurrentCode();
  }

  private deleteConnectionProfile(connectionProfile): Promise<any> {
    let isCurrent = connectionProfile === this.currentConnectionProfile;
    return this.adminService.getAdminConnection().deleteProfile(connectionProfile.name)
      .then(() => {
        return this.updateConnectionProfiles();
      })
      .then(() => {
        if (isCurrent) {
          this.currentConnectionProfile = null;
          this.connectionProfiles.some((connectionProfile) => {
            if (!connectionProfile.default) {
              this.setCurrentConnectionProfile(connectionProfile);
              return true;
            }
            return false;
          });
        }
        this.adminService.connectionProfileChanged$.next(this.addConnectionProfileName);
      });
  }

  private addConnectionProfile(): Promise<any> {
    // Do we have a connection profile certificate?
    if (this.addConnectionProfileCertificate) {
      // That isn't just whitespace?
      if (this.addConnectionProfileCertificate.trim()) {
        let end = this.addConnectionProfileCertificate.slice(-1);
        if (end !== '\n') {
          this.addConnectionProfileCertificate += '\n';
        }
      }
    }
    let connectionProfile = {
      type: 'hlf',
      membershipServicesURL: this.addConnectionProfileMembershipServicesURL,
      peerURL: this.addConnectionProfilePeerURL,
      eventHubURL: this.addConnectionProfileEventHubURL,
      keyValStore: this.addConnectionProfileKeyValStore,
      deployWaitTime: this.addConnectionProfileDeployWaitTime,
      invokeWaitTime: this.addConnectionProfileInvokeWaitTime,
      certificate: this.addConnectionProfileCertificate,
      certificatePath: this.addConnectionProfileCertificatePath
    };
    return this.adminService.getAdminConnection().createProfile(this.addConnectionProfileName, connectionProfile)
      .then(() => {
        return this.updateConnectionProfiles();
      })
      .then(() => {
        this.connectionProfiles.some((connectionProfile) => {
          if (connectionProfile.name === this.addConnectionProfileName) {
            this.setCurrentConnectionProfile(connectionProfile);
            return true;
          }
          return false;
        });
        this.setDefaults();
        this.adminService.connectionProfileChanged$.next(this.addConnectionProfileName);
      });
  }

  private setDefaults() {
    this.addConnectionProfileName = 'hyperledger';
    this.addConnectionProfilePeerURL = 'grpc://localhost:7051';
    this.addConnectionProfileMembershipServicesURL = 'grpc://localhost:7054';
    this.addConnectionProfileEventHubURL = 'grpc://localhost:7053';
    this.addConnectionProfileKeyValStore = '/tmp/keyValStore';
    this.addConnectionProfileDeployWaitTime = 5 * 60;
    this.addConnectionProfileInvokeWaitTime = 30;
    this.addConnectionProfileCertificate = null;
    this.addConnectionProfileCertificatePath = null;
  }

}
