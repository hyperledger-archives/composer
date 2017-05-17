// For vendors for example jQuery, Lodash, angular2-jwt just import them here unless you plan on
// chunking vendors files for async loading. You would need to import the async loaded vendors
// at the entry point of the async loaded file. Also see custom-typings.d.ts as you also need to
// run `typings install x` where `x` is your module

// TODO(gdi2290): switch to DLLs

// Angular 2
import '@angular/platform-browser';
import '@angular/platform-browser-dynamic';
import '@angular/core';
import '@angular/common';
import '@angular/forms';
import '@angular/http';
import '@angular/router';

// AngularClass
import '@angularclass/hmr';

// RxJS
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import 'jquery';
// Bootstrap v4 currently requires window.Tether to exist.
import * as Tether from 'tether';
(<any> window).Tether = Tether;
import 'bootstrap';

import * as BrowserFS from 'browserfs';

// Installs globals onto window:
// * Buffer
// * require (monkey-patches if already defined)
// * process
// You can pass in an arbitrary object if you do not wish to pollute
// the global namespace.
BrowserFS.install(window);
// Constructs an instance of the LocalStorage-backed file system.
const lsfs = new BrowserFS.FileSystem.LocalStorage();
// Initialize it as the root file system.
BrowserFS.initialize(lsfs);

if ('production' === ENV) {
    // Production

} else {
    // Development

}
