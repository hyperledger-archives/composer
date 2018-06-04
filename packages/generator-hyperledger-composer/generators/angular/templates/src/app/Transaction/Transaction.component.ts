import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { <%= currentTransaction.name %>Service } from './<%= currentTransaction.name %>.service';
import 'rxjs/add/operator/toPromise';
@Component({
	selector: 'app-<%= currentTransaction.name %>',
	templateUrl: './<%= currentTransaction.name %>.transaction.html',
//	styleUrls: ['./<%= currentTransaction.name %>.transaction.css'],
  providers: [<%= currentTransaction.name %>Service]
})
export class <%= currentTransaction.name %>Component implements OnInit {

  myForm: FormGroup;
  transaction = {}

	<% function printnameSpace(transaction){ %>
		<% if (namespaces[transaction.type] === undefined ) { %>
			"<%= namespaces[transaction.name] %>"
		<% } else { %>
			"<%= namespaces[transaction.type] %>"
		<% } %>
	<% } %>

  <% function recOnProperties(transaction) { %>

      <% if (transaction.properties === undefined) { %>
          "$class" : <% printnameSpace(transaction) %>
      <% } else { %>
          "$class" : <% printnameSpace(transaction) %>,
      	   <% for ( let q = 0 ; q < transaction.properties.length; q++) { %>
				<% if (q === transaction.properties.length - 1){ %>
					
					<% if (transaction.properties[q].array === true || transaction.properties[q].isArray === true) { %>
						
						<% if (transaction.properties[q].properties === undefined) { %>
							<%= transaction.properties[q].name %> : [ "" ]
						<% } else { %>
							<%= transaction.properties[q].name %> : [ { <% recOnProperties(transaction.properties[q])  %> } ]
						<% } %>

                    <% } else { %>

                           
            			<% if (transaction.properties[q].properties === undefined) { %>
            				<%= transaction.properties[q].name %> : ""
            			<% } else { %>
            				<%= transaction.properties[q].name %> : { <% recOnProperties(transaction.properties[q])  %> }
            			<% } %> 

                    <% } %>
        		<% } else { %>
					<% if (transaction.properties[q].array === true || transaction.properties[q].isArray === true) { %>
						
						<% if (transaction.properties[q].properties === undefined) { %>
							<%= transaction.properties[q].name %> : [ "" ],
						<% } else { %>
							<%= transaction.properties[q].name %> : [ { <% recOnProperties(transaction.properties[q]) %> } ],
						<% } %>

                    <% } else { %>

						<% if (transaction.properties[q].properties === undefined) { %>
            				<%= transaction.properties[q].name %> : "",
            			<% } else { %>
            				<%= transaction.properties[q].name %> : { <% recOnProperties(transaction.properties[q]) %> },
            			<% } %>


                    <% } %>
        		<% } %>
        	<% } %>
        <% } %>
    <% } %>



	constructor( private http: <%= currentTransaction.name %>Service ){}

	submitTransction(){
		console.log(this.transaction)

		this.http.submit(this.transaction).toPromise().
			then((res)=>{console.log(res); this.clearValue();}).
			catch((error)=>{console.log(error);});
	}

	ngOnInit(){ this.clearValue() }

	<% function printTransaction(currentTransaction) { %>
		<% if (currentTransaction.properties === undefined){ %>

			<% if(currentTransaction.enum === true){ %>
				<%= currentTransaction.name %> : { value: [] }
			<% } else{ %>
				<%= currentTransaction.name %> : ""
			<% } %>

		<% } else { %>

			<%= currentTransaction.name %> : {
				<% recOnProperties(currentTransaction) %>
			}
		<% } %>
	<% } %>

	<% function printWithDotTransaction(currentTransaction) { %> 

		<% if (currentTransaction.properties === undefined){ %>

			<% if(currentTransaction.enum === true){ %>
				<%= currentTransaction.name %> : { value: [] ],
			<% } else{ %>
				<%= currentTransaction.name %> : "",
			<% } %>

		<% } else { %>

			<%= currentTransaction.name %> : {
				<% recOnProperties(currentTransaction) %>
			},
	   <% } %>
	<% } %>
	clearValue(){
		this.transaction = {
            <% if (currentTransaction.properties === undefined) { %>
                "$class" : <% printnameSpace(currentTransaction) %>
            <% } else { %>
                "$class" : <% printnameSpace(currentTransaction) %>,
            <% } %>
			<% for(var x = 0 ; x < currentTransaction.properties.length;  x++){ %>

				<% if (currentTransaction.properties.length -1 === x) { %>

                    <% if (currentTransaction.properties[x].array === true) { %>
						[
							<% printTransaction(currentTransaction.properties[x]) %>
						]
                    <% }else { %>
                    
						<% printTransaction(currentTransaction.properties[x]) %>
                        
                    <% } %>
				<% } else { %>
                    <% if (currentTransaction.properties[x].array === true) { %>
    					[
							<% printWithDotTransaction(currentTransaction.properties[x]) %>

						]
					<% } else { %>
						
						<% printWithDotTransaction(currentTransaction.properties[x]) %>

					
                    <% } %>
				<% } %>
			<% } %>
			}
	}

}
