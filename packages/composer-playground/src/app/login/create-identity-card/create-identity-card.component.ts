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
