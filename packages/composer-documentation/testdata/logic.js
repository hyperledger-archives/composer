/*
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
'use strict';

// SDK Library to asset with writing the logic
const SmartContract = require('fabric-shim').SmartContract;

/**
 * Support the Business Network for Commercial Paper Trading
 */
class commercial_paper_network extends SmartContract {


    
	constructor() {
		super('org.example.commercialpaper');
	}

    /**  
     * maturedPaper string  The identifier of an instance of org.example.commercialpaper.PaperOwnership 
    */
	async RedeemPaper(api,maturedPaper) {
	}

    /**  
     * market string  The identifier of an instance of org.example.commercialpaper.Market  
     * listing string  The identifier of an instance of org.example.commercialpaper.PaperListing  
     * account string  The identifier of an instance of org.example.commercialpaper.Account 
    */
	async PurchasePaper(api,market,listing,account) {
	}

    /**  
     * CUSIP string    
     * ticker string    
     * maturity integer    
     * workingCurrency object  An instance of org.example.commercialpaper.Currency  
     * par number    
     * numberToCreate integer   
    */
	async CreatePaper(api,CUSIP,ticker,maturity,workingCurrency,par,numberToCreate) {
	}

    /**  
     * market string  The identifier of an instance of org.example.commercialpaper.Market  
     * discount number    
     * papersToList array   
    */
	async ListOnMarket(api,market,discount,papersToList) {
	}

    /**  
     * targetCompany string  The identifier of an instance of org.example.commercialpaper.Company  
     * publicdid object  An instance of org.example.commercialpaper.DID 
    */
	async AssignDid(api,targetCompany,publicdid) {
	}
 

};

module.exports =  commercial_paper_network;