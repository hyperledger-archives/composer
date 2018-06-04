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