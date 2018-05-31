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
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { IdentityService } from '../services/identity.service';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';
import { AlertService } from '../basic-modals/alert.service';
import { DeleteComponent } from '../basic-modals/delete-confirm/delete-confirm.component';
import { ConnectConfirmComponent } from '../basic-modals/connect-confirm/connect-confirm.component';
import { IdentityCardService } from '../services/identity-card.service';
import { ConfigService } from '../services/config.service';
import { Config } from '../services/config/configStructure.service';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DrawerDismissReasons, DrawerService } from '../common/drawer';
import { ImportIdentityComponent } from './import-identity';

import { IdCard } from 'composer-common';

import { saveAs } from 'file-saver';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { AdminService } from '../services/admin.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: [
        './login.component.scss'.toString()
    ]
})
export class LoginComponent implements OnInit {

    private usingLocally: boolean = false;
    private connectionProfileRefs: string[];
    private connectionProfileNames: Map<string, string>;
    private connectionProfiles: Map<string, string>;
    private idCardRefs: Map<string, string[]>;
    private idCards: Map<string, IdCard>;
    private indestructibleCards: string[];
    private showDeployNetwork: boolean = false;
    private editingConnectionProfile = null;
    private creatingIdCard: boolean = false;
    private showSubScreen: boolean = false;
    private showCredentials: boolean = true;

    private config = new Config();

    constructor(private router: Router,
                private route: ActivatedRoute,
                private clientService: ClientService,
                private initializationService: InitializationService,
                private identityCardService: IdentityCardService,
                private modalService: NgbModal,
                private drawerService: DrawerService,
                private alertService: AlertService,
                private configService: ConfigService,
                private sampleBusinessNetworkService: SampleBusinessNetworkService,
                private adminService: AdminService) {

    }

    ngOnInit(): Promise<void> {
        return this.initializationService.initialize()
            .then(() => {
                this.usingLocally = !this.configService.isWebOnly();
                this.config = this.configService.getConfig();
                return this.loadIdentityCards();
            }).then(() => {
                this.router.events.subscribe((event) => {
                    console.log('ROUTER SUB', event);
                    if (event instanceof NavigationEnd) {
                        this.handleRouteChange();
                    }
                });
                this.handleRouteChange();
            });
    }

    handleRouteChange() {
        switch (this.route.snapshot.fragment) {
            case 'deploy':
                this.deployNetwork(decodeURIComponent(this.route.snapshot.queryParams['ref']));
                break;
            case 'create-card':
                this.createIdCard();
                break;
            default:
                if (this.route.snapshot.fragment || Object.keys(this.route.snapshot.queryParams).length > 0) {
                    this.goLoginMain();
                } else {
                    this.closeSubView();
                }
                break;
        }
    }

    goLoginMain(): void {
        this.router.navigate(['/login']);
    }

    goDeploy(connectionProfileRef): void {
        this.router.navigate(['/login'], {fragment: 'deploy', queryParams: {ref: connectionProfileRef}});
    }

    goCreateCard(): void {
        this.router.navigate(['/login'], {fragment: 'create-card'});
    }

    loadIdentityCards(reload: boolean = false): Promise<void> {
        return this.identityCardService.getIdentityCards(reload).then((cards) => {
            this.indestructibleCards = this.identityCardService.getIndestructibleIdentityCards();
            this.idCards = cards;
            this.connectionProfileNames = new Map<string, string>();
            this.connectionProfiles = new Map<string, string>();

            let newCardRefs = Array.from(cards.keys())
                .map((cardRef) => {
                    let card = cards.get(cardRef);
                    let connectionProfile = card.getConnectionProfile();
                    if (connectionProfile['x-type'] === 'web' && (this.indestructibleCards.indexOf(cardRef) > -1)) {
                        return;
                    }

                    let connectionProfileRef: string = this.identityCardService.getQualifiedProfileName(connectionProfile);
                    if (!this.connectionProfileNames.has(connectionProfileRef)) {
                        this.connectionProfileNames.set(connectionProfileRef, connectionProfile.name);
                        this.connectionProfiles.set(connectionProfileRef, connectionProfile);
                    }

                    return [connectionProfileRef, cardRef];
                })
                .reduce((prev, cur) => {
                    if (!cur) {
                        return prev;
                    }

                    let curCardRefs: string[] = prev.get(cur[0]) || [];
                    let cardRef: string = <string> cur[1];
                    return prev.set(cur[0], [...curCardRefs, cardRef]);
                }, new Map<string, string[]>());

            newCardRefs.forEach((cardRefs: string[], key: string) => {
                cardRefs.sort(this.sortIdCards.bind(this));
            });

            // sort connection profile names and make sure there is always
            // a web connection profile at the start, even when there are
            // no identity cards
            let unsortedConnectionProfiles = Array.from(this.connectionProfileNames.keys());
            let indexOfWebProfile = unsortedConnectionProfiles.indexOf('web-$default');
            if (indexOfWebProfile > -1) {
                unsortedConnectionProfiles.splice(indexOfWebProfile, 1);
            }
            unsortedConnectionProfiles.sort((a: string, b: string): number => {
                let aName = this.connectionProfileNames.get(a);
                let bName = this.connectionProfileNames.get(b);

                if (aName < bName) {
                    return -1;
                }
                if (aName > bName) {
                    return 1;
                }
            });
            unsortedConnectionProfiles.push('web-$default');
            this.connectionProfileRefs = unsortedConnectionProfiles;
            this.idCardRefs = newCardRefs;

        }).catch((error) => {
            this.alertService.errorStatus$.next(error);
        });
    }

    changeIdentity(cardRef: string, connectionProfileRef: string): Promise<boolean | void> {
        let card = this.idCards.get(cardRef);
        let businessNetworkName = card.getBusinessNetworkName();

        let confirmConnectPromise: Promise<void>;
        if (this.canDeploy(connectionProfileRef)) {
            confirmConnectPromise = Promise.resolve();
        } else {
            // Show a warning if the business network cannot be updated
            const confirmModalRef = this.modalService.open(ConnectConfirmComponent);
            confirmModalRef.componentInstance.network = businessNetworkName;
            confirmConnectPromise = confirmModalRef.result;
        }

        return confirmConnectPromise
            .then((result) => {
                return this.identityCardService.setCurrentIdentityCard(cardRef);
            })
            .then(() => {
                return this.clientService.ensureConnected(true);
            })
            .then(() => {
                return this.router.navigate(['editor']);
            })
            .catch((error) => {
                if (error && error !== ModalDismissReasons.BACKDROP_CLICK && error !== ModalDismissReasons.ESC) {
                    this.alertService.errorStatus$.next(error);
                }
            });
    }

    deploySample(connectionProfileRef): Promise<boolean | void> {
        let peerCardRef = this.identityCardService.getIdentityCardRefsWithProfileAndRole(connectionProfileRef, 'PeerAdmin')[0];

        this.identityCardService.setCurrentIdentityCard(peerCardRef);

        this.alertService.busyStatus$.next({
            title: 'Getting sample network',
            force: true
        });
        return this.sampleBusinessNetworkService.getSampleList()
            .then((sampleList) => {
                let chosenSample = sampleList[0];

                return this.sampleBusinessNetworkService.getChosenSample(chosenSample);

            })
            .then((businessNetworkDefinition) => {
                return this.sampleBusinessNetworkService.deployBusinessNetwork(businessNetworkDefinition, 'playgroundSample@basic-sample-network', 'my-basic-sample', 'The Composer basic sample network', null, null, null);
            })
            .then(() => {
                return this.loadIdentityCards(true);
            })
            .then(() => {
                this.alertService.busyStatus$.next({
                    title: 'Connecting to network',
                    force: true
                });
                return this.changeIdentity('playgroundSample@basic-sample-network', connectionProfileRef);
            });
    }

    editConnectionProfile(connectionProfile): void {
        this.showSubScreen = true;
        this.editingConnectionProfile = connectionProfile;
    }

    closeSubView(): void {
        this.showSubScreen = false;
        this.showDeployNetwork = false;
        this.creatingIdCard = false;
        delete this.editingConnectionProfile;
    }

    createIdCard(): void {
        if (!this.usingLocally) {
            this.goLoginMain();
            return;
        }
        this.showSubScreen = true;
        this.creatingIdCard = true;
    }

    finishedCardCreation(event) {
        if (event) {
            this.goLoginMain();
            return this.loadIdentityCards();
        } else {
            this.goLoginMain();
        }
    }

    canDeploy(connectionProfileRef): boolean {
        return this.identityCardService.canDeploy(connectionProfileRef);
    }

    deployNetwork(connectionProfileRef): void {
        if (!this.canDeploy(connectionProfileRef)) {
            this.goLoginMain();
            return;
        }

        let peerCardRef = this.identityCardService.getAdminCardRef(connectionProfileRef, IdentityCardService.peerAdminRole);

        this.identityCardService.setCurrentIdentityCard(peerCardRef);

        if (this.indestructibleCards.indexOf(peerCardRef) > -1) {
            this.showCredentials = false;
        } else {
            this.showCredentials = true;
        }

        this.showSubScreen = true;
        this.showDeployNetwork = true;
    }

    finishedDeploying(): Promise<void> {
        this.goLoginMain();
        return this.loadIdentityCards(true);
    }

    importIdentity() {
        this.drawerService.open(ImportIdentityComponent).result.then((cardRef) => {
            this.alertService.successStatus$.next({
                title: 'ID Card imported',
                text: 'The ID card ' + this.identityCardService.getIdentityCard(cardRef).getUserName() + ' was successfully imported',
                icon: '#icon-role_24'
            });
        }).then(() => {
            return this.loadIdentityCards();
        }).catch((reason) => {
            if (reason !== DrawerDismissReasons.ESC) {
                this.alertService.errorStatus$.next(reason);
            }
        });
    }

    exportIdentity(cardRef): Promise<any> {
        let fileName;

        return this.identityCardService.getIdentityCardForExport(cardRef)
            .then((card) => {
                fileName = card.getUserName() + '.card';
                return card.toArchive();
            })
            .then((archiveData) => {
                let file = new Blob([archiveData],
                    {type: 'application/octet-stream'});
                saveAs(file, fileName);
            })
            .catch((reason) => {
                this.alertService.errorStatus$.next(reason);
            });
    }

    removeIdentity(cardRef): void {
        let card = this.idCards.get(cardRef);
        let userId: string = card.getUserName();
        const confirmModalRef = this.modalService.open(DeleteComponent);
        confirmModalRef.componentInstance.headerMessage = 'Remove ID Card';
        confirmModalRef.componentInstance.fileName = userId;
        confirmModalRef.componentInstance.fileType = 'ID Card';
        confirmModalRef.componentInstance.deleteMessage = 'Are you sure you want to do this?';
        confirmModalRef.componentInstance.deleteFrom = 'My Wallet';
        confirmModalRef.componentInstance.confirmButtonText = 'Remove';

        confirmModalRef.result
            .then((result) => {
                if (result) {
                    let deletePromise: Promise<void>;
                    let cards = this.identityCardService.getAllCardsForBusinessNetwork(card.getBusinessNetworkName(), this.identityCardService.getQualifiedProfileName(card.getConnectionProfile()));
                    if (card.getConnectionProfile()['x-type'] === 'web' && cards.size === 1) {
                        deletePromise = this.adminService.connect(cardRef, card, true)
                            .then(() => {
                                this.alertService.busyStatus$.next({
                                    title: 'Undeploying business network',
                                    force: true
                                });
                                return this.adminService.undeploy(card.getBusinessNetworkName());
                            });
                    } else {
                        deletePromise = Promise.resolve();
                    }

                    return deletePromise
                        .then(() => {
                            return this.identityCardService.deleteIdentityCard(cardRef)
                                .then(() => {
                                    this.alertService.busyStatus$.next(null);
                                    this.alertService.successStatus$.next({
                                        title: 'ID Card Removed',
                                        text: 'The ID card was successfully removed from My Wallet.',
                                        icon: '#icon-bin_icon'
                                    });

                                    return this.loadIdentityCards();
                                });
                        })
                        .catch((error) => {
                            this.alertService.errorStatus$.next(error);
                        });
                }
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.errorStatus$.next(reason);
                }
            });
    }

    sortIdCards(a, b): number {
        let cardA = this.identityCardService.getIdentityCard(a);
        let cardB = this.identityCardService.getIdentityCard(b);

        let aBusinessNetwork = cardA.getBusinessNetworkName();
        let bBusinessNetwork = cardB.getBusinessNetworkName();
        let aName = cardA.getUserName();
        let bName = cardB.getUserName();
        let aRoles = cardA.getRoles();
        let bRoles = cardB.getRoles();

        // sort by business network name
        let result = this.sortBy(aBusinessNetwork, bBusinessNetwork);

        if (result !== 0) {
            return result;
        }

        // then by role
        result = this.sortBy(aRoles, bRoles);
        if (result !== 0) {
            return result;
        }

        // then by name
        result = this.sortBy(aName, bName);
    }

    private sortBy(aName, bName): number {
        if (!aName && !bName) {
            return 0;
        }

        if (!aName && bName) {
            return -1;
        }

        if (aName && !bName) {
            return 1;
        }

        if (aName < bName) {
            return -1;
        }

        if (aName > bName) {
            return 1;
        }

        // they are equal
        return 0;
    }
}
