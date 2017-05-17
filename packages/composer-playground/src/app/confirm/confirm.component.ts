import { Component, Input } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'confirm',
    templateUrl: './confirm.component.html',
    styleUrls: ['./confirm.component.scss'.toString()]
})
export class ConfirmComponent {
    @Input() confirm;

    constructor(public activeModal: NgbActiveModal) {
    }
}
