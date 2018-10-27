## Auctionify

A decentral stand-alone platform to facilitate Ethereum blockchain as a fair auctioning and payment platform. 

__Motto__: Let's meet the society half way through (decentralization). 

_Note_: Auctionify can be used to run decentral auctions, the final transfer of the auctioned goods needs to be done separate from the auction, same as it is in the real world now.

------------

### Back story:
You may know the deal with [DevCon4](https://blog.ethereum.org/2018/07/03/devcon4-ticket-sales/) ticket sales. They sold the tickets in waves (~500 tickets in each wave), but the tickets where sold out with in minutes. I managed to get in one of the waves, but later on got another ticket for our breakout room.  I decided to auction the ticket within Ethereum community, however after writing a simple auction smart contract, there was no easy way to have a nice interface on top of it. I'm a coder and a `Blockchain engineer` and it still was not easy to set up a fully functional UI for the auction to send around. And who can really interact with a smart contract with no UI?
Long story short, I decided to develop Auctionify with a friend, a _shopify_ for auctions (Using smart contracts on top of Ethereum blockchain), something really easy to use. 

-----------------------


## How it works:

1. `Beneficiary` creates an auction (Smart contract) with the following inputs:
	- Title
	- Description
	- Auction end time
	- Minimum acceptable bid (Optional, default 0.1 ETH) 
	- Beneficiary address (Optional, default [first account of the logged in wallet](#supported wallets)


2. Bidders start to bid
	- The first bidder will become the `highest Bidder`
	- From there on, every `highest Bidder` will refund the second highest bidder
	- lower bids will be refunded right away
	- **Note**: Do not use exchanges or addresses you do not control to send bids to any auctions. If so, the refunded bids may not be under your control anymore.

3. When auction ends, only the `highest Bidder` (or if Escrow enabled the `Escrow Moderator`) can finalize the auction. Finalizing the auction sends the funds to the `beneficiary`.

- If there is dispute, the dispute work flow is similar to open source bugs, you have to open a github issue with the details required in [GITHUB REPO FOR DISPUTES].

---------------------

## Where is what?
- `Auctionify.xyz` is completely open source and hosted on github (No privately controlled server): [Github](https://github.com/auctionify/auctionify)
- `Auctionify.sol` is the smart contract used as the backend for the auctions, completely open source and documented: [Github](https://github.com/auctionify/smart-contract)  


----------------------

**Disclaimer** : This is a work in progress, make sure you know what you are doing before putting your life savings on an auction. 

