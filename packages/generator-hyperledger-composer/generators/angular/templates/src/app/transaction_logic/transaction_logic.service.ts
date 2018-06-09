import { Injectable } from '@angular/core';
import { DataService } from '../data.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import { Configuration } from '../configuration';
import { Http, Response, Headers } from '@angular/http';
import { HttpClient } from '@angular/common/http';


// Can be injected into a constructor
@Injectable()
export class <%= transactionName %>Service {
    actionUrl:string = "";
    headers = null

	<% if(apiNamespace == 'always'){ %>
	       NAMESPACE:string = '<%= namespace %>.<%= apiName %>';
	<% }else{ %>
	       NAMESPACE:string = '<%= apiName %>';
	<% } %>



    constructor(private _configuration: Configuration, private http:HttpClient) {
        this.actionUrl = _configuration.ServerWithApiUrl;
    };

    public submit(transaction:any): Observable<any> {

        return this.http.post(this.actionUrl + this.NAMESPACE, this.removeUnusedValue(transaction))
        .map(this.extractData)
        .catch(this.handleError);
    }

    private handleError(error: any): Observable<string> {
        // In a real world app, we might use a remote logging infrastructure
        // We'd also dig deeper into the error to get a better message
        let errMsg = (error.message) ? error.message :
          error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.error(errMsg); // log to console instead
        return Observable.throw(errMsg);
    }

    private isEmpty(obj) {
        var counter = 0;
        for (let key in obj)
            counter++;
    
    
        return (counter === 0) ? 1 : 0;
    }

    private removeUnusedValue(obj){
        if (typeof obj === "number"){
            
            return obj;
        }else if (typeof obj === "string") {
            if (obj !== "")
                return obj;
        } else {
            if (obj.length === undefined){
                console.log("it's object");

                var newDist = {}
                var canFound = false;
                for (let key in obj){
                    let res = this.removeUnusedValue(obj[key]);
                    if (res !== undefined){
                        newDist[key] = res;
                        canFound = true;
                    }
                }

                if (canFound){
                    return newDist;
                }

            } else {
                console.log("it's array");

                var newArray:Array<any> = [];
                for (let i in obj){
                    let rec = this.removeUnusedValue(obj[i]);
                    if (rec !== undefined)
                        newArray.push(rec);
                }
                return newArray;
            }
        }
    }

    private extractData(res: Response): any {
        return res.json();
    }

}
