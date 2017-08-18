import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
    FormGroup,
    FormArray,
    Validators,
    FormBuilder
} from '@angular/forms';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AddCertificateComponent } from './add-certificate/add-certificate.component.ts';
import { ViewCertificateComponent } from './view-certificate/view-certificate.component.ts';
import { saveAs } from 'file-saver';
import { AlertService } from '../basic-modals/alert.service';

@Component({
    selector: 'connection-profile',
    templateUrl: './connection-profile.component.html',
    styleUrls: [
        './connection-profile.component.scss'.toString()
    ],

})
export class ConnectionProfileComponent {

    public v1FormErrors = {
        name: '',
        peers: {},
        orderers: {},
        channel: '',
        mspID: '',
        ca: {},
        keyValStore: '',
        timeout: ''
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
            cert: {}
        },
        orderers: {
            url: {
                required: 'Every Orderer URL is required.'
            },
            cert: {}
        },
        channel: {
            required: 'A Channel name is required.',
        },
        mspID: {
            required: 'A MSP ID is required.',
        },
        ca: {
            url: {
                required: 'A Certificate Authority URL is required.'
            }
        },
        keyValStore: {
            required: 'A Key Value Store Directory Path is required.',
        },
        timeout: {
            pattern: 'The Timeout (seconds) must be an integer.'
        }
    };

    @Input() set connectionProfile(connectionProfile: any) {
        this.connectionProfileData = connectionProfile;
        if (this.connectionProfileData) {
            this.startEditing();
        }
    }

    @Output() profileUpdated = new EventEmitter<any>();

    private connectionProfileData = null;
    private expandedSection = ['Basic Configuration'];

    private v1Form: FormGroup;

    constructor(private fb: FormBuilder,
                private connectionProfileService: ConnectionProfileService,
                private modalService: NgbModal,
                private alertService: AlertService) {
    }

    expandSection(sectionToExpand) {

        if (this.connectionProfileData.profile.type === 'hlfv1') {
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

    startEditing() {
        if (this.connectionProfileData.profile.type === 'hlfv1') {

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
                    this.connectionProfileData ? this.connectionProfileData.profile.channel : 'composerchannel',
                    [Validators.required]
                ],
                mspID: [
                    this.connectionProfileData ? this.connectionProfileData.profile.mspID : 'Org1MSP',
                    [Validators.required]
                ],
                ca: this.initCa(),
                peers: this.fb.array(
                    this.initPeers()
                ),
                keyValStore: [
                    this.connectionProfileData ? this.connectionProfileData.profile.keyValStore : '/tmp/keyValStore',
                    [Validators.required]
                ],
                // Is required and must be a number
                timeout: [
                    this.connectionProfileData ? this.connectionProfileData.profile.timeout : 300,
                    [Validators.pattern('[0-9]+')]
                ]
            });

            this.v1Form.valueChanges.subscribe((data) => this.onValueChanged(data));

            this.onValueChanged(); // (re)set validation messages now

        } else {
            throw new Error('Unknown connection profile type');
        }
    }

    initCa() {
        let caFormGroup;
        if (this.connectionProfileData && this.connectionProfileData.profile && this.connectionProfileData.profile.ca) {
            caFormGroup = this.fb.group({
                url: [this.connectionProfileData.profile.ca.url, Validators.required],
                name: [this.connectionProfileData.profile.ca.name]
            });
        } else {
            caFormGroup = this.fb.group({
                url: ['http://localhost:7054', Validators.required],
                name: ['']
            });
        }
        return caFormGroup;
    }

    initOrderers() {
        let someList = [];
        if (this.connectionProfileData) {
            for (let orderer in this.connectionProfileData.profile.orderers) {
                let ordererFormGroup;
                if (this.connectionProfileData.profile.orderers[orderer].hostnameOverride) {
                    ordererFormGroup = this.fb.group({
                        url: [this.connectionProfileData.profile.orderers[orderer].url, Validators.required],
                        cert: [this.connectionProfileData.profile.orderers[orderer].cert],
                        hostnameOverride: [this.connectionProfileData.profile.orderers[orderer].hostnameOverride],
                    });
                } else {
                    ordererFormGroup = this.fb.group({
                        url: [this.connectionProfileData.profile.orderers[orderer].url, Validators.required],
                        cert: [this.connectionProfileData.profile.orderers[orderer].cert]
                    });
                }
                someList.push(ordererFormGroup);
            }
            return someList;
        } else {
            someList.push(this.fb.group({
                url: ['grpc://localhost:7050', Validators.required],
                cert: ['']
            }));
            return someList;
        }
    }

    addOrderer() {
        // add orderer to the list
        const control = <FormArray> this.v1Form.controls['orderers'];
        control.push(this.fb.group({
            url: ['grpc://localhost:7050', Validators.required],
            cert: ['']
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
                let peerFormGroup;
                if (this.connectionProfileData.profile.peers[peer].hostnameOverride) {
                    peerFormGroup = this.fb.group({
                        requestURL: [this.connectionProfileData.profile.peers[peer].requestURL, Validators.required],
                        eventURL: [this.connectionProfileData.profile.peers[peer].eventURL, Validators.required],
                        cert: [this.connectionProfileData.profile.peers[peer].cert],
                        hostnameOverride: [this.connectionProfileData.profile.peers[peer].hostnameOverride]
                    });
                } else {
                    peerFormGroup = this.fb.group({
                        requestURL: [this.connectionProfileData.profile.peers[peer].requestURL, Validators.required],
                        eventURL: [this.connectionProfileData.profile.peers[peer].eventURL, Validators.required],
                        cert: [this.connectionProfileData.profile.peers[peer].cert]
                    });
                }
                someList.push(peerFormGroup);
            }
            return someList;
        } else {
            someList.push(this.fb.group({
                requestURL: ['grpc://localhost:7051', Validators.required],
                eventURL: ['grpc://localhost:7053', Validators.required],
                cert: ['']
            }));
            return someList;
        }
    }

    addPeer() {
        const control = <FormArray> this.v1Form.controls['peers'];
        control.push(this.fb.group({
            requestURL: ['grpc://localhost:7051', Validators.required],
            eventURL: ['grpc://localhost:7053', Validators.required],
            cert: ['']
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
        if (!(this.connectionProfileData.profile.type === 'hlfv1')) {
            throw new Error('Invalid connection profile type');
        } else {
            if (this.connectionProfileData.profile.type === 'hlfv1') {
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
                    } else if (control.constructor.name === 'FormGroup') {
                        formErrors[field] = {};
                        // only used for ca currently so expects a single child to be invalid
                        for (const attribute in control.controls) {
                            for (const key in control.controls[attribute].errors) {
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

    stopEditing() {
        this.profileUpdated.emit({update: false});
    }

    onSubmit(event) {
        if (event && event.keyCode !== 13) {
            return;
        }

        let connectionProfile;
        if (!(this.connectionProfileData.profile.type === 'hlf' || this.connectionProfileData.profile.type === 'hlfv1')) {
            throw new Error('Unknown profile type');
        } else {
            connectionProfile = this.v1Form.value;

            // Need to set this as user doesn't input profile type
            connectionProfile.type = this.connectionProfileData.profile.type;
            this.connectionProfileService.createProfile(connectionProfile.name, connectionProfile).then(() => {

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

    openAddCertificateModal(index, type) {
        if (type === 'orderers') {
            this.connectionProfileService.setCertificate(this.v1Form.controls['orderers']['controls'][index]['value']['cert']);
        } else if (type === 'peers') {
            this.connectionProfileService.setCertificate(this.v1Form.controls['peers']['controls'][index]['value']['cert']);
        }

        return this.modalService.open(AddCertificateComponent).result
            .then((result) => {
                if (type === 'orderers') {
                    this.v1Form.controls['orderers']['controls'][index].patchValue({
                        cert: result.cert
                    });
                } else if (type === 'peers') {
                    this.v1Form.controls['peers']['controls'][index].patchValue({
                        cert: result.cert
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

    showCertificate(cert: string) {
        this.connectionProfileService.setCertificate(cert);
        this.modalService.open(ViewCertificateComponent);
    }
}
