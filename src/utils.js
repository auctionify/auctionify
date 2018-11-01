import Web3 from 'web3'

export const BigNumber = Web3.utils.BN;
export const toWei = Web3.utils.toWei;
export const fromWei = Web3.utils.fromWei;
export const WEI_STEP = new BigNumber('10000000000000000');