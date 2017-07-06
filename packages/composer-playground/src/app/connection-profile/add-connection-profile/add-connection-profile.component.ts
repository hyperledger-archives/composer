import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { AlertService } from '../../basic-modals/alert.service';
import { ConnectionProfileService } from '../../services/connectionprofile.service';
import { IdentityService } from '../../services/identity.service';

@Component({
    selector: 'add-connection-profile',
    templateUrl: './add-connection-profile.component.html',
    styleUrls: ['./add-connection-profile.component.scss'.toString()]
})
export class AddConnectionProfileComponent implements OnInit {

    @Input() connectionProfiles: any = [];
    @Output() profileToUse = new EventEmitter<any>();
    @Output() profileToEdit = new EventEmitter<any>();
    @Output() cancelAdd = new EventEmitter<any>();

    private newDefault = true;

    // Common attributes
    private connectionProfile: any = null;

    constructor(private alertService: AlertService,
                private connectionProfileService: ConnectionProfileService,
                private identityService: IdentityService) {
    }

    ngOnInit() {
        return this.updateConnectionProfiles();
    }

    updateConnectionProfiles(): Promise<any> {
        return this.connectionProfileService.getAllProfiles()
        .then((profiles) => {
            let newConnectionProfiles = [];
            let keys = Object.keys(profiles).sort();
            keys.forEach((key) => {
                return this.identityService.getIdentities(key)
                    .then((identities) => {
                        let identityList = [];
                        identities.forEach((identity) => {
                            identityList.push({
                                userId: identity,
                                businessNetwork: 'org-acme-biznet'
                            });
                        });

                        let connectionProfile = profiles[key];
                        newConnectionProfiles.push({
                            name: key,
                            profile: connectionProfile,
                            default: key === '$default',
                            description: 'Default connection profile',
                            identities: identityList
                        });
                });
            });
            this.connectionProfiles = newConnectionProfiles;
        });
    }

    generateProfileName(): string {
        let connectionProfileBase = 'New Connection Profile';
        let connectionProfileName = connectionProfileBase;
        let increment = 1;

        while ( this.connectionProfiles.findIndex((cp) => cp === connectionProfileName) !== -1 ) {
            connectionProfileName = connectionProfileBase + increment;
            increment++;
        }

        return connectionProfileName;
    }

    retrieveConnectionProfileByName(name: string): Promise<any>  {
        return this.connectionProfileService.getAllProfiles()
        .then((connectionProfiles) => {
            let newConnectionProfile;
            let keys = Object.keys(connectionProfiles).sort();
            keys.forEach((key) => {
                if (key === name) {
                    newConnectionProfile =  connectionProfiles[key];
                }
            });
            if (newConnectionProfile) {
                return newConnectionProfile;

            } else {
                throw new Error('Unknown connection profile name: ' + name);
            }
        });
    }

    setConnectionProfile(name: string) {
        return this.updateConnectionProfiles().then(() => {
            let profile;
            if (name.valueOf() === '_$v06') {
                // Wish to work with new V06
                this.newDefault = true;
                profile = {
                    description: 'A description for a V0.6 Profile',
                    type: 'hlf',
                    membershipServicesURL: 'grpc://localhost:7054',
                    peerURL: 'grpc://localhost:7051',
                    eventHubURL: 'grpc://localhost:7053',
                    keyValStore: '/tmp/keyValStore',
                    deployWaitTime: 5 * 60,
                    invokeWaitTime: 30,
                    certificate: null,
                    certificatePath: null
                };
            } else if (name.valueOf() === '_$v1') {
                // Wish to work with new V1
                this.newDefault = true;
                profile = {
                    description: 'A description for a V1 Profile',
                    type: 'hlfv1',
                    orderers: [{
                                url: 'grpc://localhost:7050',
                                cert: ''
                                }],
                    ca: {
                            url: 'http://localhost:7054',
                            name: ''
                        },
                    peers: [{
                                requestURL: 'grpc://localhost:7051',
                                eventURL: 'grpc://localhost:7053',
                                cert: ''
                            }],
                    keyValStore: '/tmp/keyValStore',
                    channel: 'composerchannel',
                    mspID: 'Org1MSP',
                    timeout: 5 * 60,
                };
            } else {
                // Wish to work with existing
                this.newDefault = false;
                // Retrieve details
                profile = this.retrieveConnectionProfileByName(name);
            }
            return profile;
        })
        .then((profile) => {
            this.connectionProfile = {
                name: this.newDefault ? this.generateProfileName() : name,
                profile: profile,
                default: this.newDefault ? false : true,
            };
        });
    }

    dismiss() {
        this.cancelAdd.emit(true);
    }

    initiateAddToProfile() {
        this.profileToUse.emit(this.connectionProfile.name);
    }

    initiateAddWithProfile() {
        this.profileToEdit.emit(this.connectionProfile);
    }
}
