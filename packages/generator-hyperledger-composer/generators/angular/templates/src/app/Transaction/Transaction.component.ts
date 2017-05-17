import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Headers, Http, RequestOptions } from '@angular/http';

@Component({
	selector: 'app-Transaction',
	templateUrl: './Transaction.component.html',
	styleUrls: ['./Transaction.component.css']
})
export class TransactionComponent implements OnInit {

  myForm: FormGroup;

  private allTransactions;
  private Transaction;
  private currentId;


  constructor(private http: Http) {};

  ngOnInit():void {
    console.log('about to load all tx');
    this.loadAll();
  }

  loadAll(): Promise<any> {
    let tempList = [];
    console.log('about to get all tx');
    return this.getDataFromUrl('/transaction').then((result) => {
      result.forEach(Transaction => {
        tempList.push(Transaction);
      });
      this.allTransactions = tempList;
      console.log('Transactions:',this.allTransactions)
    });
  }

  getDataFromUrl(url: string): Promise<any> {
        return this.http.get(url).toPromise().then(response => {
            return response.json();
        });
    };


}
