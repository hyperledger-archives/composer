import { Component, OnInit } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AddConnectionProfileComponent } from './add-connection-profile/add-connection-profile.component.ts';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AlertService } from '../basic-modals/alert.service';

@Component({
    selector: 'connection-profile',
    templateUrl: './connection-profile.component.html',
    styleUrls: [
        './connection-profile.component.scss'.toString()
    ]
})
export class ConnectionProfileComponent implements OnInit {

    private warningVisible: boolean = false;

    private connectionProfiles: any;
    private currentConnectionProfile;
    private previousConnectionProfile;
    private activeProfile;

    constructor(private connectionProfileService: ConnectionProfileService,
                private modalService: NgbModal,
                private alertService: AlertService) {

    }

    ngOnInit(): any {
        this.activeProfile = this.connectionProfileService.getCurrentConnectionProfile();
        return this.updateConnectionProfiles().then(() => {
            for (let profile in this.connectionProfiles) {
                if (this.connectionProfiles[profile].name === this.activeProfile) {
                    this.setCurrentProfile(this.connectionProfiles[profile]);
                    break;
                }
            }
        });
    }

    setCurrentProfile(connectionProfile) {
        this.previousConnectionProfile = this.currentConnectionProfile;
        this.currentConnectionProfile = connectionProfile;
        return this.updateConnectionProfiles();
    }

    hideWarning() {
        this.warningVisible = false;
    }

    openAddProfileModal() {
        this.modalService.open(AddConnectionProfileComponent).result
            .then((result) => {
                this.setCurrentProfile(result);
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.errorStatus$.next(reason);
                }
            });
    }

    updateConnectionProfiles(): Promise<any> {
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
                if (this.currentConnectionProfile === null) {
                    this.currentConnectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
                }

                this.activeProfile = this.connectionProfileService.getCurrentConnectionProfile();
            });
    }

    profileUpdated(event) {
        // If form is cancelled, we want to switch to the previous file selected
        if (!event || (event && !event.updated)) {
            if (this.previousConnectionProfile && this.previousConnectionProfile.name === 'New Connection Profile') {
                for (let profile in this.connectionProfiles) {
                    let currentProfile = this.connectionProfileService.getCurrentConnectionProfile();
                    if (this.connectionProfiles[profile].name === currentProfile) {
                        return this.setCurrentProfile(this.connectionProfiles[profile]);
                    }
                }
            } else {
                this.currentConnectionProfile = this.previousConnectionProfile;
            }
        }

        if (event && event.connectionProfile) {
            return this.setCurrentProfile(event.connectionProfile);
        }

        return this.updateConnectionProfiles();
    }
}
