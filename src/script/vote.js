import Web3 from 'web3'
import TruffleContract from 'truffle-contract'
import VoteJSON from '../../dist/contracts/Vote.json'
import NodeRSA from 'node-rsa'

// const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

class Vote {
  /**
   * Citizen private key
   */
  privKey

  /**
   * Citizen public key
   */
  pubKey

  /**
   * Web3 instance.
   */
  web3

  /**
   * TruffleContract instance for Vote contract.
   */
  contract

  /**
   * Represents a Vote client instance.
   *
   * @class
   */
  constructor () {
    // hack for using Web3 v1.0 with TruffleContract
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send

    // initialise our Web3 instance
    if (window && window.web3) {
      console.info('[Web3] Using browser Web3 provider')
      this.web3 = new Web3(window.web3.currentProvider)
    } else {
      console.info(`[Web3] Using RPC Web3 provider (http://localhost:7545)`)
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'))
    }

    // initialise our contract reference
    this.contract = TruffleContract(VoteJSON)
    this.contract.setProvider(this.web3.currentProvider)
    this.contract.defaults({
      gas: 900000
    })

    // RSA key generation
    this.privKey = window.localStorage.getItem('privateKey')
    if (this.privKey == null) {
      let key = new NodeRSA({b: 512})
      window.localStorage.setItem('privateKey', key.exportKey('private'))
      this.privKey = key.exportKey('private')
      window.localStorage.setItem('publicKey', key.exportKey('public'))
    }
    this.pubKey = window.localStorage.getItem('publicKey')
  }

  /* GOVERNMENT */

  async generateEncryptedWallet (identityPublicKey) {
    // TODO: generate a voting private key and encrypt with identityPublicKey
    return 'snake oil'
  }

  async publishWallet (addr, encryptedPrivateKey) {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    await instance.publishWallet(addr, encryptedPrivateKey, {from: accounts[0]})
  }

  async addCandidate (description, image) {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    return await instance.addCandidate(description, image, {from: accounts[0]})
  }

  async beginVoting (votingAddresses) {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    await instance.beginVoting(votingAddresses, {from: accounts[0]})
  }

  async endVoting () {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    await instance.endVoting({from: accounts[0]})
  }

  /* CITIZENS */

  async getWallet () {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    return await instance.getWallet(accounts[0], {from: accounts[0]})
  }

  async submitVote (candidateId) {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()
    const votingPublicKey = await instance.votingPublicKey() // TODO: does this work?

    // TODO: generate nonce

    let vote = {
      choice: candidateId,
      nonce: 'TODO'
    }

    let encryptedVote = JSON.stringify(vote)
    console.log(votingPublicKey)
    // TODO: encrypt with votingPublicKey

    await instance.submitVote(encryptedVote, {from: accounts[0]})
  }

  async publishedWallet () {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()
    let wallet = await instance.getWallet(accounts[0], {from: accounts[0]})
    console.log(wallet)
    return wallet
  }

  async canVote () {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()
    if (await !this.publishedWallet()) {
      return false
    }
    return await instance.isVoteAvailable(accounts[0], {from: accounts[0]})
  }

  /* ANYBODY */

  async getCandidates () {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()
    let numberOfCandidates = await instance.getNumberOfCandidates({from: accounts[0]})
    let candidates = []

    for (var candidateId in numberOfCandidates.toNumber()) {
      candidates.push(await instance.getCandidate(candidateId, {from: accounts[0]}))
    }

    return candidates
  }

  async getVotes () {
    const instance = await this.contract.deployed()
    const votingPrivateKey = await instance.votingPrivateKey() // TODO: does this work?

    let encryptedVotes = await instance.encryptedVotes() // TODO: does this work?
    // TODO: decrypt votes
    console.log(encryptedVotes, votingPrivateKey)
    let votes = []

    return votes
  }
}

// class Web3Error extends Error {
//   constructor (...args) {
//     super(...args)
//
//     this.name = this.constructor.name
//
//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, this.constructor)
//     }
//   }
// }

export default Vote
