import {Component, Input, Output, EventEmitter} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {ConnectionProfileService} from '../services/connectionprofile.service';

@Component({
  selector: 'delete-connection-profile',
  templateUrl: './delete-connection-profile.component.html',
  styleUrls: ['./delete-connection-profile.component.scss'.toString()]
})
export class DeleteConnectionProfileComponent {

  constructor(public activeModal: NgbActiveModal,
              private connectionProfileService: ConnectionProfileService) {
  }

  deleteProfile(name: string) {
    this.connectionProfileService.deleteProfile(this.connectionProfileService.getCurrentlySelectedProfileName());
    this.activeModal.close(true);
  }
}
