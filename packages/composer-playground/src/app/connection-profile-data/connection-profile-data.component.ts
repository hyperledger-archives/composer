import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
    FormGroup,
    FormArray,
    Validators,
    FormBuilder
} from '@angular/forms';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { DeleteConnectionProfileComponent } from '../delete-connection-profile/delete-connection-profile.component.ts';
import { AddCertificateComponent } from '../add-certificate/add-certificate.component.ts';
import { ViewCertificateComponent } from '../view-certificate/view-certificate.component.ts';
import { saveAs } from 'file-saver';
import { SwitchIdentityComponent } from '../switch-identity/switch-identity.component';
import { AlertService } from '../services/alert.service';

@Component({
    selector: 'connection-profile-data',
    templateUrl: './connection-profile-data.component.html',
    styleUrls: [
        './connection-profile-data.component.scss'.toString()
    ],

})
export class ConnectionProfileDataComponent {
    public v06FormErrors = {
        name: '',
        peerURL: '',
        membershipServicesURL: '',
        eventHubURL: '',
        keyValStore: '',
        deployWaitTime: '',
        invokeWaitTime: ''
    };

    public v1FormErrors = {
        name: '',
        peers: {},
        orderers: {},
        channel: '',
        mspID: '',
        ca: '',
        keyValStore: '',
        deployWaitTime: '',
        invokeWaitTime: ''
    };

    public v06ValidationMessages = {
        name: {
            required: 'A connection profile name is required.',
            pattern: 'A new connection profile cannot use the default name.'
        },
        peerURL: {
            required: 'A Peer URL is required.',
        },
        membershipServicesURL: {
            required: 'A Membership Services URL is required.',
        },
        eventHubURL: {
            required: 'An Event Hub URL is required.',
        },
        keyValStore: {
            required: 'A Key Value Store Directory Path is required.',
        },
        deployWaitTime: {
            pattern: 'The Deploy Wait Time (seconds) must be an integer.'
        },
        invokeWaitTime: {
            pattern: 'The Invoke Wait Time (seconds) must be an integer.'
        }
    };

    public v1ValidationMessages = {
        name: {
            required: 'A connection profile name is required.',
            pattern: 'A new connection profile cannot use the default name.'
        },
        peers: {
            requestURL: {
                required: 'Every Peer Request URL is required.'
            },
            eventURL: {
                required: 'Every Peer Event URL is required.'
            },
            cert: {},
            hostnameOverride: {}
        },
        orderers: {
            url: {
                required: 'Every Orderer URL is required.'
            },
            cert: {},
            hostnameOverride: {}
        },
        channel: {
            required: 'A Channel name is required.',
        },
        mspID: {
            required: 'A MSP ID is required.',
        },
        ca: {
            required: 'A Certificate Authority URL is required.',
        },
        keyValStore: {
            required: 'A Key Value Store Directory Path is required.',
        },
        deployWaitTime: {
            pattern: 'The Deploy Wait Time (seconds) must be an integer.'
        },
        invokeWaitTime: {
            pattern: 'The Invoke Wait Time (seconds) must be an integer.'
        }
    };

    @Input() set connectionProfile(connectionProfile: any) {
        this.editing = false;
        this.connectionProfileData = connectionProfile;
        if (this.connectionProfileData && this.connectionProfileData.name === 'New Connection Profile') {
            this.startEditing();
        }
    }

    @Output() profileUpdated = new EventEmitter();

    private connectionProfileData = null;
    private expandedSection = ['Basic Configuration'];

    private v06Form: FormGroup;
    private v1Form: FormGroup;

    private editing = false;

    constructor(private fb: FormBuilder,
                private connectionProfileService: ConnectionProfileService,
                private modalService: NgbModal,
                private alertService: AlertService) {
    }

    expandSection(sectionToExpand) {

        if (this.connectionProfileData.profile.type === 'hlf') {
            if (sectionToExpand === 'All') {
                if (this.expandedSection.length === 3) {
                    this.expandedSection = [];
                } else {
                    this.expandedSection = ['Basic Configuration', 'Security Settings', 'Advanced'];
                }
            } else {
                let index = this.expandedSection.indexOf(sectionToExpand);
                if (index > -1) {
                    this.expandedSection = this.expandedSection.filter((item) => {
                        return item !== sectionToExpand;
                    });
                } else {
                    this.expandedSection.push(sectionToExpand);
                }
            }
        } else if (this.connectionProfileData.profile.type === 'hlfv1') {
            if (sectionToExpand === 'All') {
                if (this.expandedSection.length === 2) {
                    this.expandedSection = [];
                } else {
                    this.expandedSection = ['Basic Configuration', 'Advanced'];
                }
            } else {
                let index = this.expandedSection.indexOf(sectionToExpand);
                if (index > -1) {
                    this.expandedSection = this.expandedSection.filter((item) => {
                        return item !== sectionToExpand;
                    });
                } else {
                    this.expandedSection.push(sectionToExpand);
                }
            }
        } else {
            throw new Error('Invalid connection profile type');
        }
    }

    useProfile() {
        let modalRef = this.modalService.open(SwitchIdentityComponent);
        modalRef.componentInstance.connectionProfileName = this.connectionProfileData.name;
        modalRef.result.then(() => {
            let connectionName;
            if (this.connectionProfileData.name === '$default') {
                connectionName = 'Web Browser';
            } else {
                connectionName = this.connectionProfileData.name;
            }
            this.alertService.successStatus$.next({title: 'Connection Successful', text : 'Successfully connected with profile ' + connectionName, icon : '#icon-world_24'});
            this.profileUpdated.emit({updated: true});

        }, (reason) => {
            console.log(reason);
            if (reason && reason !== 1) { // someone hasn't pressed escape
                this.alertService.errorStatus$.next(reason);
            }
        });
    }

    startEditing() {
        if (this.connectionProfileData.profile.type === 'hlf') {
            this.v06Form = this.fb.group({

                name: [
                    this.connectionProfileData ? this.connectionProfileData.name : '',
                    [Validators.required, Validators.pattern('^(?!New Connection Profile$).*$')]
                ],
                description: [this.connectionProfileData ? this.connectionProfileData.profile.description : ''],
                type: [this.connectionProfileData ? this.connectionProfileData.type : 'hlf'],
                peerURL: [
                    this.connectionProfileData ? this.connectionProfileData.profile.peerURL : 'grpc://localhost:7051',
                    [Validators.required]
                ],
                membershipServicesURL: [
                    this.connectionProfileData ? this.connectionProfileData.profile.membershipServicesURL : 'grpc://localhost:7054',
                    [Validators.required]
                ],
                eventHubURL: [
                    this.connectionProfileData ? this.connectionProfileData.profile.eventHubURL : 'grpc://localhost:7053',
                    [Validators.required]
                ],
                keyValStore: [
                    this.connectionProfileData ? this.connectionProfileData.profile.keyValStore : '/tmp/keyValStore',
                    [Validators.required]
                ],
                // Is required and must be a number
                deployWaitTime: [
                    this.connectionProfileData ? this.connectionProfileData.profile.deployWaitTime : 300,
                    [Validators.pattern('[0-9]+')]
                ],
                // Is required and must be a number
                invokeWaitTime: [
                    this.connectionProfileData ? this.connectionProfileData.profile.invokeWaitTime : 30,
                    [Validators.pattern('[0-9]+')]
                ],
                certificate: [this.connectionProfileData ? this.connectionProfileData.profile.certificate : ''],
                certificatePath: [this.connectionProfileData ? this.connectionProfileData.profile.certificatePath : '']
            });

            this.v06Form.valueChanges.subscribe((data) => this.onValueChanged(data));

            this.onValueChanged(); // (re)set validation messages now

        } else if (this.connectionProfileData.profile.type === 'hlfv1') {

            this.v1Form = this.fb.group({
                name: [
                    this.connectionProfileData ? this.connectionProfileData.name : '',
                    [Validators.required, Validators.pattern('^(?!New Connection Profile$).*$')]
                ],
                description: [this.connectionProfileData ? this.connectionProfileData.profile.description : ''],
                type: [this.connectionProfileData ? this.connectionProfileData.type : 'hlfv1'],
                orderers: this.fb.array(
                    this.initOrderers()
                ),
                channel: [
                    this.connectionProfileData ? this.connectionProfileData.profile.channel : 'mychannel',
                    [Validators.required]
                ],
                mspID: [
                    this.connectionProfileData ? this.connectionProfileData.profile.mspID : 'Org1MSP',
                    [Validators.required]
                ],
                ca: [
                    this.connectionProfileData ? this.connectionProfileData.profile.ca : 'http://localhost:7054',
                    [Validators.required]
                ],
                peers: this.fb.array(
                    this.initPeers()
                ),
                keyValStore: [
                    this.connectionProfileData ? this.connectionProfileData.profile.keyValStore : '/tmp/keyValStore',
                    [Validators.required]
                ],
                // Is required and must be a number
                deployWaitTime: [
                    this.connectionProfileData ? this.connectionProfileData.profile.deployWaitTime : 300,
                    [Validators.pattern('[0-9]+')]
                ],
                // Is required and must be a number
                invokeWaitTime: [
                    this.connectionProfileData ? this.connectionProfileData.profile.invokeWaitTime : 30,
                    [Validators.pattern('[0-9]+')]
                ]
            });

            this.v1Form.valueChanges.subscribe((data) => this.onValueChanged(data));

            this.onValueChanged(); // (re)set validation messages now

        } else {
            throw new Error('Unknown connection profile type');
        }

        this.editing = true;
    }

    initOrderers() {
        let someList = [];
        if (this.connectionProfileData) {
            for (let orderer in this.connectionProfileData.profile.orderers) {
                let ordererFormGroup = this.fb.group({
                    url: [this.connectionProfileData.profile.orderers[orderer].url, Validators.required],
                    cert: [this.connectionProfileData.profile.orderers[orderer].cert],
                    hostnameOverride: [this.connectionProfileData.profile.orderers[orderer].hostnameOverride],
                });
                someList.push(ordererFormGroup);
            }
            return someList;
        } else {
            someList.push(this.fb.group({
                url: ['grpc://localhost:7050', Validators.required],
                cert: [''],
                hostnameOverride: ['']
            }));
            return someList;
        }
    }

    addOrderer() {
        // add orderer to the list
        const control = <FormArray> this.v1Form.controls['orderers'];
        control.push(this.fb.group({
            url: ['grpc://localhost:7050', Validators.required],
            cert: [''],
            hostnameOverride: ['']
        }));
    }

    removeOrderer(i: number) {
        // remove orderer from the list
        const controls = <FormArray> this.v1Form.controls['orderers'];
        controls.removeAt(i);
    }

    initPeers() {
        let someList = [];
        if (this.connectionProfileData) {
            for (let peer in this.connectionProfileData.profile.peers) {
                someList.push(this.fb.group({
                    requestURL: [this.connectionProfileData.profile.peers[peer].requestURL, Validators.required],
                    eventURL: [this.connectionProfileData.profile.peers[peer].eventURL, Validators.required],
                    cert: [this.connectionProfileData.profile.peers[peer].cert],
                    hostnameOverride: [this.connectionProfileData.profile.peers[peer].hostnameOverride]
                }));
            }
            return someList;
        } else {
            someList.push(this.fb.group({
                requestURL: ['grpc://localhost:7051', Validators.required],
                eventURL: ['grpc://localhost:7053', Validators.required],
                cert: [''],
                hostnameOverride: ['']
            }));
            return someList;
        }
    }

    addPeer() {
        const control = <FormArray> this.v1Form.controls['peers'];
        control.push(this.fb.group({
            requestURL: ['grpc://localhost:7051', Validators.required],
            eventURL: ['grpc://localhost:7053', Validators.required],
            cert: [''],
            hostnameOverride: ['']
        }));
    }

    removePeer(i: number) {
        // remove peer from the list
        const control = <FormArray> this.v1Form.controls['peers'];
        control.removeAt(i);
    }

    onValueChanged(data?: any) {
        let form;
        let formErrors;
        let validationMessages;
        if (!(this.connectionProfileData.profile.type === 'hlf' || this.connectionProfileData.profile.type === 'hlfv1')) {
            throw new Error('Invalid connection profile type');
        } else {
            if (this.connectionProfileData.profile.type === 'hlf') {
                if (!this.v06Form) {
                    return;
                }
                form = this.v06Form;
                formErrors = this.v06FormErrors;
                validationMessages = this.v06ValidationMessages;
            } else {
                if (!this.v1Form) {
                    return;
                }
                form = this.v1Form;
                formErrors = this.v1FormErrors;
                validationMessages = this.v1ValidationMessages;
            }

            for (const field in formErrors) {
                // clear previous error message (if any)
                formErrors[field] = '';
                const control = form.get(field);
                if (!control.valid) {
                    const messages = validationMessages[field];
                    if (control.constructor.name === 'FormArray') {
                        formErrors[field] = {};
                        for (let attribute in control.controls[0].controls) {
                            for (const key in control.controls[0].controls[attribute].errors) {
                                formErrors[field][attribute] = messages[attribute][key];
                            }
                        }
                    } else {
                        for (const key in control.errors) {
                            formErrors[field] += messages[key] + ' ';
                        }
                    }
                }
            }
        }
    }

    onSubmit() {
        let connectionProfile;
        if (!(this.connectionProfileData.profile.type === 'hlf' || this.connectionProfileData.profile.type === 'hlfv1')) {
            throw new Error('Unknown profile type');
        } else {
            if (this.connectionProfileData.profile.type === 'hlf') {
                connectionProfile = this.v06Form.value;
            } else {
                connectionProfile = this.v1Form.value;
            }
            // Need to set this as user doesn't input profile type
            connectionProfile.type = this.connectionProfileData.profile.type;
            this.connectionProfileService.createProfile(connectionProfile.name, connectionProfile).then(() => {
                this.editing = false;

                // Need to set the profile back to its original form
                let profileToSet = {
                    name: connectionProfile.name,
                    profile: connectionProfile,
                    default: false
                };

                return this.connectionProfileService.getAllProfiles().then((connectionProfiles) => {
                    let profiles = Object.keys(connectionProfiles).sort();
                    profiles.forEach((profile) => {
                        if (profileToSet.name !== connectionProfiles[profile].name && connectionProfiles[profile].name === this.connectionProfileData.name) {
                            return this.connectionProfileService.deleteProfile(this.connectionProfileData.name);
                        }
                    });
                }).then(() => {
                    this.connectionProfileData = profileToSet;
                    this.profileUpdated.emit({updated: true, connectionProfile: this.connectionProfileData});
                });

            });
        }
    }

    stopEditing() {
        this.editing = false;

        let stopEditingPromise;
        let updated: boolean = false;

        if (this.connectionProfileData.name === 'New Connection Profile') {
            // we have cancelled when creating a new profile so we need to go back to previosuly selected profile
            stopEditingPromise = this.connectionProfileService.deleteProfile(this.connectionProfileData.name);
        } else {
            // we've cancelled updating a profile but we still want to see this profile
            updated = true;
            stopEditingPromise = Promise.resolve();
        }

        stopEditingPromise.then(() => {
            this.profileUpdated.emit({updated: updated});
        });

        return stopEditingPromise;
    }

    deleteProfile() {
        let modalRef = this.modalService.open(DeleteConnectionProfileComponent);
        modalRef.componentInstance.profileName = this.connectionProfileData.name;
        modalRef.result.then(() => {
            this.profileUpdated.emit({updated: false});
        }, (reason) => {
            if (reason && reason !== 1) { // not pressed escape
                this.alertService.errorStatus$.next(reason);
            }
        });
    }

    exportProfile() {
        let profileData = JSON.stringify(this.connectionProfileData.profile, null, 4);
        let file = new File([profileData], 'connection.json', {type: 'application/json'});
        saveAs(file);
    }

    openAddCertificateModal(index, type) {
        if (type === 'orderers') {
            this.connectionProfileService.setCertificate(this.v1Form.controls['orderers']['controls'][index]['value']['cert']);
            this.connectionProfileService.setHostname(this.v1Form.controls['orderers']['controls'][index]['value']['hostnameOverride']);
        } else if (type === 'peers') {
            this.connectionProfileService.setCertificate(this.v1Form.controls['peers']['controls'][index]['value']['cert']);
            this.connectionProfileService.setHostname(this.v1Form.controls['peers']['controls'][index]['value']['hostnameOverride']);
        }

        return this.modalService.open(AddCertificateComponent).result
        .then((result) => {
            if (type === 'orderers') {
                if (result.hostnameOverride === '') {
                    result.hostnameOverride = 'orderer' + index;
                }
                this.v1Form.controls['orderers']['controls'][index].patchValue({
                    cert: result.cert,
                    hostnameOverride: result.hostnameOverride
                });
            } else if (type === 'peers') {
                if (result.hostnameOverride === '') {
                    result.hostnameOverride = 'peer' + index;
                }
                this.v1Form.controls['peers']['controls'][index].patchValue({
                    cert: result.cert,
                    hostnameOverride: result.hostnameOverride
                });
            } else {
                throw new Error('Unrecognized type ' + type);
            }
        }, (reason) => {
            if (reason && reason !== 1) {
                this.alertService.errorStatus$.next(reason);
            }
        });
    }

    showCertificate(cert: string, hostname: string) {
        this.connectionProfileService.setCertificate(cert);
        this.connectionProfileService.setHostname(hostname);
        this.modalService.open(ViewCertificateComponent);
    }
}
