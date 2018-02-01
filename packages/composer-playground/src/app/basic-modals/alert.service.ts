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
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

@Injectable()
export class AlertService {

    // TODO think about not exposing this directly
    public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
    public busyStatus$: Subject<any> = new BehaviorSubject<any>(null);
    public successStatus$: Subject<any> = new BehaviorSubject<any>(null);
    public transactionEvent$: Subject<object> = new BehaviorSubject<object>(null);
}
