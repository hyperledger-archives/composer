import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ConfigService } from './../services/config.service';
import { Config } from './../services/config/configStructure.service';

@Component({
    selector: 'welcome-modal',
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.scss'.toString()]
})
export class WelcomeComponent implements OnInit {

    private config = new Config();

    constructor(public activeModal: NgbActiveModal, private configService: ConfigService) {

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
    }
}
