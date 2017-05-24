import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'confirm',
    templateUrl: './replace-confirm.component.html',
    styleUrls: ['./replace-confirm.component.scss'.toString()]
})

export class ReplaceComponent implements OnInit {

    public headerMessage: string = null;
    public mainMessage: string = null;
    public supplementaryMessage: string = null;

    constructor(public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        this.headerMessage = 'Current definition will be replaced';
        this.mainMessage = 'Your Business Network Definition currently in the Playground will be removed & replaced.';
        this.supplementaryMessage = 'Please ensure that you have exported any current model files in the Playground.';
    }
}
