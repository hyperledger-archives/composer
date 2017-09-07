import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'create-identity-card',
    templateUrl: './create-identity-card.component.html',
    styleUrls: [
        './create-identity-card.component.scss'.toString()
    ]
})

export class CreateIdentityCardComponent {

    @Input() connectionProfileRefs: any = [];
    @Input() connectionProfileNames: any = [];
    @Input() connectionProfiles: any = [];
    @Output() finishedCardCreation = new EventEmitter<boolean>();

    creatingIdCard: boolean = true;
    editingCredentials: boolean = false;
    creatingWithProfile: boolean = false;

    newConnection: boolean;
    wrappedConnectionProfile: any;

    cancelCreate() {
        this.editingCredentials = false;
        this.creatingWithProfile = false;
        this.finishedCardCreation.emit(false);
    }

    completeCardAddition(event) {
        if (event) {
            this.finishedCardCreation.emit(event);
        } else {
            this.cancelCreate();
        }
    }

    setConnectionProfile(ref: string) {
        let profile: any;
        if (ref.valueOf() === '_$v1') {
            // Wish to work with new V1
            this.newConnection = true;
            profile = {
                description: 'A description for a V1 Profile',
                type: 'hlfv1',
                orderers: [{
                            url: 'grpc://localhost:7050',
                            cert: ''
                            }],
                ca: {
                        url: 'http://localhost:7054',
                        name: ''
                    },
                peers: [{
                            requestURL: 'grpc://localhost:7051',
                            eventURL: 'grpc://localhost:7053',
                            cert: ''
                        }],
                keyValStore: '/tmp/keyValStore',
                channel: 'composerchannel',
                mspID: 'Org1MSP',
                timeout: 5 * 60,
            };
        } else {
            // Wish to work with existing
            this.newConnection = false;
            // Retrieve details
            profile = this.connectionProfiles.get(ref);
        }

        this.wrappedConnectionProfile = {
            name: this.newConnection ? 'New Connection Profile' : this.connectionProfileNames.get(ref),
            profile: profile,
            default: this.newConnection ? false : true,
        };
    }

    createWithExistingProfile(): void {
        this.creatingIdCard = false;
        this.editingCredentials = true;
    }

    createWithNewProfile(): void {
        this.creatingIdCard = false;
        this.creatingWithProfile = true;
    }

    finishedEditingConnectionProfile(result) {
        if (result.update === false) {
            this.cancelCreate();
        } else {
            this.creatingWithProfile = false;
            this.wrappedConnectionProfile = result.connectionProfile;
            this.createWithExistingProfile();
        }
    }
}
