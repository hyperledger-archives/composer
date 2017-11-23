import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AboutService } from './../services/about.service';
import { AlertService } from './../basic-modals/alert.service';
import { ConfigService } from './../services/config.service';
import { Config } from './../services/config/configStructure.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: [
        './footer.component.scss'.toString()
    ]
})

export class FooterComponent implements OnInit {

    private config: Config = new Config();
    private playgroundVersion: string = '';

    constructor(private aboutService: AboutService,
                private alertService: AlertService,
                private configService: ConfigService) {
    }

    ngOnInit() {
        try {
          this.config = this.configService.getConfig();
        } catch (err) {
          this.configService.loadConfig()
          .then((config) => {
              this.config = config;
          });
        }
        return this.aboutService.getVersions()
            .then((versions) => {
                this.playgroundVersion = versions.playground.version;
            })
            .catch((err) => {
                this.alertService.errorStatus$.next(err);
            });
    }
}
