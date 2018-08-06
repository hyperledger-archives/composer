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
import { <%= currentParticipant.name %>Service } from './<%= currentParticipant.name %>.service';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'app-<%= currentParticipant.name.toLowerCase() %>',
  templateUrl: './<%= currentParticipant.name %>.component.html',
  styleUrls: ['./<%= currentParticipant.name %>.component.css'],
  providers: [<%= currentParticipant.name %>Service]
})
export class <%= currentParticipant.name %>Component implements OnInit {

  myForm: FormGroup;

  private allParticipants;
  private participant;
  private currentId;
  private errorMessage;

        <%_ for(var x=0;x<currentParticipant.properties.length;x++){ _%>
            <%_ if(currentParticipant.properties[x].array === true && currentParticipant.properties[x].enum === true){ _%>
  <% _%>        <%= currentParticipant.properties[x].name %> = { value: [] };
              <%_ }else{ _%>
  <% _%>        <%= currentParticipant.properties[x].name %> = new FormControl('', Validators.required);
              <%_ } _%>
        <%_}_%>


  constructor(public service<%= currentParticipant.name %>: <%= currentParticipant.name %>Service, fb: FormBuilder) {
    this.myForm = fb.group({
          <%_ for(var x=0;x<currentParticipant.properties.length;x++){ _%>
              <%_ if(x == currentParticipant.properties.length-1){ _%>
      <% _%>    <%= currentParticipant.properties[x].name %>: this.<%=currentParticipant.properties[x].name%>
              <%_ }else{ _%>
      <% _%>    <%=currentParticipant.properties[x].name%>: this.<%=currentParticipant.properties[x].name%>,
              <%_ } _%>
          <%_ }_%>
    });
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): Promise<any> {
    const tempList = [];
    return this.service<%= currentParticipant.name %>.getAll()
    .toPromise()
    .then((result) => {
      this.errorMessage = null;
      result.forEach(participant => {
        tempList.push(participant);
      });
      this.allParticipants = tempList;
    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else if (error === '404 - Not Found') {
        this.errorMessage = '404 - Could not find API route. Please check your available APIs.';
        this.errorMessage = error;
      }
    });
  }

	/**
   * Event handler for changing the checked state of a checkbox (handles array enumeration values)
   * @param {String} name - the name of the participant field to update
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
   * only). This is used for checkboxes in the participant updateDialog.
   * @param {String} name - the name of the participant field to check
   * @param {any} value - the enumeration value to check for
   * @return {Boolean} whether the specified participant field contains the provided value
   */
  hasArrayValue(name: string, value: any): boolean {
    return this[name].value.indexOf(value) !== -1;
  }

  addParticipant(form: any): Promise<any> {
    this.participant = {
      $class: '<%= namespace %>.<%= currentParticipant.name %>',
            <%_ for(var x=0;x<currentParticipant.properties.length;x++){ _%>
              <%_ if(x == currentParticipant.properties.length-1){ _%>
      <% _%>    '<%= currentParticipant.properties[x].name %>': this.<%= currentParticipant.properties[x].name %>.value
              <%_ }else{ _%>
      <% _%>    '<%=currentParticipant.properties[x].name%>': this.<%= currentParticipant.properties[x].name %>.value,
              <%_ } _%>
            <%_ }_%>
    };

    this.myForm.setValue({
            <%_ for(var x=0;x<currentParticipant.properties.length;x++){ _%>
              <%_ if(x == currentParticipant.properties.length-1){ _%>
      <% _%>      '<%= currentParticipant.properties[x].name %>': null
              <%_ }else{ _%>
      <% _%>      '<%=currentParticipant.properties[x].name%>': null,
              <%_ } _%>
            <%_ }_%>
    });

    return this.service<%= currentParticipant.name %>.addParticipant(this.participant)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
      this.myForm.setValue({
            <%_ for(var x=0;x<currentParticipant.properties.length;x++){ _%>
              <%_ if(x == currentParticipant.properties.length-1){ _%>
        <% _%>    '<%= currentParticipant.properties[x].name %>': null
              <%_ }else{ _%>
        <% _%>    '<%=currentParticipant.properties[x].name%>': null,
              <%_ } _%>
            <%_ }_%>
      });
      this.loadAll(); 
    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else {
        this.errorMessage = error;
      }
    });
  }


   updateParticipant(form: any): Promise<any> {
    this.participant = {
      $class: '<%= namespace %>.<%= currentParticipant.name %>',
            <%_ for(var x=0;x<currentParticipant.properties.length;x++){ _%>
              <%_ if(x == currentParticipant.properties.length-1){ _%>
                <%_ if(currentParticipant.properties[x].name != currentParticipant.identifier){ _%>
      <% _%>      '<%= currentParticipant.properties[x].name %>': this.<%= currentParticipant.properties[x].name %>.value
                <%_ } _%>
              <%_ }else{ _%>
                <%_ if(currentParticipant.properties[x].name != currentParticipant.identifier){ _%>
      <% _%>      '<%=currentParticipant.properties[x].name%>': this.<%= currentParticipant.properties[x].name %>.value,
                <%_ } _%>
              <%_ } _%>
            <%_ } _%>
    };

    return this.service<%= currentParticipant.name %>.updateParticipant(form.get('<%=participantIdentifier%>').value, this.participant)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
      this.loadAll();
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


  deleteParticipant(): Promise<any> {

    return this.service<%= currentParticipant.name %>.deleteParticipant(this.currentId)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
      this.loadAll();
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

    return this.service<%= currentParticipant.name %>.getparticipant(id)
    .toPromise()
    .then((result) => {
      this.errorMessage = null;
      const formObject = {
              <%_ for(var x=0;x<currentParticipant.properties.length;x++){ _%>
                <%_ if(x == currentParticipant.properties.length-1){ _%>
        <% _%>    '<%= currentParticipant.properties[x].name %>': null
                <%_ }else{ _%>
        <% _%>    '<%=currentParticipant.properties[x].name%>': null,
                <%_ } _%>
              <%_ } _%>
      };

            <%_ for(var x=0;x<currentParticipant.properties.length;x++){ _%>
      <% _%>  if (result.<%=currentParticipant.properties[x].name%>) {
                <%_ if(currentParticipant.properties[x].array === true){ _%>
        <% _%>    this.<%= currentParticipant.properties[x].name %> = { value: result.<%= currentParticipant.properties[x].name %> };
                <%_ }else{ _%>
        <% _%>    formObject.<%= currentParticipant.properties[x].name %> = result.<%= currentParticipant.properties[x].name %>;
                <%_ } _%>
      <% _%>  } else {
        <% _%>    formObject.<%= currentParticipant.properties[x].name %> = null;
      }

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
            <%_ for(var x=0;x<currentParticipant.properties.length;x++){ _%>
              <%_ if(x == currentParticipant.properties.length-1){ _%>
      <% _%>     '<%= currentParticipant.properties[x].name %>': null
              <%_ } else { _%>
      <% _%>     '<%=currentParticipant.properties[x].name%>': null,
              <%_ } _%>
            <%_ } _%>
    });
  }
}
