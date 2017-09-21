import { Component, Input, Output, EventEmitter } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AddCertificateComponent } from './add-certificate/add-certificate.component';
import { ViewCertificateComponent } from './view-certificate/view-certificate.component';
import { AlertService } from '../basic-modals/alert.service';

import * as clone from 'clone';

import { has } from 'lodash';

@Component({
    selector: 'connection-profile',
    templateUrl: './connection-profile.component.html',
    styleUrls: [
        './connection-profile.component.scss'.toString()
    ],

})
export class ConnectionProfileComponent {

    @Input()
    set connectionProfile(connectionProfile: any) {
        if (connectionProfile) {
            this.connectionProfileData = connectionProfile;
        } else {
            this.connectionProfileData = {};

            this.connectionProfileData['x-type'] = 'hlfv1';
        }
        this.startEditing();
    }

    @Output() profileUpdated = new EventEmitter<any>();

    private connectionProfileData = null;

    private basic = {
        name: null,
        description: null,
        version: '1.0.0',
        organisation: 'Org1',
        mspid: 'Org1MSP',
        channel: 'composerchannel',
        keyValStore: '/tmp/keyValStore'
    };

    private orderers = [];

    private defaultOrderer = {
        name: 'orderer.example.com',
        url: 'grpcs://localhost:7050',
        grpcOptions: {
            sslTargetNameOverride: null
        },
        tlsCACerts: {
            pem: null
        }
    };

    private ordererTimeout = '3s';

    private peers = [];
    private defaultPeer = {
        name: 'peer.example.com',
        url: 'grpcs://localhost:7051',
        eventUrl: 'grpcs://localhost:7053',
        grpcOptions: {
            sslTargetNameOverride: null
        },
        tlsCACerts: {
            pem: null
        }
    };

    private peerTimeOut = {
        endorser: '3s',
        eventHub: '3s',
        eventReg: '3s'
    };

    private ca = <any> {
        url: 'http://localhost:7054',
        caName: null,
        tlsCACerts: {
            pem: null
        }
    };

    constructor(private connectionProfileService: ConnectionProfileService,
                private modalService: NgbModal,
                private alertService: AlertService) {
    }

    startEditing() {
        if (this.connectionProfileData['x-type'] === 'hlfv1') {
            this.basic.name = has(this.connectionProfileData, 'name') ? this.connectionProfileData.name : this.basic.name;
            this.basic.description = has(this.connectionProfileData, 'description') ? this.connectionProfileData.description : this.basic.description;
            this.basic.version = has(this.connectionProfileData, 'version') ? this.connectionProfileData.version : this.basic.version;

            this.basic.organisation = has(this.connectionProfileData, 'client.organisation') ? this.connectionProfileData.client.organisation : this.basic.organisation;
            this.basic.mspid = has(this.connectionProfileData, 'organisations') ? this.connectionProfileData.organisations[Object.keys(this.connectionProfileData.organisations)[0]].mspid : this.basic.mspid;
            this.basic.channel = has(this.connectionProfileData, 'channels') ? Object.keys(this.connectionProfileData.channels)[0] : this.basic.channel;
            this.basic.keyValStore = has(this.connectionProfileData, 'client.credentialStore.path') ? this.connectionProfileData.client.credentialStore.path : this.basic.keyValStore;

            this.ordererTimeout = has(this.connectionProfileData, 'client.connection.timeout.orderer') ? this.connectionProfileData.client.connection.timeout.orderer : this.ordererTimeout;
            this.peerTimeOut = has(this.connectionProfileData, 'client.connection.timeout.peer') ? this.connectionProfileData.client.connection.timeout.peer : this.peerTimeOut;

            if (has(this.connectionProfileData, 'orderers')) {
                this.initOrderers();
            } else {
                let newOrderer = clone(this.defaultOrderer);
                this.orderers.push(newOrderer);
            }

            if (has(this.connectionProfileData, 'peers')) {
                this.initPeers();
            } else {
                let newPeer = clone(this.defaultPeer);
                this.peers.push(newPeer);
            }

            if (has(this.connectionProfileData, 'certificateAuthorities')) {
                this.initCa();
            }

        } else {
            throw new Error('Unknown connection profile type');
        }
    }

    initCa() {
        let caSortOfName = Object.keys(this.connectionProfileData.certificateAuthorities)[0];

        this.ca = this.connectionProfileData.certificateAuthorities[caSortOfName];
    }

    initOrderers() {
        let allOrderers = this.connectionProfileData.orderers;

        let allOrderersNames = Object.keys(allOrderers);

        allOrderersNames.forEach((ordererName: string) => {
            let newOrderer = allOrderers[ordererName];
            newOrderer.name = ordererName;

            if (has(allOrderers[ordererName], 'grpcOptions.ssl-target-name-override')) {
                newOrderer.grpcOptions = {sslTargetNameOverride: allOrderers[ordererName].grpcOptions['ssl-target-name-override']};
            } else {
                newOrderer.grpcOptions = {};
            }

            this.orderers.push(newOrderer);
        });
    }

    addOrderer() {
        let num = this.orderers.length;
        let newOrderer = clone(this.defaultOrderer);
        newOrderer.name = 'orderer' + num + '.example.com';
        // remove any added certs
        delete newOrderer.tlsCACerts;

        this.orderers.push(newOrderer);
    }

    removeOrderer(i: number) {
        this.orderers.splice(i, 1);
    }

    initPeers() {
        let allPeers = this.connectionProfileData.peers;
        let allPeersNames = Object.keys(allPeers);

        allPeersNames.forEach((peerName: string) => {
            let newPeer = allPeers[peerName];
            newPeer.name = peerName;

            if (has(allPeers[peerName], 'grpcOptions.ssl-target-name-override')) {
                newPeer.grpcOptions = {sslTargetNameOverride: allPeers[peerName].grpcOptions['ssl-target-name-override']};
            } else {
                newPeer.grpcOptions = {};
            }

            this.peers.push(newPeer);
        });
    }

    addPeer() {
        let num = this.peers.length;
        let newPeer = clone(this.defaultPeer);
        newPeer.name = 'peer' + num + '.example.com';
        // remove any added certs
        delete newPeer.tlsCACerts;
        this.peers.push(newPeer);
    }

    removePeer(i: number) {
        this.peers.splice(i, 1);
    }

    stopEditing() {
        this.profileUpdated.emit({update: false});
    }

    onSubmit(event) {
        if (event && event.keyCode !== 13) {
            return;
        }

        let connectionProfile = {
            name: null,
            description: null,
            version: null,
            client: null,
            orderers: Object(),
            peers: Object(),
            channels: Object(),
            certificateAuthorities: Object(),
            organisations: Object()
        };

        if (!(this.connectionProfileData['x-type'] === 'hlfv1')) {
            throw new Error('Unknown profile type');
        } else {
            connectionProfile['x-type'] = this.connectionProfileData['x-type'];
            connectionProfile.name = this.basic.name;
            connectionProfile.description = this.basic.description;
            connectionProfile.version = this.basic.version;

            connectionProfile.client = {
                organisation: this.basic.organisation,
                connection: {
                    timeout: {
                        peer: this.peerTimeOut,
                        orderer: this.ordererTimeout
                    }
                },
                credentialStore: {
                    path: this.basic.keyValStore,
                    cryptoStore: {
                        path: this.basic.keyValStore
                    },
                }
            };

            this.orderers.forEach((orderer) => {
                // no certificates so don't add the section
                if (!has(orderer, 'tlsCACerts.pem')) {
                    delete orderer.tlsCACerts;
                }

                connectionProfile.orderers[orderer.name] = orderer;

                // need to edit the grpc property names as for some reason hyphens were a good idea
                if (has(connectionProfile.orderers[orderer.name], 'grpcOptions.sslTargetNameOverride')) {
                    connectionProfile.orderers[orderer.name].grpcOptions = {
                        'ssl-target-name-override': connectionProfile.orderers[orderer.name].grpcOptions.sslTargetNameOverride
                    };

                    delete connectionProfile.orderers[orderer.name].grpcOptions.sslTargetNameOverride;
                }

                // remove the name property as it isn't need in this section of the connection profile
                delete connectionProfile.orderers[orderer.name].name;
            });

            this.peers.forEach((peer) => {
                // no certificates so don't add the section
                if (!has(peer, 'tlsCACerts.pem')) {
                    delete peer.tlsCACerts;
                }

                connectionProfile.peers[peer.name] = peer;

                // need to edit the grpc property names as for some reason hyphens were a good idea
                if (has(connectionProfile.peers[peer.name], 'grpcOptions.sslTargetNameOverride')) {
                    connectionProfile.peers[peer.name].grpcOptions = {
                        'ssl-target-name-override': connectionProfile.peers[peer.name].grpcOptions.sslTargetNameOverride
                    };

                    delete connectionProfile.peers[peer.name].grpcOptions.sslTargetNameOverride;
                }

                // remove the name property as it isn't need in this section of the connection profile
                delete connectionProfile.peers[peer.name].name;

            });

            connectionProfile.channels[this.basic.channel] = {};
            connectionProfile.channels[this.basic.channel].orderers = Object.keys(connectionProfile.orderers);

            connectionProfile.channels[this.basic.channel].peers = {};

            Object.keys(connectionProfile.peers).forEach((peerName) => {
                connectionProfile.channels[this.basic.channel].peers[peerName] = {};
            });

            let caName = this.ca.caName ? this.ca.caName : 'ca-org1';

            // no certificates so don't add the section
            if (!has(this.ca, 'tlsCACerts.pem')) {
                delete this.ca.tlsCACerts;
            }

            connectionProfile.certificateAuthorities[caName] = this.ca;

            connectionProfile.organisations[this.basic.organisation] = {
                mspid: this.basic.mspid,
                peers: Object.keys(connectionProfile.peers),
                certificateAuthorities: Object.keys(connectionProfile.certificateAuthorities)
            };

            this.connectionProfileService.createProfile(connectionProfile.name, connectionProfile).then(() => {
                return this.connectionProfileService.getAllProfiles().then((connectionProfiles) => {
                    let profiles = Object.keys(connectionProfiles).sort();
                    profiles.forEach((profile) => {
                        if (connectionProfile.name !== connectionProfiles[profile].name && connectionProfiles[profile].name === this.connectionProfileData.name) {
                            return this.connectionProfileService.deleteProfile(this.connectionProfileData.name);
                        }
                    });
                }).then(() => {
                    this.connectionProfileData = connectionProfile;
                    this.profileUpdated.emit({updated: true, connectionProfile: this.connectionProfileData});
                });
            });
        }
    }

    openAddCertificateModal(index, type) {
        let cert;
        if (type === 'orderers') {
            cert = this.orderers[index].tlsCACerts.pem;
        } else if (type === 'peers') {
            cert = this.peers[index].tlsCACerts.pem;
        } else if (type === 'ca') {
            cert = this.ca.tlsCACerts.pem;
        }

        let modelRef = this.modalService.open(AddCertificateComponent);
        modelRef.componentInstance.cert = cert;

        return modelRef.result
            .then((result) => {
                if (type === 'orderers') {
                    this.orderers[index].tlsCACerts.pem = result;
                } else if (type === 'peers') {
                    this.peers[index].tlsCACerts.pem = result;
                } else if (type === 'ca') {
                    this.ca.tlsCACerts.pem = result;
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
