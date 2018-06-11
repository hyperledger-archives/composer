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
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ConfigService } from '../../services/config.service';
import { Config } from '../../services/config/configStructure.service';

@Component({
    selector: 'connect-confirm',
    templateUrl: './connect-confirm.component.html',
    styleUrls: ['./connect-confirm.component.scss'.toString()]
})

export class ConnectConfirmComponent implements OnInit {

    @Input() network: string = null;

    private config = new Config();

    constructor(public activeModal: NgbActiveModal,
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
    }
}
