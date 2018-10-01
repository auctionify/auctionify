import {compiled, ABI} from './config';
const Promise = require("bluebird");

const delay = async n => new Promise(acc => setTimeout(acc, n));

const attributes = [
  'beneficiary',
  'auctionEnd',
  'auctionTitle',
  'auctionDescription',
  // 'minimumBid',
  'highestBidder',
  'highestBid',
];

const AuctionContractor = function(web3, from, gas = 3000000) {
  const contract = web3.eth.contract(ABI);


  const getTransactionReceipt = transactionHash => {
    return new Promise((acc, rej) => {
      const check = () => {
        web3.eth.getTransactionReceipt(transactionHash, (err, receipt) => {
          console.log("checking");
          if (err) return rej(err);
          if (receipt) return acc(receipt);
          setTimeout(check, 500);
        });
      };
      check();
    });
  }

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
        },
        async (err, deployHash) => {
          if (err) return rej(err);
          const receipt = await getTransactionReceipt(deployHash.transactionHash);
          return acc(receipt.contractAddress);
        });
    }),
    at: address => {
      // return contract.at(contract);
      return Promise.promisifyAll(contract.at(address));
    }
  }
}

export default AuctionContractor;
