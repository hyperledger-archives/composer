import { Component, Input } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'confirm',
    templateUrl: './delete-confirm.component.html',
    styleUrls: ['./delete-confirm.component.scss'.toString()]
})
export class DeleteComponent {
    @Input() delete;

    constructor(public activeModal: NgbActiveModal) {
    }
}
