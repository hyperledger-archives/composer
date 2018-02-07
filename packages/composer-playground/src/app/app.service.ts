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

export type InternalStateType = {
    [key: string]: any
};

@Injectable()
export class AppState {
    _state: InternalStateType = {};

    // already return a clone of the current state
    get state() {
        return this._state = this._clone(this._state);
    }

    // never allow mutation
    set state(value) {
        throw new Error('do not mutate the `.state` directly');
    }

    get(prop?: any) {
        // use our state getter for the clone
        const state = this.state;
        return state.hasOwnProperty(prop) ? state[prop] : state;
    }

    set(prop: string, value: any) {
        // internally mutate our state
        return this._state[prop] = value;
    }

    private _clone(object: InternalStateType) {
        // simple object clone
        return JSON.parse(JSON.stringify(object));
    }
}
