import Web3 from 'web3'

export async function getWeb3() {
  let web3;
  let network = 'mainnet';

  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
  } else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider);
  }

  if (web3) {
    network = await web3.eth.net.getNetworkType();
    network = network === 'main' ? 'mainnet' : network;
  }

  const readOnlyWeb3 = new Web3(new Web3.providers.WebsocketProvider(`wss://${network}.infura.io/ws/v3/462d104bd22247fcb9d06380b232ef64`));
  return {
    web3,
    readOnlyWeb3,
    network,
  }
}
