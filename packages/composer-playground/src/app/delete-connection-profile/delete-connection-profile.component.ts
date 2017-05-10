import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ConnectionProfileService } from '../services/connectionprofile.service';

@Component({
    selector: 'delete-connection-profile',
    templateUrl: './delete-connection-profile.component.html',
    styleUrls: ['./delete-connection-profile.component.scss'.toString()]
})
export class DeleteConnectionProfileComponent {

    @Input()
    profileName;

    constructor(public activeModal: NgbActiveModal,
                private connectionProfileService: ConnectionProfileService) {
    }

    deleteProfile() {
        this.connectionProfileService.deleteProfile(this.profileName);
        this.activeModal.close(true);
    }
}
