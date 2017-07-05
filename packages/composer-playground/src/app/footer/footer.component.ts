import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AboutService } from './../services/about.service';
import { AlertService } from './../basic-modals/alert.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: [
        './footer.component.scss'.toString()
    ]
})

export class FooterComponent implements OnInit {

    private playgroundVersion: string = '';

    constructor(private aboutService: AboutService,
                private alertService: AlertService) {
    }

    ngOnInit() {
        return this.aboutService.getVersions()
            .then((versions) => {
                this.playgroundVersion = versions.playground.version;
            })
            .catch((err) => {
                this.alertService.errorStatus$.next(err);
            });
    }
}
