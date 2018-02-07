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
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AlertService } from '../../basic-modals/alert.service';
import { IdentityCardService } from '../../services/identity-card.service';

@Component({
    selector: 'edit-card-credentials',
    templateUrl: './edit-card-credentials.component.html',
    styleUrls: ['./edit-card-credentials.component.scss'.toString()]
})

export class EditCardCredentialsComponent {

    @Input() connectionProfile: any;
    @Output() idCardAdded = new EventEmitter<any>();

    maxFileSize: number = 5242880;
    supportedFileTypes: string[] = ['.pem'];

    expandInput: boolean = false;

    private userId: string = null;
    private userSecret: string = null;
    private busNetName: string = null;
    private addInProgress: boolean = false;
    private useCerts: boolean = true;
    private addedPublicCertificate: string;
    private addedPrivateCertificate: string;

    private useParticipantCard: boolean = true;
    private peerAdmin: boolean = false;
    private channelAdmin: boolean = false;

    private cardName: string = null;
    private cardNameValid: boolean = true;

    constructor(private idCardService: IdentityCardService,
                private alertService: AlertService) {

    }

    close() {
        this.idCardAdded.emit(false);
    }

    useParticipantCardType(option: boolean) {
        this.useParticipantCard = option;
    }

    validContents(): boolean {
        if (this.useCerts) {
            if (!this.addedPublicCertificate || this.addedPublicCertificate.length === 0) {
                return false;
            } else if (!this.addedPrivateCertificate || this.addedPrivateCertificate.length === 0) {
                return false;
            } else if (!this.userId || this.userId.length === 0) {
                return false;
            } else if (this.addInProgress) {
                return false;
            }
        } else {
            if (!this.userId || this.userId.length === 0) {
                return false;
            } else if (!this.userSecret || this.userSecret.length === 0) {
                return false;
            } else if (this.addInProgress) {
                return false;
            }
        }

        if (!this.cardNameValid) {
            return false;
        }

        if (this.useParticipantCard) {
            if (!this.busNetName) {
                return false;
            }
        } else {
            if (!this.peerAdmin && !this.channelAdmin) {
                return false;
            }
        }

        return true;
    }

    submitCard(event) {
        if ((event && event.keyCode !== 13) || !this.validContents()) {
            return;
        } else {
            this.addIdentityCard();
        }
    }

    addIdentityCard() {
        this.addInProgress = true;
        this.alertService.busyStatus$.next({
            title: 'Adding ID card',
            text: 'Adding ID card'
        });

        let credentials = this.useCerts ? {
            certificate: this.addedPublicCertificate,
            privateKey: this.addedPrivateCertificate
        } : null;

        let roles = [];

        if (this.peerAdmin) {
            roles.push('PeerAdmin');
        }

        if (this.channelAdmin) {
            roles.push('ChannelAdmin');
        }

        return this.idCardService.createIdentityCard(this.userId, this.cardName, this.busNetName, this.userSecret, this.connectionProfile, credentials, roles)
            .then(() => {
                this.alertService.busyStatus$.next(null);
                this.alertService.successStatus$.next({
                    title: 'ID Card Added',
                    text: 'The ID card was successfully added to My Wallet.',
                    icon: '#icon-role_24'
                });
                this.addInProgress = false;
                this.idCardAdded.emit(true);
            })
            .catch((error) => {
                this.addInProgress = false;
                this.alertService.busyStatus$.next(null);
                if (error.message.startsWith('Card already exists: ')) {
                    this.cardNameValid = false;
                } else {
                    this.alertService.errorStatus$.next(error);
                    this.idCardAdded.emit(false);
                }
            });
    }

    updateCredentials($event) {
        // credentials not valid yet
        if (!$event || !$event.userId) {
            this.userId = null;
            this.userSecret = null;
            this.addedPrivateCertificate = null;
            this.addedPublicCertificate = null;
            return;
        }

        if ($event.secret) {
            this.useCerts = false;
            this.userSecret = $event.secret;

        } else {
            this.addedPublicCertificate = $event.cert;
            this.addedPrivateCertificate = $event.key;
        }

        this.userId = $event.userId;
    }

    private setCardName(name) {
        if (this.cardName !== name) {
            this.cardName = name;
            this.cardNameValid = true;
        }
    }
}
