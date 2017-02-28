import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { Configuration } from './configuration';

@Injectable()
export class DataService<Type> {
    private resolveSuffix: string = '?resolve=true';
    private actionUrl: string;
    private headers: Headers;

    constructor(private _http: Http, private _configuration: Configuration) {
        this.actionUrl = _configuration.ServerWithApiUrl;
        this.headers = new Headers();
        this.headers.append('Content-Type', 'application/json');
        this.headers.append('Accept', 'application/json');
    }

    public getAll = (ns:string): Promise<Type[]> => {
        console.log('GetAll ' + ns + ' to ' + this.actionUrl + ns);
        return this._http.get(this.actionUrl + ns)
            .toPromise()
            .then((test) => {return test.json()})
            .catch(this.handleError);
    }

    public getSingle = (ns:string, id: string): Promise<Type> => {
        console.log('GetSingle ' + ns );

        return this._http.get(this.actionUrl + ns + '/' + id + this.resolveSuffix)
            .toPromise()
            .then((test) => {return test.json()})
            .catch(this.handleError);
    }

    public add = (ns:string, asset: Type): Promise<Type> => {
        console.log('Entered DataService add')
        console.log('Add ' + ns );
        console.log('asset',asset)

        return this._http.post(this.actionUrl + ns, asset)
            .toPromise()
            .then((test) => {return test.json()})
            .catch(this.handleError);
    }

    public update = (ns: string, id: string, itemToUpdate: Type): Promise<Type> => {
        console.log('Update ' + ns );
        console.log('what is the id?',id);
        console.log('what is the updated item?',itemToUpdate);
        console.log('what is the updated item?',JSON.stringify(itemToUpdate));
        return this._http.put(this.actionUrl + ns + '/' + id, itemToUpdate)
            .toPromise()
            .then((test) => {return test.json()})
            .catch(this.handleError);
    }

    public delete = (ns: string, id: string): Promise<Response> => {
      console.log('Delete ' + ns );

        return this._http.delete(this.actionUrl +ns + '/' + id)
            .toPromise()
            .then((test) => {return test.json()})
            .catch(this.handleError);
    }

    private handleError(error: any) {
        // In a real world app, we might use a remote logging infrastructure
        // We'd also dig deeper into the error to get a better message
        let errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.error(errMsg); // log to console instead
        return Observable.throw(errMsg);
    }


}
