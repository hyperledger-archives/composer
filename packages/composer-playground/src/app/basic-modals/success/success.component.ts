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
import { Component, OnInit, trigger, style, transition, animate } from '@angular/core';
import 'rxjs/add/operator/debounceTime';
import { AlertService } from '../alert.service';

@Component({
    selector: 'success',
    templateUrl: './success.component.html',
    styleUrls: ['./success.component.scss'.toString()],
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({opacity: 0}),
                animate('1s ease-in', style({opacity: 1}))
            ]),
            transition(':leave', [
                style({opacity: 1}),
                animate('1s ease-out', style({opacity: 0}))
            ])
        ])
    ]
})
export class SuccessComponent implements OnInit {

    messages: Array<any> = [];
    events = [];

    constructor(private alertService: AlertService) {
    }

    ngOnInit(): void {
        this.alertService.successStatus$.subscribe((message) => {
            if (message) {
                this.messages.push(message);
                // remove old alerts
                if (this.messages.length > 3) {
                    this.messages.shift();
                }
            }
        });

        this.alertService.successStatus$.debounceTime(4000).subscribe((message) => {
            if (message && !message.keep) {
                let index = this.messages.findIndex((otherMessage) => {
                    return otherMessage.title === message.title && otherMessage.text === message.text && otherMessage.icon === message.icon;
                });

                if (index > -1) {
                    this.messages.splice(index, 1);
                }
            }
        });
    }

    onLink(callback) {
        if (callback) {
            callback();
        }
    }

    close(index) {
        this.messages.splice(index, 1);
    }
}
