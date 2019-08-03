import { Component, OnInit } from "@angular/core";
import { Web3Service } from "../util/web3.service";

declare let require: any;
const contractABI = require("../../../build/contracts/Revolution.json");

@Component({
  selector: "app-revolution",
  templateUrl: "./revolution.component.html",
  styleUrls: ["./revolution.component.css"]
})
export class RevolutionComponent implements OnInit {
  title: String = "<loading title>";
  criteria: String = "<loading criteria>";
  bastilleBalance: String = "?";
  revolutionAddress: String = "0x0000000...";
  culottes: any;
  account: any;
  web3Status: String = "Status of connection to your blockchain accounts";
  citizens: Array<String> = [];

  constructor(private web3Service: Web3Service) {}

  async ngOnInit() {
    console.log("OnInit: " + this.web3Service);
    console.log(this);
    this.watchAccount();
    let web3_eth_contract = await this.web3Service.artifactsToContract(
      contractABI
    );
    this.criteria = await web3_eth_contract.methods.criteria().call();
    this.revolutionAddress = this.web3Service.revolutionAddress;
    this.bastilleBalance = await web3_eth_contract.methods.bastilleBalance()
      .call()
      .then( (result) => {
        if (result === null) {
          this.web3Service.web3Status.next("The balance of this bastille is null !");
        } else {
          this.web3Service.web3Status.next("bastilleBalance ready.");
          return this.web3Service.weiToEther(result);
        }
      })
      .catch( (error) => {
        this.web3Service.web3Status.next("An error occured while reading bastilleBalance: " + error);
      });
    let i = 0;
    let citizen = "";
    await web3_eth_contract.methods.citizens(1).call().then ( (result) => {
      this.web3Service.web3Status.next("Here is how null address is returned from contract : " + result);
    });
    while (citizen != "0x00") {
      citizen = await web3_eth_contract.methods.citizens(i).call()
      .then( (result) => {
        return result;
      })
      .catch( (error) => {
        this.web3Service.web3Status.next("An error occured while reading citizen " + i.toString() + " : " + error);
        return ""
      });
      if (citizen != "" && citizen != "0x00") {
      this.citizens.push(citizen);
      }
      i += 1;
    }
    this.web3Service.web3Status.next("Here a re the citizens known at this bastille : " + this.citizens.toString());
  }

  async watchAccount() {
  
      this.web3Service.web3Status.subscribe(status => { this.web3Status = status; });
    this.web3Service.accountsObservable.subscribe(accounts => {
      this.account = accounts[0];
    });
  }
}
