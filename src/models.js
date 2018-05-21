class Block {
  constructor(hash, height, preHash, timestamp, nonce, txIds) {
      this.hash = hash;
      this.height = height;
      this.pre_hash = preHash;
      this.timestamp = timestamp;
      this.nonce = nonce;
      this.txIds = txIds;
  }
}

class Transaction {
  constructor(block, txIndex, total, fees, from, to, timestamp) {
    this.blk_hash = block.hash;
    this.blk_height = block.height;
    this.hash = `${block.hash}_tx_${txIndex}`,
    this.txIndex = txIndex;
    this.total = total;
    this.fees = fees;
    this.from = from;
    this.to = to;
    this.timestamp = timestamp;
  }
}

class Account {
  constructor(address, balance) {
    this.address = address;
    this.balance = balance;
  }
}

module.exports = {
  Block,
  Transaction,
  Account
}
