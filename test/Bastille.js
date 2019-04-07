const Bastille = artifacts.require("./Bastille.sol");
const expect = require('chai').expect;

contract('Bastille', function(accounts) {

  it("Init", async function() {
    const bastille = await Bastille.deployed();
    expect(bastille).to.not.equal(0x0);
    let balance = await web3.eth.getBalance(bastille.address);

    const criteria = await bastille.criteria();
    expect(criteria).to.equal('a frequent contributor to open source projects');

  });


  it("Vote", async function() {
    const bastille = await Bastille.deployed();

    let citizen = accounts[9];
    let receipt = await bastille.vote(true, citizen, {value: 100});
    //expect(receipt.logs.length).to.equal(2);
    expect(receipt.logs[0].event).to.equal('TrialOpened');
    expect(receipt.logs[0].args._citizen).to.equal(citizen);
    expect(receipt.logs[1].event).to.equal('VoteReceived');
    expect(receipt.logs[1].args._from).to.equal(accounts[0]);
    expect(receipt.logs[1].args._citizen).to.equal(citizen);
    expect(receipt.logs[1].args._vote).to.equal(true);
    expect(receipt.logs[1].args._amount.toNumber()).to.equal(100);

    let sansculotteAmount = await bastille.getAmount(true, citizen);
    expect(sansculotteAmount.toNumber()).to.equal(100);

    receipt = await bastille.vote(false, citizen, {value: 300});
    //expect(receipt.logs.length).to.equal(1);
    expect(receipt.logs[0].args._from).to.equal(accounts[0]);
    expect(receipt.logs[0].args._citizen).to.equal(citizen);
    expect(receipt.logs[0].args._vote).to.equal(false);

    let privilegedAmount = await bastille.getAmount(false, citizen);
    expect(privilegedAmount.toNumber()).to.equal(300);

  });

  it("Vote closing", async function() {
    const bastille = await Bastille.deployed();
    let citizen = accounts[9];

    let balance = await web3.eth.getBalance(bastille.address);
    expect(balance).to.equal('400');
    let status = await bastille.trialStatus(citizen);
    expect(status.sansculotte.toNumber()).to.equal(100);
    expect(status.privileged.toNumber()).to.equal(300);

    await bastille.closeTrial(citizen);

    balance = await web3.eth.getBalance(bastille.address);
    expect(balance).to.equal('0');
    status = await bastille.trialStatus(citizen);
    expect(status.sansculotte.toNumber()).to.equal(0);
    expect(status.privileged.toNumber()).to.equal(0);

  });

  it("Play", async function() {
    let blockNumber = await web3.eth.getBlockNumber();
    console.log('start blockNumber: ' + blockNumber);

    const bastille = await Bastille.deployed();
    let A = accounts[1];
    let B = accounts[2];
    let C = accounts[3];
    let D = accounts[4];
    let E = accounts[5];

    let citizen = accounts[9];

    let balance = await web3.eth.getBalance(bastille.address);
    expect(balance).to.equal('0');

    let bastilleBalance = await bastille.bastilleBalance();
    expect(bastilleBalance.toNumber()).to.equal(200);
    let status = await bastille.trialStatus(citizen);
    expect(status.sansculotte.toNumber()).to.equal(0);
    expect(status.privileged.toNumber()).to.equal(0);

    await bastille.vote(true, citizen, {from: A, value: 1});
    await bastille.vote(true, citizen, {from: B, value: 2});
    await bastille.vote(true, citizen, {from: C, value: 3});
    status = await bastille.trialStatus(citizen);
    expect(status.sansculotte.toNumber()).to.equal(6);
    expect(status.privileged.toNumber()).to.equal(0);

    await bastille.vote(false, citizen, {from: D, value: 2});
    await bastille.vote(false, citizen, {from: E, value: 2});
    status = await bastille.trialStatus(citizen);
    expect(status.sansculotte.toNumber()).to.equal(6);
    expect(status.privileged.toNumber()).to.equal(4);

    let beforeBalanceA = await web3.eth.getBalance(A);
    let beforeBalanceB = await web3.eth.getBalance(B);
    let beforeBalanceC = await web3.eth.getBalance(C);

    await bastille.closeTrial(citizen);

    let afterBalanceA = await web3.eth.getBalance(A);
    let afterBalanceB = await web3.eth.getBalance(B);
    let afterBalanceC = await web3.eth.getBalance(C);

    expect(web3.utils.toBN(afterBalanceA).sub(web3.utils.toBN(beforeBalanceA)).toNumber()).to.equal(1+0);
    expect(web3.utils.toBN(afterBalanceB).sub(web3.utils.toBN(beforeBalanceB)).toNumber()).to.equal(2+1);
    expect(web3.utils.toBN(afterBalanceC).sub(web3.utils.toBN(beforeBalanceC)).toNumber()).to.equal(3+2);

    status = await bastille.trialStatus(citizen);
    expect(status.sansculotte.toNumber()).to.equal(0);
    expect(status.privileged.toNumber()).to.equal(0);
    expect(status.opened).to.equal(false);
    expect(status.verdict).to.equal(true);

    bastilleBalance = await bastille.bastilleBalance();
    console.log('bastilleBalance: ' + bastilleBalance.toNumber());

    blockNumber = await web3.eth.getBlockNumber();
    console.log('end blockNumber: ' + blockNumber);

    // expect(bastilleBalance.toNumber()).to.equal(200);

    let beforeBalanceCitizen = await web3.eth.getBalance(citizen);
    console.log('beforeBalanceCitizen: ', beforeBalanceCitizen);
    await bastille.distribute();
    let afterBalanceCitizen = await web3.eth.getBalance(citizen);
    console.log('afterBalanceCitizen: ', afterBalanceCitizen);

    expect(web3.utils.toBN(afterBalanceCitizen).sub(web3.utils.toBN(beforeBalanceCitizen)).toNumber()).to.equal(1);

  });

  it("Fallback", async function() {
    const bastille = await Bastille.deployed();
    await web3.eth.sendTransaction({from: accounts[9], to: bastille.address, value: 100});
    let bastilleBalance = await bastille.bastilleBalance();
    expect(bastilleBalance.toNumber()).to.equal(102);

  });

});
