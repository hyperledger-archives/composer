import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BusinessNetworkDefinition } from 'composer-common';
import { AlertService } from '../services/alert.service';
import { ConnectionProfileService } from '../services/connectionprofile.service';

@Component({
    selector: 'add-connection-profile',
    templateUrl: './add-connection-profile.component.html',
    styleUrls: ['./add-connection-profile.component.scss'.toString()]
})
export class AddConnectionProfileComponent {

    @Input() businessNetwork: BusinessNetworkDefinition;

    currentFile = null;
    currentFileName = null;
    version = '';

    expandInput: boolean = false;

    maxFileSize: number = 5242880;
    supportedFileTypes: string[] = ['.json'];

    error = null;

    private connectionProfiles: any = [];
    private newConnectionProfile: any;
    private addConnectionProfileName: string = null;
    private addConnectionProfileDescription: string = null;
    private addConnectionProfileType: string = null;
    private addConnectionProfilePeerURL: string = null;
    private addConnectionProfileMembershipServicesURL: string = null;
    private addConnectionProfileEventHubURL: string = null;
    private addConnectionProfileKeyValStore: string = null;
    private addConnectionProfileDeployWaitTime: number = null;
    private addConnectionProfileInvokeWaitTime: number = null;
    private addConnectionProfileCertificate: string = null;
    private addConnectionProfileCertificatePath: string = null;

    // V1 attributes
    private addConnectionProfileOrderers: any[] = null;
    private addConnectionProfilePeers: any[] = null;
    private addConnectionProfileCertificateAuthority: string = null;
    private addConnectionProfileChannel: string = null;
    private addConnectionProfileMspId: string = null;

    constructor(private alertService: AlertService,
                public activeModal: NgbActiveModal,
                private connectionProfileService: ConnectionProfileService) {
    }

    removeFile() {
        this.expandInput = false;
        this.currentFile = null;
        this.currentFileName = null;
        this.version = '';
    }

    fileDetected() {
        this.expandInput = true;
    }

    fileLeft() {
        this.expandInput = false;
    }

    fileAccepted(file: File) {
        let type = file.name.substr(file.name.lastIndexOf('.') + 1);
        this.getDataBuffer(file)
        .then((data) => {
            if (type === 'json') {
                this.expandInput = true;
                this.createProfile(data);
            } else {
                throw new Error('Unexpected File Type');
            }
        })
        .catch((err) => {
            this.fileRejected(err);
        });
    }

    getDataBuffer(file: File) {
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);
            fileReader.onload = () => {
                let dataBuffer = Buffer.from(fileReader.result);
                resolve(dataBuffer);
            };
            fileReader.onerror = (err) => {
                reject(err);
            };
        });
    }

    createProfile(profileBuffer) {

        let profileData;
        // Converts buffer to string
        try {
            profileData = JSON.parse(profileBuffer.toString());
        } catch (e) {
            throw new Error('Parse error: ' + e.message);
        }

        // Set defaults
        if (profileData.type === 'hlf') {
            return this.setV06Defaults().then(() => {
                this.addConnectionProfileDescription = profileData.description;
                this.addConnectionProfileType = profileData.type;
                this.addConnectionProfileMembershipServicesURL = profileData.membershipServicesURL;
                this.addConnectionProfilePeerURL = profileData.peerURL;
                this.addConnectionProfileEventHubURL = profileData.eventHubURL;
                this.addConnectionProfileKeyValStore = profileData.keyValStore;
                this.addConnectionProfileDeployWaitTime = profileData.deployWaitTime;
                this.addConnectionProfileInvokeWaitTime = profileData.invokeWaitTime;
                this.addConnectionProfileCertificate = profileData.certificate;
                this.addConnectionProfileCertificatePath = profileData.certificatePath;
                this.addConnectionProfile();
            });
        } else if (profileData.type === 'hlfv1') {
            return this.setV1Defaults().then(() => {
                this.addConnectionProfileDescription = profileData.description;
                this.addConnectionProfileType = profileData.type;
                this.addConnectionProfileOrderers = profileData.orderers;

                this.addConnectionProfileCertificateAuthority = profileData.ca;
                this.addConnectionProfilePeers = profileData.peers;
                this.addConnectionProfileKeyValStore = profileData.keyValStore;
                this.addConnectionProfileChannel = profileData.channel;
                this.addConnectionProfileMspId = profileData.mspID;
                this.addConnectionProfileDeployWaitTime = profileData.deployWaitTime;
                this.addConnectionProfileInvokeWaitTime = profileData.invokeWaitTime;
                this.addConnectionProfile();
            });
        } else {
            throw new Error('Invalid type in profile: ' + profileData.type);
        }
    }

    fileRejected(reason: string) {
        this.alertService.errorStatus$.next(reason);
    }

    changeCurrentFileType() {
        this.currentFile = null;

        if (this.version === 'v06' || this.addConnectionProfileType === 'hlf') {
            return this.setV06Defaults().then(() => {
                this.newConnectionProfile = {
                    description: this.addConnectionProfileDescription,
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
            });

        } else if (this.version === 'v1') {

            return this.setV1Defaults().then(() => {
                this.newConnectionProfile = {
                    description: this.addConnectionProfileDescription,
                    type: 'hlfv1',
                    orderers: this.addConnectionProfileOrderers,
                    ca: this.addConnectionProfileCertificateAuthority,
                    peers: this.addConnectionProfilePeers,
                    keyValStore: this.addConnectionProfileKeyValStore,
                    channel: this.addConnectionProfileChannel,
                    mspID: this.addConnectionProfileMspId,
                    deployWaitTime: this.addConnectionProfileDeployWaitTime,
                    invokeWaitTime: this.addConnectionProfileInvokeWaitTime
                };
            });
        } else {
            throw new Error('Unsupported version');
        }
    }

    addConnectionProfile(): void {
        let connectionProfile;

        if (this.version === 'v06' || this.addConnectionProfileType === 'hlf') {
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
            connectionProfile = {
                description: this.addConnectionProfileDescription,
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
        } else if (this.version === 'v1' || this.addConnectionProfileType === 'hlfv1') {

            // If the orderers are a list of strings, we need to convert it to a list of objects.
            // Doing this allows the rest of the code to work as usual
            let newOrderersList = [];
            for (let x = 0; x < this.addConnectionProfileOrderers.length; x++) {
                if (typeof this.addConnectionProfileOrderers[x] === 'string') {
                    newOrderersList.push({url: this.addConnectionProfileOrderers[x], cert: '', hostnameOverride: ''});
                } else {
                    newOrderersList.push(this.addConnectionProfileOrderers[x]);
                }
            }

            connectionProfile = {
                description: this.addConnectionProfileDescription,
                type: 'hlfv1',
                orderers: newOrderersList,
                ca: this.addConnectionProfileCertificateAuthority,
                peers: this.addConnectionProfilePeers,
                keyValStore: this.addConnectionProfileKeyValStore,
                channel: this.addConnectionProfileChannel,
                mspID: this.addConnectionProfileMspId,
                deployWaitTime: this.addConnectionProfileDeployWaitTime,
                invokeWaitTime: this.addConnectionProfileInvokeWaitTime
            };
        } else {
            throw new Error('Unknown connection profile version selected');
        }

        let completeConnectionProfile = {
            name: this.addConnectionProfileName,
            profile: connectionProfile,
            default: this.addConnectionProfileName === '$default'
        };
        this.activeModal.close(completeConnectionProfile);

    }

    setV06Defaults(): Promise<any> {
        return this.updateConnectionProfiles().then(() => {
            let connectionProfileBase = 'New Connection Profile';
            let connectionProfileName = connectionProfileBase;
            let counter = 1;

            while (this.connectionProfiles.some((cp) => {
                return cp.name === connectionProfileName;
            })) {
                counter++;
                connectionProfileName = connectionProfileBase + ' ' + counter;
            }

            this.addConnectionProfileName = connectionProfileName;
            this.addConnectionProfileDescription = 'A description for a V0.6 Profile';
            this.addConnectionProfileType = 'hlf';
            this.addConnectionProfilePeerURL = 'grpc://localhost:7051';
            this.addConnectionProfileMembershipServicesURL = 'grpc://localhost:7054';
            this.addConnectionProfileEventHubURL = 'grpc://localhost:7053';
            this.addConnectionProfileKeyValStore = '/tmp/keyValStore';
            this.addConnectionProfileDeployWaitTime = 5 * 60;
            this.addConnectionProfileInvokeWaitTime = 30;
            this.addConnectionProfileCertificate = null;
            this.addConnectionProfileCertificatePath = null;
        });
    }

    setV1Defaults(): Promise<any> {
        return this.updateConnectionProfiles().then(() => {
            let connectionProfileBase = 'New Connection Profile';
            let connectionProfileName = connectionProfileBase;
            let counter = 1;

            while (this.connectionProfiles.some((cp) => {
                return cp.name === connectionProfileName;
            })) {
                counter++;
                connectionProfileName = connectionProfileBase + ' ' + counter;
            }

            this.addConnectionProfileName = connectionProfileName;
            this.addConnectionProfileDescription = 'A description for a V1 Profile';
            this.addConnectionProfileType = 'hlfv1';
            this.addConnectionProfileOrderers = [{
                url: 'grpc://localhost:7050',
                cert: '',
                hostnameOverride: ''
            }];

            this.addConnectionProfileCertificateAuthority = 'http://localhost:7054';
            this.addConnectionProfilePeers = [{
                requestURL: 'grpc://localhost:7051',
                eventURL: 'grpc://localhost:7053',
                cert: '',
                hostnameOverride: ''
            }];
            this.addConnectionProfileKeyValStore = '/tmp/keyValStore';
            this.addConnectionProfileChannel = 'mychannel';
            this.addConnectionProfileMspId = 'Org1MSP';
            this.addConnectionProfileDeployWaitTime = 5 * 60;
            this.addConnectionProfileInvokeWaitTime = 30;
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
        });
    }
}
