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
// Angular 2
// rc2 workaround
import { enableDebugTools, disableDebugTools } from '@angular/platform-browser';
import { enableProdMode, ApplicationRef } from '@angular/core';
// Environment Providers
let PROVIDERS: any[] = [
    // common env directives
];

// Angular debug tools in the dev console
// https://github.com/angular/angular/blob/86405345b781a9dc2438c0fbe3e9409245647019/TOOLS_JS.md
// tslint:disable-next-line:only-arrow-functions
let _decorateModuleRef = function identity<T>(value: T): T {
    return value;
};

if ('production' === ENV) {
    enableProdMode();

    // Production
    _decorateModuleRef = (modRef: any) => {
        disableDebugTools();

        return modRef;
    };

    PROVIDERS = [
        ...PROVIDERS,
        // custom providers in production
    ];

} else {

    _decorateModuleRef = (modRef: any) => {
        const appRef = modRef.injector.get(ApplicationRef);
        const cmpRef = appRef.components[0];

        let _ng = (<any> window).ng;
        enableDebugTools(cmpRef);
        (<any> window).ng.probe = _ng.probe;
        (<any> window).ng.coreTokens = _ng.coreTokens;
        return modRef;
    };

    // Development
    PROVIDERS = [
        ...PROVIDERS,
        // custom providers in development
    ];

}

export const decorateModuleRef = _decorateModuleRef;

export const ENV_PROVIDERS = [
    ...PROVIDERS
];
