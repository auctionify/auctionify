import {compiled, ABI} from './config';
const Promise = require("bluebird");

const getTransactionReceipt = (web3, transactionHash) => {
  return new Promise((acc, rej) => {
    const check = () => {
      web3.eth.getTransactionReceipt(transactionHash, (err, receipt) => {
        console.log("checking", transactionHash);
        if (err) return rej(err);
        if (receipt) return acc(receipt);
        setTimeout(check, 500);
      });
    };
    check();
  });
}

const AuctionContractor = function(web3, from, gas = 3000000) {
  const contract = new web3.eth.Contract(ABI);
  return {
    create: options => new Promise((acc, rej) => {
      const args = [
        options.title,
        options.auctionEnd,
        options.beneficiary,
        options.description,
        options.minimumBid.toString(),
      ];
      console.log("Deploy contract", args);
      contract.deploy({
        data: compiled,
        arguments: args,
      }).send({
        from,
        gas,
      }, (err, transactionHash) => {
        if (err) return rej(err);
        acc(transactionHash);
      });
    }),
    at: address => {
      return new web3.eth.Contract(ABI, address);
    }
  }
}

export {
  AuctionContractor,
  getTransactionReceipt,
}
