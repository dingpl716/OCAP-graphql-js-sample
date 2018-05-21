const { Block, Transaction, Account } = require('./models');

const MAX = 100000000;
const MIN = MAX / 1000000;
const NONCE = 100000;
const TX_NO = 4;

var blocks = [];
var transactions = [];
var accounts = [];

function getRandom(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function createAccounts(number) {
  for (let i = 1; i <= number; ++i) {
    accounts.push(new Account(`acc${i}`, getRandom(MAX)));
  }
}

function createTransaction(block, index, blkTime) {
  let tx = new Transaction(
    block,
    index,
    getRandom(MAX),
    getRandom(MIN),
    accounts[0].address,
    accounts[1].address,
    blkTime - TX_NO + index
  );

  transactions.push(tx);
  return tx;
}

function createBlock() {
  let index = blocks.length
  let blkHash= `blk_${index}`;
  let blkTime = index * 100;
  let block = new Block(
    blkHash,
    index,
    blocks[index - 1].hash,
    blkTime,
    getRandom(NONCE)
  );

  let txIds = [];
  for (let i = 0; i < TX_NO; ++i) {
    let tx = createTransaction(block, i, blkTime);
    txIds.push(tx.hash);
  }

  block.txIds = txIds;
  blocks.push(block);

  return block;
}

function createBlocks(number) {
  blocks.push(new Block(
    'genesis_blk',
    0,
    '00000000000',
    Date.now,
    getRandom(NONCE)
  ));

  for (let i = 1; i <= number; ++i) {
    createBlock();
  }
}

createAccounts(2);
createBlocks(10);

module.exports = {
  blocks: () => { return blocks; },
  transactions: () => { return transactions; },
  accounts: () => { return accounts; },
  createBlock: () => { return createBlock(); }
};

// console.log(blocks);
