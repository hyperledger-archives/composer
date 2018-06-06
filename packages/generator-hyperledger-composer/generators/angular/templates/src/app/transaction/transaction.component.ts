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

import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { <%= currentTransaction.name %>Service } from './<%= currentTransaction.name %>.service';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'app-<%= currentTransaction.name.toLowerCase() %>',
  templateUrl: './<%= currentTransaction.name %>.component.html',
  styleUrls: ['./<%= currentTransaction.name %>.component.css'],
  providers: [<%= currentTransaction.name %>Service]
})
export class <%= currentTransaction.name %>Component implements OnInit {

  myForm: FormGroup;

  private allTransactions;
  private Transaction;
  private currentId;
  private errorMessage;

        <%_ for(var x=0;x<currentTransaction.properties.length;x++){ _%>
            <%_ if(currentTransaction.properties[x].array === true && currentTransaction.properties[x].enum === true){ _%>
  <% _%>        <%= currentTransaction.properties[x].name %> = { value: [] };
              <%_ }else{ _%>
  <% _%>        <%= currentTransaction.properties[x].name %> = new FormControl('', Validators.required);
              <%_ } _%>
        <%_}_%>


  constructor(private service<%= currentTransaction.name %>: <%= currentTransaction.name %>Service, fb: FormBuilder) {
    this.myForm = fb.group({
          <%_ for(var x=0;x<currentTransaction.properties.length;x++){ _%>
              <%_ if(x == currentTransaction.properties.length-1){ _%>
      <% _%>    <%= currentTransaction.properties[x].name %>: this.<%=currentTransaction.properties[x].name%>
              <%_ }else{ _%>
      <% _%>    <%=currentTransaction.properties[x].name%>: this.<%=currentTransaction.properties[x].name%>,
              <%_ } _%>
          <%_ }_%>
    });
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): Promise<any> {
    const tempList = [];
    return this.service<%= currentTransaction.name %>.getAll()
    .toPromise()
    .then((result) => {
      this.errorMessage = null;
      result.forEach(transaction => {
        tempList.push(transaction);
      });
      this.allTransactions = tempList;
    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else if (error === '404 - Not Found') {
        this.errorMessage = '404 - Could not find API route. Please check your available APIs.';
      } else {
        this.errorMessage = error;
      }
    });
  }

	/**
   * Event handler for changing the checked state of a checkbox (handles array enumeration values)
   * @param {String} name - the name of the transaction field to update
   * @param {any} value - the enumeration value for which to toggle the checked state
   */
  changeArrayValue(name: string, value: any): void {
    const index = this[name].value.indexOf(value);
    if (index === -1) {
      this[name].value.push(value);
    } else {
      this[name].value.splice(index, 1);
    }
  }

	/**
	 * Checkbox helper, determining whether an enumeration value should be selected or not (for array enumeration values
   * only). This is used for checkboxes in the transaction updateDialog.
   * @param {String} name - the name of the transaction field to check
   * @param {any} value - the enumeration value to check for
   * @return {Boolean} whether the specified transaction field contains the provided value
   */
  hasArrayValue(name: string, value: any): boolean {
    return this[name].value.indexOf(value) !== -1;
  }

  addTransaction(form: any): Promise<any> {
    this.Transaction = {
      $class: '<%= namespace %>.<%= currentTransaction.name %>',
            <%_ for(var x=0;x<currentTransaction.properties.length;x++){ _%>
              <%_ if(x == currentTransaction.properties.length-1){ _%>
      <% _%>    '<%= currentTransaction.properties[x].name %>': this.<%= currentTransaction.properties[x].name %>.value
              <%_ }else{ _%>
      <% _%>    '<%=currentTransaction.properties[x].name%>': this.<%= currentTransaction.properties[x].name %>.value,
              <%_ } _%>
            <%_ } _%>
    };

    this.myForm.setValue({
            <%_ for(var x=0;x<currentTransaction.properties.length;x++){ _%>
              <%_ if(x == currentTransaction.properties.length-1){ _%>
      <% _%>    '<%= currentTransaction.properties[x].name %>': null
              <%_ }else{ _%>
      <% _%>    '<%=currentTransaction.properties[x].name%>': null,
              <%_ } _%>
            <%_ } _%>
    });

    return this.service<%= currentTransaction.name %>.addTransaction(this.Transaction)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
      this.myForm.setValue({
            <%_ for(var x=0;x<currentTransaction.properties.length;x++){ _%>
              <%_ if(x == currentTransaction.properties.length-1){ _%>
        <% _%>  '<%= currentTransaction.properties[x].name %>': null
              <%_ }else{ _%>
        <% _%>  '<%=currentTransaction.properties[x].name%>': null,
              <%_ } _%>
            <%_ } _%>
      });
    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else {
        this.errorMessage = error;
      }
    });
  }

  updateTransaction(form: any): Promise<any> {
    this.Transaction = {
      $class: '<%= namespace %>.<%= currentTransaction.name %>',
            <%_ for(var x=0;x<currentTransaction.properties.length;x++){ _%>
              <%_ if(x == currentTransaction.properties.length-1){ _%>
                <%_ if(currentTransaction.properties[x].name != currentTransaction.identifier){ _%>
      <% _%>      '<%= currentTransaction.properties[x].name %>': this.<%= currentTransaction.properties[x].name %>.value
                <%_ } _%>
              <%_ }else{ _%>
                <%_ if(currentTransaction.properties[x].name != currentTransaction.identifier){ _%>
      <% _%>      '<%=currentTransaction.properties[x].name%>': this.<%= currentTransaction.properties[x].name %>.value,
                <%_ } _%>
              <%_ } _%>
            <%_ } _%>
    };

    return this.service<%= currentTransaction.name %>.updateTransaction(form.get('<%=transactionIdentifier%>').value, this.Transaction)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else if (error === '404 - Not Found') {
      this.errorMessage = '404 - Could not find API route. Please check your available APIs.';
      } else {
        this.errorMessage = error;
      }
    });
  }

  deleteTransaction(): Promise<any> {

    return this.service<%= currentTransaction.name %>.deleteTransaction(this.currentId)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else if (error === '404 - Not Found') {
        this.errorMessage = '404 - Could not find API route. Please check your available APIs.';
      } else {
        this.errorMessage = error;
      }
    });
  }

  setId(id: any): void {
    this.currentId = id;
  }

  getForm(id: any): Promise<any> {

    return this.service<%= currentTransaction.name %>.getTransaction(id)
    .toPromise()
    .then((result) => {
      this.errorMessage = null;
      const formObject = {
              <%_ for(var x=0;x<currentTransaction.properties.length;x++){ _%>
                <%_ if(x == currentTransaction.properties.length-1){ _%>
        <% _%>    '<%= currentTransaction.properties[x].name %>': null
                <%_ }else{ _%>
        <% _%>    '<%=currentTransaction.properties[x].name%>': null,
                <%_ } _%>
              <%_ } _%>
      };

            <%_ for(var x=0;x<currentTransaction.properties.length;x++){ _%>
      <% _%>  if (result.<%=currentTransaction.properties[x].name%>) {
                <%_ if(currentTransaction.properties[x].array === true){ _%>
        <% _%>    this.<%= currentTransaction.properties[x].name %> = { value: result.<%= currentTransaction.properties[x].name %> };
                <%_ }else{ _%>
        <% _%>    formObject.<%= currentTransaction.properties[x].name %> = result.<%= currentTransaction.properties[x].name %>;
                <%_ } _%>
      <% _%>  } else {
        <% _%>    formObject.<%= currentTransaction.properties[x].name %> = null;
      <% _%>  }

            <%_}_%>
      this.myForm.setValue(formObject);

    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else if (error === '404 - Not Found') {
      this.errorMessage = '404 - Could not find API route. Please check your available APIs.';
      } else {
        this.errorMessage = error;
      }
    });
  }

  resetForm(): void {
    this.myForm.setValue({
            <%_ for(var x=0;x<currentTransaction.properties.length;x++){ _%>
              <%_ if(x == currentTransaction.properties.length-1){ _%>
      <% _%>    '<%= currentTransaction.properties[x].name %>': null
              <%_ }else{ _%>
      <% _%>    '<%=currentTransaction.properties[x].name%>': null,
              <%_ } _%>
            <%_ } _%>
    });
  }
}
