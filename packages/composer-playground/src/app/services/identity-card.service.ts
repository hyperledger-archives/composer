import { Injectable } from '@angular/core';

import { ConnectionProfileService } from './connectionprofile.service';
import { IdentityService } from './identity.service';
import { IdentityCardStorageService } from './identity-card-storage.service';
import { WalletService } from './wallet.service';

import { IdCard, Logger } from 'composer-common';

/* tslint:disable-next-line:no-var-requires */
const uuid = require('uuid');

/* tslint:disable-next-line:no-var-requires */
const hash = require('object-hash');

const defaultCardProperties = {
    metadata: {
        name: 'admin',
        businessNetwork: 'basic-sample-network',
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

    constructor(private connectionProfileService: ConnectionProfileService,
                private identityService: IdentityService,
                private identityCardStorageService: IdentityCardStorageService,
                private walletService: WalletService) {
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

    getCurrentConnectionProfile(): any {
        let card = this.getCurrentIdentityCard();

        if (card) {
            return card.getConnectionProfile();
        }
    }

    getCurrentEnrollmentCredentials(): any {
        let card = this.getCurrentIdentityCard();

        if (card) {
            return card.getEnrollmentCredentials();
        }
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

    loadIdentityCards(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.idCards = this.identityCardStorageService
                .keys()
                .map((cardRef: string) => {
                    // Only load IdCards, referenced by fixed length uuids,
                    // not associated playground data, which has a suffix
                    if (cardRef.length === 36) {
                        let cardProperties: any = this.identityCardStorageService.get(cardRef);
                        let cardObject = new IdCard(cardProperties.metadata, cardProperties.connectionProfile, cardProperties.credentials);

                        let data: any = this.identityCardStorageService.get(this.dataRef(cardRef));
                        if (data && data.current) {
                            this.currentCard = cardRef;
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
                let card: IdCard = this.getCurrentIdentityCard();
                let enrollmentCredentials = card.getEnrollmentCredentials();

                if (enrollmentCredentials && enrollmentCredentials.id) {
                    this.identityService.setCurrentIdentity(enrollmentCredentials.id);
                }
            }

            resolve(this.idCards.size);
        });
    }

    getIdentityCards(): Promise<Map<string, IdCard>> {
        if (this.idCards.size > 0) {
            return Promise.resolve(this.idCards);
        }

        return this.loadIdentityCards().then(() => {
            return this.idCards;
        });
    }

    addInitialIdentityCards(initialCards?: IdCard[]): Promise<string | void> {
        if (this.idCards.size > 0) {
            return Promise.resolve();
        }

        initialCards = initialCards || [];

        let defaultCardRef: string;
        let defaultCardObject = new IdCard(defaultCardProperties.metadata, defaultCardProperties.connectionProfile);
        defaultCardObject.setCredentials(defaultCardProperties.credentials);
        initialCards.unshift(defaultCardObject);

        let addCardPromises: Promise<any>[] = initialCards.map((card, index) => {
            return this.addIdentityCard(card).then((cardRef: string) => {
                if (index === 0) {
                    defaultCardRef = cardRef;
                }
                return cardRef;
            });
        });

        return Promise.all(addCardPromises).then((cardRefs: string[]) => {
            return defaultCardRef;
        });
    }

    createIdentityCard(name: string, businessNetworkName: string, enrollmentId: string, enrollmentSecret: string, connectionProfile: any): Promise<string> {
        let metadata = {
            name: name,
            businessNetwork: businessNetworkName,
            enrollmentId: enrollmentId,
            enrollmentSecret: enrollmentSecret
        };

        let card: IdCard = new IdCard(metadata, connectionProfile);
        return this.addIdentityCard(card);
    }

    addIdentityCard(card: IdCard): Promise<string> {
        let cardRef: string = uuid.v4();

        this.identityCardStorageService.set(cardRef, card);
        this.identityCardStorageService.set(this.dataRef(cardRef), {unused: true});
        this.idCards.set(cardRef, card);

        return Promise.resolve(cardRef);
    }

    deleteIdentityCard(cardRef: string): Promise<void> {
        if (!this.idCards.has(cardRef)) {
            return Promise.reject(new Error('Identity card does not exist'));
        }

        let card = this.idCards.get(cardRef);
        let enrollmentId = card.getEnrollmentCredentials().id;
        let connectionProfile = card.getConnectionProfile();
        let connectionProfileName = this.getQualifiedProfileName(connectionProfile);

        let wallet = this.walletService.getWallet(connectionProfileName);

        return wallet.contains(enrollmentId)
            .then((inWallet) => {
                if (inWallet) {
                    return this.walletService.removeFromWallet(connectionProfileName, enrollmentId);
                }
            })
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
        if (!
                this.idCards.has(cardRef)
        ) {
            return Promise.reject(new Error('Identity card does not exist'));
        }
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

        // Hmmm, suspicious... is the enrollement ID really the identity?!
        let enrollmentId = card.getEnrollmentCredentials().id;

        return this.activateIdentityCard(cardRef).then(() => {
            this.identityService.setCurrentIdentity(enrollmentId);

            return card;
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

    private activateIdentityCard(cardRef): Promise<string | void> {
        let data: any = this.identityCardStorageService.get(this.dataRef(cardRef));

        if (data && data.unused) {
            delete data['unused'];
            this.identityCardStorageService.set(this.dataRef(cardRef), data);

            let card = this.idCards.get(cardRef);
            let connectionProfile = card.getConnectionProfile();
            let connectionProfileName = this.getQualifiedProfileName(connectionProfile);

            // Hmmm, suspicious... is the enrollement ID really the identity?!
            let enrollmentCredentials = card.getEnrollmentCredentials();

            // Is this enough activation? What about the identity import thing?
            return this.connectionProfileService.createProfile(connectionProfileName, connectionProfile).then(() => {
                return this.setIdentity(connectionProfileName, enrollmentCredentials.id, enrollmentCredentials.secret);
            }).then(() => {
                return cardRef;
            });
        }

        return Promise.resolve();
    }

    private dataRef(cardRef: string): string {
        return cardRef + '-pd';
    }

    private setIdentity(connectionProfileName: string, enrollmentId: string, enrollmentSecret: string): Promise<any> {
        let wallet = this.walletService.getWallet(connectionProfileName);

        return wallet.contains(enrollmentId)
            .then((contains) => {
                if (contains) {
                    return wallet.update(enrollmentId, enrollmentSecret);
                } else {
                    return wallet.add(enrollmentId, enrollmentSecret);
                }
            });
    }
}
