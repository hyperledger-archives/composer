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
    profileChosen: boolean = false;

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
            this.profileChosen = true;
        } else {
            // Wish to work with existing
            this.newConnection = false;
            // Retrieve details
            this.wrappedConnectionProfile = this.connectionProfiles.get(ref);
            this.profileChosen = true;
        }
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
