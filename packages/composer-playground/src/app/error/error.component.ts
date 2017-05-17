import { Component, Input } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss'.toString()]
})
export class ErrorComponent {
    @Input() error;

    constructor(public activeModal: NgbActiveModal) {

    }
}
