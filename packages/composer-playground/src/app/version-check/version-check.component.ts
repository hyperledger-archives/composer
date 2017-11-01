import { Component, NgZone } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageService } from 'angular-2-local-storage';

@Component({
    selector: 'version-check-modal',
    templateUrl: './version-check.component.html',
    styleUrls: ['./version-check.component.scss'.toString()]
})
export class VersionCheckComponent {

    constructor(public activeModal: NgbActiveModal,
                private zone: NgZone,
                private localStorageService: LocalStorageService) {
    }

    public clearLocalStorage() {
        if (this.localStorageService.clearAll()) {
            this.zone.runOutsideAngular(() => {
                location.reload();
            });
        } else {
            throw new Error('Failed to clear local storage');
        }
    }

}
