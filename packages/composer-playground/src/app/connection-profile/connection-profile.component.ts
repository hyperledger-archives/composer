/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AddCertificateComponent } from './add-certificate/add-certificate.component.ts';
import { ViewCertificateComponent } from './view-certificate/view-certificate.component.ts';
import { saveAs } from 'file-saver';
import { AlertService } from '../basic-modals/alert.service';

import * as clone from 'clone';

import { has, pickBy } from 'lodash';

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

   @ViewChild('connectionProfileForm') connectionProfileForm;

   @Output() profileUpdated = new EventEmitter<any>();

   private connectionProfileData = null;

   private basic = {
       name: null,
       description: null,
       version: '1.0.0',
       organization: 'Org1',
       mspid: 'Org1MSP',
       channel: 'composerchannel',
       commitTimeout: null
   };

   private orderers = [];

   private defaultOrderer = {
       name: 'orderer.example.com',
       url: 'grpc://localhost:7050',
       grpcOptions: {
           sslTargetNameOverride: null,
           grpcMaxSendMessageLength: null,
           grpcHttp2KeepAliveTime: null
       }
   };

   private ordererTimeout = '30';

   private peers = [];
   private defaultPeer = {
       name: 'peer.example.com',
       url: 'grpc://localhost:7051',
       eventUrl: 'grpc://localhost:7053',
       grpcOptions: {
           sslTargetNameOverride: null,
           grpcMaxSendMessageLength: null,
           grpcHttp2KeepAliveTime: null
       },
       organization: true,
       endorsingPeer: true,
       chaincodeQuery: true,
       ledgerQuery: true,
       eventSource: true
   };

   private peerTimeOut = {
       endorser: '30',
       eventHub: '30',
       eventReg: '30'
   };

   private ca = <any> {
       url: 'http://localhost:7054',
       caName: null,
       httpOptions: {
         verify: false
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

            this.basic.organization = has(this.connectionProfileData, 'client.organization') ? this.connectionProfileData.client.organization : this.basic.organization;
            this.basic.mspid = has(this.connectionProfileData, 'organizations') ? this.connectionProfileData.organizations[Object.keys(this.connectionProfileData.organizations)[0]].mspid : this.basic.mspid;
            this.basic.channel = has(this.connectionProfileData, 'channels') ? Object.keys(this.connectionProfileData.channels)[0] : this.basic.channel;
            this.basic.commitTimeout = has(this.connectionProfileData, 'x-commitTimeout') ? this.connectionProfileData['x-commitTimeout'] : this.basic.commitTimeout;

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

        if (!has(this.ca, 'httpOptions.verify')) {
          this.ca.httpOptions = {
            verify: false
          };
        }

        if (has(this.ca, 'tlsCACerts') && !this.ca.httpOptions.verify) {
            delete this.ca.tlsCACerts;
        }
    }

    initOrderers() {
        let allOrderers = this.connectionProfileData.orderers;

        let allOrderersNames = Object.keys(allOrderers);

        allOrderersNames.forEach((ordererName: string) => {
            let newOrderer = clone(allOrderers[ordererName]);
            newOrderer.name = ordererName;
            newOrderer.grpcOptions = {
                sslTargetNameOverride: null,
                grpcMaxSendMessageLength: null,
                grpcHttp2KeepAliveTime: null
            };

            if (has(allOrderers[ordererName], 'grpcOptions')) {
              if (has(allOrderers[ordererName].grpcOptions, 'ssl-target-name-override')) {
                 newOrderer.grpcOptions['sslTargetNameOverride'] = allOrderers[ordererName].grpcOptions['ssl-target-name-override'];
              } else {
                 delete newOrderer.grpcOptions.sslTargetNameOverride;
              }

              if (has(allOrderers[ordererName].grpcOptions, 'grpc-max-send-message-length')) {
                 newOrderer.grpcOptions['grpcMaxSendMessageLength'] = allOrderers[ordererName].grpcOptions['grpc-max-send-message-length'];
              } else {
                 delete newOrderer.grpcOptions.grpcMaxSendMessageLength;
              }

              if (has(allOrderers[ordererName].grpcOptions, 'grpc\.http2\.keepalive_time')) {
                 newOrderer.grpcOptions['grpcHttp2KeepAliveTime'] = allOrderers[ordererName].grpcOptions['grpc.http2.keepalive_time'];
              } else {
                 delete newOrderer.grpcOptions.grpcHttp2KeepAliveTime;
              }
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
            let newPeer = clone(allPeers[peerName]);
            newPeer.name = peerName;
            newPeer.grpcOptions = {
                sslTargetNameOverride: null,
                grpcMaxSendMessageLength: null,
                grpcHttp2KeepAliveTime: null
            };
            if (has(allPeers[peerName], 'grpcOptions')) {
              if (has(allPeers[peerName].grpcOptions, 'ssl-target-name-override')) {
                  newPeer.grpcOptions['sslTargetNameOverride'] = allPeers[peerName].grpcOptions['ssl-target-name-override'];
              } else {
                  delete newPeer.grpcOptions.sslTargetNameOverride;
              }

              if (has(allPeers[peerName].grpcOptions, 'grpc-max-send-message-length')) {
                  newPeer.grpcOptions['grpcMaxSendMessageLength'] = allPeers[peerName].grpcOptions['grpc-max-send-message-length'];
              } else {
                  delete newPeer.grpcOptions.grpcMaxSendMessageLength;
              }

              if (has(allPeers[peerName].grpcOptions, 'grpc\.http2\.keepalive_time')) {
                 newPeer.grpcOptions['grpcHttp2KeepAliveTime'] = allPeers[peerName].grpcOptions['grpc.http2.keepalive_time'];
              } else {
                  delete newPeer.grpcOptions.grpcHttp2KeepAliveTime;
              }
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

    handleKeyPress(event) {
        if (event && event.keyCode === 13) {
            event.preventDefault();
            let el = this.getActiveElement();
            if (el.tagName.toLowerCase() === 'button') {
                (<HTMLButtonElement> el).click();
            } else if (el.tagName.toLowerCase() === 'input' && (<HTMLInputElement> el).type.toLowerCase() === 'checkbox') {
                (<HTMLInputElement> el).click();
            } else if (!this.formValid(this.connectionProfileForm.form)) {
                let controls = this.connectionProfileForm.form.controls;
                for (let key in controls) {
                    controls[key].markAsDirty();
                }
                return;
            } else {
                this.onSubmit();
            }
        }
    }

    onSubmit() {

        let connectionProfile = {
            name: null,
            description: null,
            version: null,
            client: null,
            orderers: Object(),
            peers: Object(),
            channels: Object(),
            certificateAuthorities: Object(),
            organizations: Object()
        };

        if (!(this.connectionProfileData['x-type'] === 'hlfv1')) {
            throw new Error('Unknown profile type');
        } else {
            connectionProfile['x-type'] = this.connectionProfileData['x-type'];
            connectionProfile['x-commitTimeout'] = this.basic.commitTimeout ? this.basic.commitTimeout : 100;
            connectionProfile.name = this.basic.name;
            connectionProfile.description = this.basic.description;
            if (!connectionProfile.description) {
              delete connectionProfile.description;
            }
            connectionProfile.version = this.basic.version;

            connectionProfile.client = {
                organization: this.basic.organization,
                connection: {
                    timeout: {
                        peer: this.peerTimeOut,
                        orderer: this.ordererTimeout
                    }
                }
            };

            this.orderers.forEach((orderer) => {
                // no certificates so don't add the section
                if (!has(orderer, 'tlsCACerts.pem')) {
                    delete orderer.tlsCACerts;
                }

                connectionProfile.orderers[orderer.name] = orderer;

                // need to edit the grpc property names as for some reason hyphens were a good idea
                if (has(connectionProfile.orderers[orderer.name], 'grpcOptions.sslTargetNameOverride') && connectionProfile.orderers[orderer.name].grpcOptions.sslTargetNameOverride) {
                    connectionProfile.orderers[orderer.name].grpcOptions['ssl-target-name-override'] = connectionProfile.orderers[orderer.name].grpcOptions.sslTargetNameOverride;
                }

                delete connectionProfile.orderers[orderer.name].grpcOptions.sslTargetNameOverride;

                if (has(connectionProfile.orderers[orderer.name], 'grpcOptions.grpcMaxSendMessageLength') && connectionProfile.orderers[orderer.name].grpcOptions.grpcMaxSendMessageLength) {
                    connectionProfile.orderers[orderer.name].grpcOptions['grpc-max-send-message-length'] = parseFloat(connectionProfile.orderers[orderer.name].grpcOptions.grpcMaxSendMessageLength);
                }

                delete connectionProfile.orderers[orderer.name].grpcOptions.grpcMaxSendMessageLength;

                if (has(connectionProfile.orderers[orderer.name], 'grpcOptions.grpcHttp2KeepAliveTime') && connectionProfile.orderers[orderer.name].grpcOptions.grpcHttp2KeepAliveTime) {
                    connectionProfile.orderers[orderer.name].grpcOptions['grpc.http2.keepalive_time'] = parseFloat(connectionProfile.orderers[orderer.name].grpcOptions.grpcHttp2KeepAliveTime);
                }

                delete connectionProfile.orderers[orderer.name].grpcOptions.grpcHttp2KeepAliveTime;

                // remove the name property as it isn't need in this section of the connection profile
                delete connectionProfile.orderers[orderer.name].name;
            });

            this.peers.forEach((peer) => {
                // no certificates so don't add the section
                if (!has(peer, 'tlsCACerts.pem')) {
                    delete peer.tlsCACerts;
                }

                connectionProfile.peers[peer.name] = {};

                // need to copy by value not reference
                for (let key in peer) {
                  connectionProfile.peers[peer.name][key] = peer[key];
                }

                // need to edit the grpc property names as for some reason hyphens were a good idea
                if (has(connectionProfile.peers[peer.name], 'grpcOptions.sslTargetNameOverride') && connectionProfile.peers[peer.name].grpcOptions.sslTargetNameOverride) {
                    connectionProfile.peers[peer.name].grpcOptions['ssl-target-name-override'] = connectionProfile.peers[peer.name].grpcOptions.sslTargetNameOverride;
                }

                delete connectionProfile.peers[peer.name].grpcOptions.sslTargetNameOverride;

                if (has(connectionProfile.peers[peer.name], 'grpcOptions.grpcMaxSendMessageLength') && connectionProfile.peers[peer.name].grpcOptions.grpcMaxSendMessageLength) {
                    connectionProfile.peers[peer.name].grpcOptions['grpc-max-send-message-length'] = parseFloat(connectionProfile.peers[peer.name].grpcOptions.grpcMaxSendMessageLength);
                }

                delete connectionProfile.peers[peer.name].grpcOptions.grpcMaxSendMessageLength;

                if (has(connectionProfile.peers[peer.name], 'grpcOptions.grpcHttp2KeepAliveTime') && connectionProfile.peers[peer.name].grpcOptions.grpcHttp2KeepAliveTime) {
                    connectionProfile.peers[peer.name].grpcOptions['grpc.http2.keepalive_time'] = parseFloat(connectionProfile.peers[peer.name].grpcOptions.grpcHttp2KeepAliveTime);
                }

                delete connectionProfile.peers[peer.name].grpcOptions.grpcHttp2KeepAliveTime;

                delete connectionProfile.peers[peer.name].organization;

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

            if (!this.ca.httpOptions.verify) {
              // no verify so don't need to add tlsCACerts
              delete this.ca.tlsCACerts;
              delete this.ca.httpOptions;
            } else if (!has(this.ca, 'tlsCACerts.pem')) {
                // no certs so delete field
                delete this.ca.tlsCACerts;
            }

            connectionProfile.certificateAuthorities[caName] = this.ca;

            connectionProfile.organizations[this.basic.organization] = {
                mspid: this.basic.mspid,
                peers: this.peers.filter((peer) => peer.organization).map((peer) => peer.name),
                certificateAuthorities: Object.keys(connectionProfile.certificateAuthorities)
            };

            this.connectionProfileData = connectionProfile;
            this.profileUpdated.emit({updated: true, connectionProfile: connectionProfile});
        }
    }

    openAddCertificateModal(index, type) {
        let cert;
        let sslTargetNameOverride;
        let object;
        let priorState;

        if (type === 'orderers' || type === 'peers') {
            object = this[type][index];

            if (typeof object === 'undefined') {
              let formattedType = (type === 'orderers') ? 'Orderer' : 'Peer';
              throw new Error(formattedType + ' at index ' + index + ' does not exist.');
            }

            priorState = clone(this[type][index]);

            if (!has(object, 'grpcOptions')) {
                object.grpcOptions = {
                  sslTargetNameOverride: null
                };
            } else if (!has(object.grpcOptions, 'sslTargetNameOverride')) {
                object.grpcOptions.sslTargetNameOverride = null;
            }
            sslTargetNameOverride = object.grpcOptions.sslTargetNameOverride;

        } else if (type === 'ca') {
            object = this[type];

            if (typeof object === 'undefined') {
              throw new Error('CA does not exist.');
            }

            priorState = clone(this[type]);
        } else {
            throw new Error('Unrecognized type ' + type);
        }

        if (!has(object, 'tlsCACerts')) {
          object['tlsCACerts'] = {};
          object.tlsCACerts['pem'] = null;
        } else if (!has(object.tlsCACerts, 'pem')) {
          object.tlsCACerts['pem'] = null;
        }

        cert = object.tlsCACerts.pem;

        let modelRef = this.modalService.open(AddCertificateComponent);
        modelRef.componentInstance.type = type;
        modelRef.componentInstance.cert = cert;
        modelRef.componentInstance.sslTargetNameOverride = sslTargetNameOverride;

        return modelRef.result
            .then((result) => {
                if (result) {
                  object.tlsCACerts.pem = result.cert;
                  if (type !== 'ca') {
                    object.grpcOptions.sslTargetNameOverride = result.sslTargetNameOverride;
                  }
                } else {
                  delete object.tlsCACerts;
                  if (type !== 'ca') {
                    delete object.grpcOptions.sslTargetNameOverride;
                  }
                }
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.errorStatus$.next(reason);
                } else if (!reason) {
                  // Cancel pressed
                  if (type === 'orderers' || type === 'peers') {
                      this[type][index] = clone(priorState);
                  } else if (type === 'ca') {
                      this[type] = clone(priorState);
                  }
                }
            });
    }

    showCertificate(cert: string) {
        this.connectionProfileService.setCertificate(cert);
        this.modalService.open(ViewCertificateComponent);
    }

    isNumber(value) {
      if (typeof value === 'undefined') {
        return false;
      }
      if (value === null || value === '') {
        return true;
      }
      value = value.toString();
      let matches = value.match(/^(\d+|\d+\.\d+)$/);
      return matches ? true : false; // USING REGEX AS ISNAN ALLOWS NUMBERS WITH LETTERS IN LIKE 1e1000
    }

    formValid(form) {
      let errors = document.getElementsByClassName('error-message');
      if (errors.length > 0) {
          return false;
      }
      return form.valid;
    }

    setVerify() {
        if (this.ca.url.substring(this.ca.url.indexOf('://') - 1, this.ca.url.indexOf('://')) !== 's') {
            this.ca.httpOptions.verify = false;
            delete this.ca.tlsCACerts;
        }
    }

    clearCaTls() {
        delete this.ca.tlsCACerts;
    }

    // function needed for testing
    getActiveElement() {
        return document.activeElement;
    }
}
