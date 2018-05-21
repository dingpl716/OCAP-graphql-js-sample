// This file has been deprecated. All logic has been moved to resolvers.
// Keep this file for reference purpose only.

const { Block, Transaction, Account } = require('./models');
function endPoints(database) {

  this.blocks = database.blocks;
  this.transactions = database.transactions;
  this.accounts = database.accounts;

  // Root provide an endpoint for every API
  this.root = {
    chain: ({coin, name}) => {
      return {
        coin: `${coin}`,
        name: `${name}`,
        height: this.blocks().length,
      }
    },
    block: ({hash, height}) => {
      let blk = null;
      if (hash && height) {
        blk = this.blocks().find((block) => block.height === height && block.hash === hash);
      } else if (hash) {
        blk = this.blocks().find((block) => block.hash === hash);
      } else {
        blk = this.blocks().find((block) => block.height === height);
      }

      return this.confirmBlock(blk);
    },
    blocks: ({first, end_cur, coin, name, since, till}) => {
      let blks = [];
      let count = 0;
      if (!first) first = this.blocks().length;

      for (let i = 0; i < this.blocks().length; ++i) {
        let blk = this.blocks()[i];
        if (count < first) {
          if (since && blk.timestamp < since) continue;
          if (till && blk.timestamp > till) continue;

          blks.push(this.confirmBlock(blk));
          ++count;
        }
      }

      return { data: blks };
    },
    transaction: ({hash}) => {
      return this.confirmTx(this.transactions().find((tx) => tx.hash === hash));
    },
    transactions: ({first, end_cur, blk_hash, blk_height, address, role, min, max, since, till}) => {
      let txs = [];
      let count = 0;
      if (!first) {
        first = this.transactions().length;
      }

      for (let i = 0; i < this.transactions().length; ++i) {
        let tx = this.transactions()[i];
        if (count < first) {
          if (blk_hash && tx.blk_hash !== blk_hash) continue;
          if (blk_height && tx.blk_height !== blk_height) continue;
          if (address) {
            if (!role) throw new Error('Must specify ROLE if address is specified.');
            switch (role) {
              case 'ISSUER':
                if (tx.from !== address) continue;
                break;
              case 'RECEIVER':
                if (tx.to !== address) continue;
                break;
              default:
                continue;
            }
          }
          if (min && tx.total < min) continue;
          if (max && tx.total > max) continue;
          if (since && tx.timestamp < since) continue;
          if (till && tx.timestamp > till) continue;

          txs.push(this.confirmTx(tx));
          ++count;
        }
      }
      return { data: txs };
    },
    account: ({address}) => {
      return this.accounts().find((acct) => acct.address === address);
    },
    createRawTransaction: ({coin, name, tx}) => {
      return {
        coin: coin,
        name: name,
        block_hash: "6099ec16761692de38f705e3e19552fd7ba834168a695a8d51e6031bd5257de0",
        block_height: 12345,
        hash: tx
      }
    },
    createBlock: ({coin, name}) => {
      return this.confirmBlock(database.createBlock());
    }
  };
  this.confirmBlock = (block) => {
    return {
      hash: block.hash,
      height: block.height,
      pre_hash: block.pre_hash,
      nonce: block.nonce,
      confirmations: this.blocks().length - block.height,
      txIds: block.txIds,
      txs: block.txs
    }
  }

  this.confirmTx = (tx) => {
    return {
      blk_hash: tx.blk_hash,
      blk_height: tx.blk_height,
      hash: tx.hash,
      tx_index: tx.txIndex,
      total: tx.total,
      fees: tx.fees,
      from: tx.from,
      to: tx.to,
      confirmations: this.blocks().length - tx.blk_height
    }
  }
}

module.exports = endPoints;
