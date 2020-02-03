import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Web3Service } from '../util/web3.service';
import { Router, ActivatedRoute } from '@angular/router';

declare let require: any;
declare let window: any;
const contractABI = require('../../../build/contracts/Revolution.json');

@Component({
  selector: 'app-citizen',
  templateUrl: './citizen.component.html',
  styleUrls: ['./citizen.component.css']
})
export class CitizenComponent implements OnInit {

	address: String = "0x";
	name: String = "";
	revolutionAddress: String = "0x0000...";
	revolutionBlockchain: String = "";
	criteria: String = "default criteria from citizen.component.ts";
	distributionAmount: number = 0;
	culottes: any;
	account: any;
	amount;
	showErrorMessageForAddress: boolean = false;
	showErrorMessageForAmount: boolean = false;
	confirmationProgress: number = 0;
        confirmationPercent: number = 0;
	transactionPending: boolean = false;
	showErrorMessageForVote: boolean = false;
        errorDuringVote: String = "";
	transactionConfirmed = false;
	transactionHashes = [];
	web3_eth_contract: any;
	hashtagWithoutSymbol: String = "CulottesRevolution";

  constructor(
    private web3Service: Web3Service,
    private route: ActivatedRoute,
    private router: Router) {

  }


  async ngOnInit() {
    this.getAddress();
    this.watchAccount();
    this.web3Service
      .artifactsToContract(contractABI)
      .then((web3_eth_contract) => {
        this.web3_eth_contract = web3_eth_contract;
        return web3_eth_contract
          .methods
          .criteria()
          .call();
      })
      .then((criteria) => {
        console.log("criteria: ", criteria);
        this.criteria = criteria;
      });
    this.web3Service
      .artifactsToContract(contractABI)
      .then((web3_eth_contract) => {
        return web3_eth_contract
          .methods
          .distributionAmount()
          .call();
      })
      .then( (distributionAmount) => {
        if (distributionAmount === null) {
          this
            .web3Service
            .web3Status
            .next("distributionAmount at this revolution is null!");
          this
            .web3Service
            .statusError = true;
        } else {
          this.distributionAmount = this
            .web3Service
            .weiToEther(distributionAmount);
        }
    });
    this.web3Service
      .artifactsToContract(contractABI)
      .then((web3_eth_contract) => {
        this.web3_eth_contract = web3_eth_contract;
        return web3_eth_contract
          .methods
          .hashtag()
          .call();
      })
      .then((hashtag) => {
        console.log("hashtag: ", hashtag);
        if (hashtag != null && hashtag.length>0) {
          this.hashtagWithoutSymbol = hashtag.substring(1);
        } else {
          this.hashtagWithoutSymbol = "CulottesRevolution";
        }
      });
    this.revolutionAddress = this
      .web3Service
      .revolutionAddress;
    this.revolutionBlockchain = this
      .web3Service
      .revolutionBlockchain;
  }

  sendVote(vote, weiAmount) {
    let component = this;
    this.web3_eth_contract
      .methods
      .vote(vote, this.address)
      .send({from: this.account, value: weiAmount, gas: 1000000})
      .on('transactionHash', function(hash) {
        component.transactionPending = true;
        component.confirmationProgress = 0;
	component.confirmationPercent = 0;
        component.transactionHashes.push(hash);
        console.log('transactionHash received');
      })
      .on('confirmation', function(confirmationNumber, receipt) {
        component.transactionPending = true;
        component.confirmationProgress += 1; //confirmationNumber; // up to 24
	component.confirmationPercent = Math.round(100 * component.confirmationProgress / 24);
        console.log('confirmation received, with number and %: ', confirmationNumber, component.confirmationPercent);
      })
      .on('receipt', function(receipt){
        // receipt example
        console.log('receipt received: ', receipt);
	component.transactionPending = false;
	component.transactionConfirmed = true;
      })
      .on('error', function(error, receipt){
        console.error;
        this.showErrorMessageForVote = true;
        this.errorDuringVote = error;
      }); // If there's an out of gas error the second parameter is the receipt.
  }

  async cakeVote(vote) {
    let canVote = true;
    let addressIsValid = true;
    let component = this;

    // Check address
    try {
      this.address = window
        .web3
        .utils
        .toChecksumAddress(this.address);
      this.showErrorMessageForAddress = false;
    } catch(e) {
      canVote = false;
      addressIsValid = false;
      this.showErrorMessageForAddress = true;
      this.name = e.message;
      console.error('invalid ethereum address', e.message);
    }

    // Check account
    if (this.account == undefined) {
      // Maybe metamask has not been enabled yet
      try {
        // Request account access if needed
        await window.ethereum.enable().then(() =>  {
          window.web3.eth.getAccounts((err, accs) => {
            this.account = accs[0];
            console.log("Accounts refreshed, vote by: " + this.account);
          });
        });
      } catch (error) {
        canVote = false;
        console.log('Metamask not enabled');
      }
    }        
    if (this.account == undefined) {
      canVote = false;
    }

    // Check amount
    if (!this.amount) {
      canVote = false;
      this.showErrorMessageForAmount = true;
    } else {
      this.showErrorMessageForAmount = false;
    }

    // Check balance
    if (this.amount >= this.account.balance) {
      canVote = false;
      this.showErrorMessageForBalance = true;
    } else {
      this.showErrorMessageForBalance = false;
    }
    const weiAmount = this
      .web3Service
      .etherToWei(this.amount.toString());
    console.log("Stake (in wei): " + weiAmount.toString());

    // Vote if everything is fine
    if (canVote == true) {
      console.log("Vote by: " + this.account);
      this.sendVote(vote, weiAmount);
    }
  }

  onClickMeT() {
    this.cakeVote(true);
  }

  onClickMeF() {
    this.cakeVote(false);
  }

  getAddress(): void {
    this.address = this.route.snapshot.paramMap.get('address');
  }

  async watchAccount() {
    this
      .web3Service
      .accountsObservable
      .subscribe((accounts) => {
        this.account = accounts[0];
      });
  }
  
  public onCurrencyChange(event): void {  // event will give you full breif of action
    this.web3Service.currency = event.target.value;
  }

  public convertToFiat(amount) {
    return this
      .web3Service
      .convertToFiat(amount);
  }
  
  public currency() {
    return this.web3Service.currency;
  }
  
}
