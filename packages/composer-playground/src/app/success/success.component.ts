import { Component, Input } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'success',
    templateUrl: './success.component.html',
    styleUrls: ['./success.component.scss'.toString()]
})
export class SuccessComponent {
    @Input() success;

    constructor(public activeModal: NgbActiveModal) {
    }
}
