import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ChangeAssetValueLogicService } from './ChangeAssetValueLogic.service';
import 'rxjs/add/operator/toPromise';
@Component({
	selector: 'app-ChangeAssetValueLogic',
	templateUrl: './ChangeAssetValueLogic.transaction.html',
//	styleUrls: ['./ChangeAssetValueLogic.transaction.css'],
  providers: [ChangeAssetValueLogicService]
})
export class ChangeAssetValueLogicComponent implements OnInit {

  myForm: FormGroup;
  transaction = {}

	

  



	constructor( private http: ChangeAssetValueLogicService ){}

	submitTransction(){
		console.log(this.transaction)

		this.http.submit(this.transaction).toPromise().
			then((res)=>{console.log(res); this.clearValue();}).
			catch((error)=>{console.log(error);});
	}

	ngOnInit(){ this.clearValue() }

	

	
	clearValue(){
		this.transaction = {
            
                "$class" : 
		
			"org.example.mynetwork"
		
	,
            
			

				
                    
						
						 

		

			
				newValue : "",
			

		
	

					
                    
				
			

				
                    
						
						 

		

			
				relatedAsset : "",
			

		
	

					
                    
				
			

				
                    
						
						 

		

			test : {
				

      
          "$class" : 
		
			"org.example.mynetwork.Test"
		
	,
      	   
				
					
					

                           
            			
            				id : ""
            			 

                    
        		
        	
        
    
			},
	   
	

					
                    
				
			

				
                    
						
						 

		

			
				transactionId : "",
			

		
	

					
                    
				
			

				

                    
                    
						
		

			
				timestamp : ""
			

		
	
                        
                    
				
			
			}
	}

}
