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
  const contract = web3.eth.contract(ABI);


  return {
    create: options => new Promise((acc, rej) => {
      contract.new(
        options.title,
        options.auctionEnd,
        options.beneficiary,
        options.description,
        options.minimumBid,
        {
          gas,
          from,
          data: compiled,
        }, (err, deployHash) => {
          if (err) return rej(err);
          acc(deployHash.transactionHash);
        });
    }),
    at: address => {
      return Promise.promisifyAll(contract.at(address));
    }
  }
}

export {
  AuctionContractor,
  getTransactionReceipt,
}
