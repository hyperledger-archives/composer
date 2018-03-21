/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, OnInit } from '@angular/core';
import { AboutService } from '../services/about.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConfigService } from '../services/config.service';
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
