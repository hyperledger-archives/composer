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
import { Component, OnInit } from '@angular/core';

import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from '../basic-modals/delete-confirm/delete-confirm.component';

import { IssueIdentityComponent } from './issue-identity';
import { IdentityIssuedComponent } from './identity-issued';
import { AlertService } from '../basic-modals/alert.service';
import { ClientService } from '../services/client.service';
import { IdentityCardService } from '../services/identity-card.service';
import { IdCard, Resource } from 'composer-common';

import { saveAs } from 'file-saver';

@Component({
    selector: 'identity',
    templateUrl: './identity.component.html',
    styleUrls: [
        './identity.component.scss'.toString()
    ]
})
export class IdentityComponent implements OnInit {

    private identityCards: Map<string, IdCard>;
    private myIDs: Array<{ref, usable}>;
    private allIdentities: Object[]; // array of all IDs
    private currentIdentity: string = null;
    private participants: Map<string, Resource> = new Map<string, Resource>();
    private businessNetworkName;

    constructor(private modalService: NgbModal,
                private alertService: AlertService,
                private clientService: ClientService,
                private identityCardService: IdentityCardService) {

    }

    ngOnInit(): Promise<any> {
        return this.loadAllIdentities();
    }

    loadAllIdentities(): Promise<void> {
        return this.clientService.ensureConnected()
            .then(() => {
                return this.loadParticipants();
            })
            .then(() => {
                this.businessNetworkName = this.clientService.getBusinessNetwork().getName();
                return this.clientService.getBusinessNetworkConnection().getIdentityRegistry();
            }).then((registry) => {
                return registry.getAll();
            }).then((ids) => {
                // get the card ref for each identity
                let connectionProfile = this.identityCardService.getCurrentIdentityCard().getConnectionProfile();
                let qpn: string = this.identityCardService.getQualifiedProfileName(connectionProfile);

                ids.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });

                ids.filter((id) => {
                    id.ref = this.identityCardService.getCardRefFromIdentity(id.name, this.businessNetworkName, qpn);
                });

                ids.forEach((el, index) => {
                    if (el['participant'].getType() !== 'NetworkAdmin' && ids[index]['state'] !== 'REVOKED') {
                       if (!this.getParticipant(el['participant'].getNamespace() + '.' + el['participant'].getType() + '#' + el['participant'].getIdentifier())) {
                          ids[index]['state'] = 'BOUND PARTICIPANT NOT FOUND';
                       }
                    }
                });
                this.allIdentities = ids;
            })
            .then(() => {
                return this.loadMyIdentities();
            })
            .catch((error) => {
                this.alertService.errorStatus$.next(error);
            });
    }

    loadMyIdentities(): void {
        this.currentIdentity = this.identityCardService.currentCard;

        let businessNetwork = this.identityCardService.getCurrentIdentityCard().getBusinessNetworkName();
        let connectionProfile = this.identityCardService.getCurrentIdentityCard().getConnectionProfile();
        let qpn = this.identityCardService.getQualifiedProfileName(connectionProfile);

        this.identityCards = this.identityCardService.getAllCardsForBusinessNetwork(businessNetwork, qpn);

        let cardRefs = Array.from(this.identityCards.keys());
        this.myIDs = cardRefs.map((elm) => {
            let id = this.allIdentities.find((el) => {
                return el['ref'] === elm;
            });
            return {ref: elm, usable: id['state'] !== 'BOUND PARTICIPANT NOT FOUND' && id['state'] !== 'REVOKED'};
        }).sort((a, b) => {
            return a.ref.localeCompare(b.ref);
        });
    }

    issueNewId(): Promise<void> {
        let modalRef = this.modalService.open(IssueIdentityComponent);
        modalRef.componentInstance.participants = this.participants;

        return modalRef.result
            .then((result) => {
                if (result) {
                    let connectionProfile = this.identityCardService.getCurrentIdentityCard().getConnectionProfile();
                    if (connectionProfile['x-type'] === 'web') {
                        return this.addIdentityToWallet(result);
                    } else {
                        return this.showNewId(result);
                    }
                }
            })
            .catch((reason) => {
                if (reason && reason !== ModalDismissReasons.BACKDROP_CLICK && reason !== ModalDismissReasons.ESC) {
                    this.alertService.errorStatus$.next(reason);
                }
            })
            .then(() => {
                return this.loadAllIdentities();
            })
            .catch((reason) => {
                this.alertService.errorStatus$.next(reason);
            });
    }

    setCurrentIdentity(ID: {ref, usable}, revertOnError: boolean): Promise<void> {
        let cardRef = ID.ref;
        if (this.currentIdentity === cardRef || !ID.usable) {
            return Promise.resolve();
        }

        let startIdentity = this.currentIdentity;

        this.identityCardService.setCurrentIdentityCard(cardRef)
            .then(() => {
                this.currentIdentity = cardRef;
                this.alertService.busyStatus$.next({
                    title: 'Reconnecting...',
                    text: 'Using identity ' + this.currentIdentity
                });
                return this.clientService.ensureConnected(true);
            })
            .then(() => {
                this.alertService.busyStatus$.next(null);
                return this.loadAllIdentities();
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                this.alertService.errorStatus$.next(error);
                if (revertOnError) {
                    this.setCurrentIdentity({ref: this.currentIdentity, usable: true}, false);
                }
            });
    }

    openRemoveModal(cardRef: string): Promise<void> {

        let userID = this.identityCards.get(cardRef).getUserName();

        // show confirm/delete dialog first before taking action
        const confirmModalRef = this.modalService.open(DeleteComponent);
        confirmModalRef.componentInstance.headerMessage = 'Remove ID';
        confirmModalRef.componentInstance.fileAction = 'remove';
        confirmModalRef.componentInstance.fileType = 'ID';
        confirmModalRef.componentInstance.fileName = userID;
        confirmModalRef.componentInstance.deleteMessage = 'Take care when removing IDs: you usually cannot re-add them. Make sure you leave at least one ID that can be used to issue new IDs.';
        confirmModalRef.componentInstance.confirmButtonText = 'Remove';

        return confirmModalRef.result
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Removing ID',
                    text: 'Removing identity ' + userID + ' from your wallet'
                });
                return this.removeIdentity(cardRef);

            }, (reason) => {
                // runs this when user presses 'cancel' button on the modal
                if (reason && reason !== ModalDismissReasons.BACKDROP_CLICK && reason !== ModalDismissReasons.ESC) {
                    this.alertService.busyStatus$.next(null);
                    this.alertService.errorStatus$.next(reason);
                }
            });
    }

    revokeIdentity(identity): Promise<void> {
        // show confirm/delete dialog first before taking action
        const confirmModalRef = this.modalService.open(DeleteComponent);
        confirmModalRef.componentInstance.headerMessage = 'Revoke Identity';
        confirmModalRef.componentInstance.fileType = 'identity';
        confirmModalRef.componentInstance.fileName = identity.name;
        confirmModalRef.componentInstance.deleteMessage = 'Are you sure you want to do this?';
        confirmModalRef.componentInstance.confirmButtonText = 'Revoke';
        confirmModalRef.componentInstance.action = 'revoke';

        return confirmModalRef.result
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Revoking identity within business network',
                    text: 'Revoking identity ' + identity.name
                });

                return this.clientService.revokeIdentity(identity)
                    .then(() => {
                        // only try and remove it if its in the wallet
                        let walletIdentity = this.myIDs.find((myIdentity) => {
                            return identity.ref === myIdentity.ref;
                        });

                        if (walletIdentity) {
                            return this.removeIdentity(identity.ref);
                        }
                    })
                    .then(() => {
                        return this.loadAllIdentities();
                    })
                    .then(() => {
                        // Send alert
                        this.alertService.busyStatus$.next(null);
                        this.alertService.successStatus$.next({
                            title: 'Revoke Successful',
                            text: identity.name + ' was successfully revoked.',
                            icon: '#icon-bin_icon'
                        });
                    })
                    .catch((error) => {
                        this.alertService.busyStatus$.next(null);
                        this.alertService.errorStatus$.next(error);
                    });
            }, (reason) => {
                // runs this when user presses 'cancel' button on the modal
                if (reason && reason !== ModalDismissReasons.BACKDROP_CLICK && reason !== ModalDismissReasons.ESC) {
                    this.alertService.busyStatus$.next(null);
                    this.alertService.errorStatus$.next(reason);
                }
            });
    }

    loadParticipants() {
        return this.clientService.getBusinessNetworkConnection().getAllParticipantRegistries()
            .then((participantRegistries) => {
                return Promise.all(participantRegistries.map((registry) => {
                    return registry.getAll();
                }));
            })
            .then((participantArrays) => {
                return Promise.all(
                    participantArrays.reduce(
                        (accumulator, currentValue) => accumulator.concat(currentValue),
                        []
                    ));
            })
            .then((allParticipants) => {
                return Promise.all(allParticipants.map((registryParticipant) => {
                    return this.participants.set(registryParticipant.getFullyQualifiedIdentifier(), registryParticipant);
                }));
            })
            .catch((error) => {
                this.alertService.errorStatus$.next(error);
            });
    }

    getParticipant(fqi: string): any {
        return this.participants.get(fqi);
    }

    private removeIdentity(cardRef: string): Promise<void> {
        let userID = this.identityCards.get(cardRef).getUserName();
        return this.identityCardService.deleteIdentityCard(cardRef)
            .then(() => {
                return this.loadAllIdentities();
            })
            .then(() => {
                // Send alert
                this.alertService.busyStatus$.next(null);
                this.alertService.successStatus$.next({
                    title: 'Removal Successful',
                    text: userID + ' was successfully removed.',
                    icon: '#icon-bin_icon'
                });
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                this.alertService.errorStatus$.next(error);
            });
    }

    private showNewId(identity: { userID, userSecret }): Promise<any> {
        const modalRef = this.modalService.open(IdentityIssuedComponent);
        modalRef.componentInstance.userID = identity.userID;
        modalRef.componentInstance.userSecret = identity.userSecret;

        return modalRef.result
            .then((result) => {
                if (result.choice === 'add') {
                    this.alertService.successStatus$.next({
                        title: 'ID Card added to wallet',
                        text: 'The ID card ' + this.identityCardService.getIdentityCard(result.cardRef).getUserName() + ' was successfully added to your wallet',
                        icon: '#icon-role_24'
                    });
                } else if (result.choice === 'export') {
                    return this.exportIdentity(result.card);
                }
            });
    }

    private exportIdentity(card: IdCard): Promise<any> {
        let fileName = card.getUserName() + '.card';

        return card.toArchive()
            .then((archiveData) => {
                let file = new Blob([archiveData],
                    {type: 'application/octet-stream'});
                return saveAs(file, fileName);
            });
    }

    private addIdentityToWallet(identity: { userID, userSecret }): Promise<any> {
        let currentCard = this.identityCardService.getCurrentIdentityCard();
        let connectionProfile = currentCard.getConnectionProfile();
        let businessNetworkName = currentCard.getBusinessNetworkName();

        return this.identityCardService.createIdentityCard(identity.userID, null, businessNetworkName, identity.userSecret, connectionProfile)
            .then((cardRef: string) => {
                this.alertService.successStatus$.next({
                    title: 'ID Card added to wallet',
                    text: 'The ID card ' + this.identityCardService.getIdentityCard(cardRef).getUserName() + ' was successfully added to your wallet',
                    icon: '#icon-role_24'
                });
            });
    }
}
