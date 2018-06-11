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
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Configuration } from './configuration';

@Injectable()
export class DataService<Type> {
	private resolveSuffix: string = '?resolve=true';
	private actionUrl: string;
	private headers: Headers;

	constructor(private http: HttpClient, private _configuration: Configuration) {
		this.actionUrl = _configuration.ServerWithApiUrl;
	}

	public getAll(ns: string): Observable<Type[]> {
		return this.http.get(`${this.actionUrl}${ns}`)
			.catch(this.handleError);
	}

	public getSingle(ns: string, id: string): Observable<Type> {
		return this.http.get(this.actionUrl + ns + '/' + id + this.resolveSuffix)
			.catch(this.handleError);
	}

	public add(ns: string, asset: Type): Observable<Type> {
		return this.http.post(this.actionUrl + ns, asset)
			.catch(this.handleError);
	}

	public update(ns: string, id: string, itemToUpdate: Type): Observable<Type> {
		return this.http.put(`${this.actionUrl}${ns}/${id}`, itemToUpdate)
			.catch(this.handleError);
	}

	public delete(ns: string, id: string): Observable<Type> {
		return this.http.delete(this.actionUrl + ns + '/' + id)
			.catch(this.handleError);
	}

	private handleError(error: any): Observable<string> {
		return Observable.throw(error);
	}

	private extractData(res: Response): any {
		return res.json();
	}

}