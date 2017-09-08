import { Injectable } from '@angular/core';

import { AdminService } from './admin.service';
import { ConnectionProfileService } from './connectionprofile.service';
import { IdentityService } from './identity.service';
import { IdentityCardStorageService } from './identity-card-storage.service';

import { IdCard, Logger } from 'composer-common';

/* tslint:disable-next-line:no-var-requires */
const uuid = require('uuid');

/* tslint:disable-next-line:no-var-requires */
const hash = require('object-hash');

const defaultCardProperties = {
    metadata: {
        name: 'PeerAdmin',
        enrollmentId: 'admin',
        enrollmentSecret: 'adminpw',
        roles: ['PeerAdmin', 'ChannelAdmin'],
    },
    connectionProfile: {
        name: '$default',
        type: 'web'
    },
    credentials: null
};

@Injectable()
export class IdentityCardService {

    currentCard: string;

    private idCards: Map<string, IdCard> = new Map<string, IdCard>();

    private indestructibleCards: string[] = [];

    constructor(private adminService: AdminService,
                private connectionProfileService: ConnectionProfileService,
                private identityService: IdentityService,
                private identityCardStorageService: IdentityCardStorageService) {
        Logger.setFunctionalLogger({
            // tslint:disable-next-line:no-empty
            log: () => {
            }
        });
    }

    getIdentityCard(cardRef: string): IdCard {
        return this.idCards.get(cardRef);
    }

    getCurrentIdentityCard(): IdCard {
        return this.getIdentityCard(this.currentCard);
    }

    getIndestructibleIdentityCards(): string[] {
        return this.indestructibleCards;
    }

    getIdentityCardRefsWithProfileAndRole(qualifiedProfileName: string, role: string): string[] {
        let cardRefs: string[] = [];
        this.idCards.forEach((card, key) => {
            let connectionProfile = card.getConnectionProfile();
            if (qualifiedProfileName === this.getQualifiedProfileName(connectionProfile) && card.getRoles().includes(role)) {
                cardRefs.push(key);
            }
        });

        return cardRefs;
    }

    getIdentityCardForExport(cardRef: string): Promise<IdCard> {
        let card = this.idCards.get(cardRef);

        return Promise.resolve()
            .then(() => {
                let data: any = this.identityCardStorageService.get(this.dataRef(cardRef)) || {};

                if (!data.unused) {
                    let connectionProfile = card.getConnectionProfile();
                    let connectionProfileRef = this.getQualifiedProfileName(connectionProfile);
                    let enrollmentCredentials = card.getEnrollmentCredentials();

                    return this.adminService.exportIdentity(connectionProfileRef, enrollmentCredentials.id);
                }
            })
            .then((exportedCredentials) => {
                let metadata = {
                    name: card.getName(),
                    businessNetwork: card.getBusinessNetworkName(),
                    enrollmentId: card.getEnrollmentCredentials().id,
                    enrollmentSecret: card.getEnrollmentCredentials().secret
                };

                let exportCard: IdCard = new IdCard(metadata, card.getConnectionProfile());
                if (exportedCredentials) {
                    exportCard.setCredentials(exportedCredentials);
                }

                return exportCard;
            });
    }

    loadIdentityCards(webOnly: boolean): Promise<number> {
        this.currentCard = null;
        this.indestructibleCards = [];

        return new Promise((resolve, reject) => {
            this.idCards = this.identityCardStorageService
                .keys()
                .map((cardRef: string) => {
                    // Only load IdCards, referenced by fixed length uuids,
                    // not associated playground data, which has a suffix
                    if (cardRef.length === 36) {
                        let cardProperties: any = this.identityCardStorageService.get(cardRef);

                        if (webOnly && cardProperties.connectionProfile.type !== 'web') {
                            return;
                        }

                        let cardObject = new IdCard(cardProperties.metadata, cardProperties.connectionProfile);
                        cardObject.setCredentials(cardProperties.credentials);
                        let data: any = this.identityCardStorageService.get(this.dataRef(cardRef));
                        if (data) {
                            if (data.current) {
                                this.currentCard = cardRef;
                            }
                            if (data.indestructible) {
                                this.indestructibleCards.push(cardRef);
                            }
                        }
                        return [cardRef, cardObject];
                    }
                })
                .reduce((prev: Map<string, IdCard>, cur: [string, IdCard]): Map<string, IdCard> => {
                    if (cur) {
                        prev.set(cur[0], cur[1]);
                    }
                    return prev;
                }, new Map<string, IdCard>());

            if (this.currentCard) {
                this.setCurrentIdentityCard(this.currentCard);
            }

            resolve(this.idCards.size);
        });
    }

    getIdentityCards(): Promise<Map<string, IdCard>> {
        return Promise.resolve(this.idCards);
    }

    addInitialIdentityCards(initialCards?: IdCard[]): Promise<string[] | void> {
        if (this.idCards.size > 0) {
            return Promise.resolve();
        }

        initialCards = initialCards || [];

        let defaultCardObject = new IdCard(defaultCardProperties.metadata, defaultCardProperties.connectionProfile);
        defaultCardObject.setCredentials(defaultCardProperties.credentials);
        initialCards.unshift(defaultCardObject);

        let addCardPromises: Promise<any>[] = initialCards.map((card, index) => {
            return this.addIdentityCard(card, true).then((cardRef: string) => {
                return cardRef;
            });
        });

        return Promise.all(addCardPromises).then((cardRefs: string[]) => {
            return cardRefs;
        });
    }

    createIdentityCard(name: string, businessNetworkName: string, enrollmentId: string, enrollmentSecret: string, connectionProfile: any, credentials: any): Promise<string> {
        let metadata;

        if (enrollmentId !== null && enrollmentSecret !== null) {
            metadata = {
                name: name,
                businessNetwork: businessNetworkName,
                enrollmentId: enrollmentId,
                enrollmentSecret: enrollmentSecret
            };
        } else {
            metadata = {
                name: name,
                businessNetwork: businessNetworkName,
                enrollmentId: enrollmentId,
            };
        }

        let card: IdCard = new IdCard(metadata, connectionProfile);

        if (credentials) {
            card.setCredentials(credentials);
            return this.addIdentityCard(card);
        } else {
            return this.addIdentityCard(card);
        }
    }

    addIdentityCard(card: IdCard, indestructible: boolean = false): Promise<string> {
        let cardRef: string = uuid.v4();
        let data = {
            unused: true,
            indestructible: indestructible
        };

        return Promise.resolve()
            .then(() => {
                this.identityCardStorageService.set(cardRef, card);
                this.identityCardStorageService.set(this.dataRef(cardRef), data);
                this.idCards.set(cardRef, card);
                if (indestructible) {
                    this.indestructibleCards.push(cardRef);
                }

                let credentials = card.getCredentials();
                if (credentials && credentials.certificate && credentials.privateKey) {
                    return this.activateIdentityCard(cardRef);
                }
            })
            .then(() => {
                return cardRef;
            });
    }

    deleteIdentityCard(cardRef: string): Promise<void> {
        if (!this.idCards.has(cardRef)) {
            return Promise.reject(new Error('Identity card does not exist'));
        }

        let card = this.idCards.get(cardRef);
        let connectionProfile = card.getConnectionProfile();
        let connectionProfileName = this.getQualifiedProfileName(connectionProfile);

        return Promise.resolve()
            .then(() => {
                // only delete if this is the last id card using the connection profile
                if (this.getAllCardRefsForProfile(connectionProfileName).length === 1) {
                    return this.connectionProfileService.deleteProfile(connectionProfileName);
                }
            })
            .then(() => {
                this.identityCardStorageService.remove(cardRef);
                this.identityCardStorageService.remove(this.dataRef(cardRef));
                this.idCards.delete(cardRef);
            });
    }

    setCurrentIdentityCard(cardRef): Promise<IdCard> {
        if (!this.idCards.has(cardRef)) {
            return Promise.reject(new Error('Identity card does not exist'));
        }

        return this.activateIdentityCard(cardRef)
            .then(() => {
                let card: IdCard = this.idCards.get(cardRef);

                let oldData: any = this.identityCardStorageService.get(this.dataRef(this.currentCard));
                if (oldData) {
                    delete oldData['current'];
                    this.identityCardStorageService.set(this.dataRef(this.currentCard), oldData);
                }

                this.currentCard = cardRef;
                let newData: any = this.identityCardStorageService.get(this.dataRef(cardRef)) || {};
                newData.current = true;
                this.identityCardStorageService.set(this.dataRef(cardRef), newData);

                let profile = card.getConnectionProfile();
                let qpn = this.getQualifiedProfileName(profile);
                this.identityService.setCurrentIdentity(qpn, card);

                return Promise.resolve(card);
            });
    }

    getQualifiedProfileName(connectionProfile: any): string {
        let prefix = hash(connectionProfile);

        if ('web' === connectionProfile.type) {
            return 'web-' + connectionProfile.name;
        } else {
            return prefix + '-' + connectionProfile.name;
        }
    }

    getCardRefFromIdentity(identityName: string, businessNetworkName: string, qualifiedConnectionProfile: string): string {
        let wantedCardRef: string;
        this.idCards.forEach((card: IdCard, key: string) => {
            let qpn = this.getQualifiedProfileName(card.getConnectionProfile());
            if (qpn === qualifiedConnectionProfile && card.getBusinessNetworkName() === businessNetworkName && identityName === card.getName()) {
                wantedCardRef = key;
            }
        });

        return wantedCardRef;
    }

    getAllCardsForBusinessNetwork(businessNetworkName: string, qualifiedConnectionProfile: string): Map<string, IdCard> {
        let wantedCards: Map<string, IdCard> = new Map<string, IdCard>();
        this.idCards.forEach((card: IdCard, key: string) => {
            let qpn = this.getQualifiedProfileName(card.getConnectionProfile());
            if (qpn === qualifiedConnectionProfile && card.getBusinessNetworkName() === businessNetworkName) {
                wantedCards.set(key, card);
            }
        });

        return wantedCards;
    }

    getAllCardRefsForProfile(qualifiedConnectionProfile: string): string[] {
        let wantedCards: string[] = [];
        this.idCards.forEach((card, key) => {
            let qpn = this.getQualifiedProfileName(card.getConnectionProfile());
            if (qpn === qualifiedConnectionProfile) {
                wantedCards.push(key);
            }
        });

        return wantedCards;
    }

    activateIdentityCard(cardRef): Promise<string | void> {
        let data: any = this.identityCardStorageService.get(this.dataRef(cardRef));

        if (data && data.unused) {
            delete data['unused'];
            this.identityCardStorageService.set(this.dataRef(cardRef), data);

            let hasCredentials = false;
            let card = this.idCards.get(cardRef);
            let connectionProfile = card.getConnectionProfile();
            let connectionProfileRef = this.getQualifiedProfileName(connectionProfile);
            let enrollmentCredentials = card.getEnrollmentCredentials();
            let credentials = card.getCredentials();
            console.log('card --- ', card);
            if (credentials && credentials.certificate && credentials.privateKey) {
                hasCredentials = true;

                // don't want to keep credentials around after the card has been activated
                card.setCredentials({});
                this.identityCardStorageService.set(cardRef, card);
                this.idCards.set(cardRef, card);
            } else if (!enrollmentCredentials || !enrollmentCredentials.secret) {
                return Promise.reject(new Error('No credentials or enrollment secret available. An identity card must contain either a certificate and private key, or an enrollment secret'));
            }

            return this.connectionProfileService.createProfile(connectionProfileRef, connectionProfile)
                .then(() => {
                    if (hasCredentials) {
                        return this.adminService.importIdentity(connectionProfileRef, enrollmentCredentials.id, credentials.certificate, credentials.privateKey);
                    }
                })
                .then(() => {
                    return cardRef;
                });
        }

        return Promise.resolve();
    }

    private dataRef(cardRef: string): string {
        return cardRef + '-pd';
    }
}
