

// File :org.example.commercialpaper_Account:
class Account   {


    /**
    * The instance identifier for this type
    */
    setId( value ){
        this.ID = value;
    }

    getId(){
        return this.ID;
    }

    /**
    *
    */
    setSummary( value ){
        this.summary = value;
    }

    getSummary(){
        return this.summary;
    }

    /**
    * An instance of org.example.commercialpaper.Currency
    */
    setWorkingcurrency( value ){
        this.workingCurrency = value;
    }

    getWorkingcurrency(){
        return this.workingCurrency;
    }

    /**
    *
    */
    setCashbalance( value ){
        this.cashBalance = value;
    }

    getCashbalance(){
        return this.cashBalance;
    }

    /**
    *
    */
    setAssets( value ){
        this.assets = value;
    }

    getAssets(){
        return this.assets;
    }

}
module.exports.Account=Account;


// File :org.example.commercialpaper_PaperOwnership:
class PaperOwnership   {


    /**
    * Concatenation: company-identifier,paper-cusip (e.g. 'fabric.hyperledger.cp.Company#ACME,ABCDEF012')
    */
    setId( value ){
        this.ID = value;
    }

    getId(){
        return this.ID;
    }

    /**
    * Paper owned
    */
    setPaper( value ){
        this.paper = value;
    }

    getPaper(){
        return this.paper;
    }

    /**
    * Company which owns this quantity of this paper
    */
    setOwner( value ){
        this.owner = value;
    }

    getOwner(){
        return this.owner;
    }

    /**
    * The identifier of an instance of org.example.commercialpaper.Account
    */
    setOwningaccount( value ){
        this.owningAccount = value;
    }

    getOwningaccount(){
        return this.owningAccount;
    }

}
module.exports.Paperownership=PaperOwnership;


// File :org.example.commercialpaper_PaperListing:
class PaperListing   {


    /**
    * The instance identifier for this type
    */
    setId( value ){
        this.ID = value;
    }

    getId(){
        return this.ID;
    }

    /**
    * The identifier of an instance of org.example.commercialpaper.PaperOwnership
    */
    setPaperownership( value ){
        this.paperOwnership = value;
    }

    getPaperownership(){
        return this.paperOwnership;
    }

    /**
    *
    */
    setDiscount( value ){
        this.discount = value;
    }

    getDiscount(){
        return this.discount;
    }

}
module.exports.Paperlisting=PaperListing;


// File :org.example.commercialpaper_CommercialPaper:
class CommercialPaper   {


    /**
    * The instance identifier for this type
    */
    setCusip( value ){
        this.CUSIP = value;
    }

    getCusip(){
        return this.CUSIP;
    }

    /**
    * String based name for readability
    */
    setTicker( value ){
        this.ticker = value;
    }

    getTicker(){
        return this.ticker;
    }

    /**
    * An instance of org.example.commercialpaper.Currency
    */
    setCurrency( value ){
        this.currency = value;
    }

    getCurrency(){
        return this.currency;
    }

    /**
    * The market value of the commercial paper
    */
    setPar( value ){
        this.par = value;
    }

    getPar(){
        return this.par;
    }

    /**
    * Number of days to maturity (minimum = 1 day --> 270 days depending on market)
    */
    setMaturity( value ){
        this.maturity = value;
    }

    getMaturity(){
        return this.maturity;
    }

    /**
    * Company which issued the commercial paper
    */
    setIssuer( value ){
        this.issuer = value;
    }

    getIssuer(){
        return this.issuer;
    }

    /**
    * timestamp at the point of issue
    */
    setIssuedate( value ){
        this.issueDate = value;
    }

    getIssuedate(){
        return this.issueDate;
    }

}
module.exports.Commercialpaper=CommercialPaper;


// File :org.example.commercialpaper_Market:
class Market   {


    /**
    * The instance identifier for this type
    */
    setId( value ){
        this.ID = value;
    }

    getId(){
        return this.ID;
    }

    /**
    *
    */
    setName( value ){
        this.name = value;
    }

    getName(){
        return this.name;
    }

    /**
    * An instance of org.example.commercialpaper.Currency
    */
    setCurrency( value ){
        this.currency = value;
    }

    getCurrency(){
        return this.currency;
    }

    /**
    *
    */
    setPapersforsale( value ){
        this.papersForSale = value;
    }

    getPapersforsale(){
        return this.papersForSale;
    }

    /**
    *
    */
    setMaxmaturitytime( value ){
        this.maxMaturityTime = value;
    }

    getMaxmaturitytime(){
        return this.maxMaturityTime;
    }

}
module.exports.Market=Market;






