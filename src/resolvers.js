const { PubSub, withFilter } = require('graphql-subscriptions');
const pubsub = new PubSub();

const NEW_BLOCK_RECEIVED = "NEW_BLOCK_RECEIVED";

function confirmBlock(block, chainHeight) {
  return {
    hash: block.hash,
    height: block.height,
    pre_hash: block.pre_hash,
    nonce: block.nonce,
    confirmations: chainHeight - block.height,
    txIds: block.txIds,
    txs: block.txs
  };
}

function confirmTx(tx, chainHeight){
  return {
    blk_hash: tx.blk_hash,
    blk_height: tx.blk_height,
    hash: tx.hash,
    tx_index: tx.txIndex,
    total: tx.total,
    fees: tx.fees,
    from: tx.from,
    to: tx.to,
    confirmations: chainHeight - tx.blk_height
  };
}

const chainQuery = (root, {coin, name}, context) => {
  return {
    coin: `${coin}`,
    name: `${name}`,
    height: context.database.blocks().length,
  }
};

const blockQuery = (root, {hash, height}, context) => {
  let blk = null;
  if (hash && height) {
    blk = context.database.blocks().find((block) => block.height === height && block.hash === hash);
  } else if (hash) {
    blk = context.database.blocks().find((block) => block.hash === hash);
  } else {
    blk = context.database.blocks().find((block) => block.height === height);
  }

  return confirmBlock(blk, context.database.blocks().length);
};

const blocksQuery = (root, {first, end_cur, coin, name, since, till}, context) => {
  let blks = [];
  let count = 0;
  if (!first) first = context.database.blocks().length;

  for (let i = 0; i < context.database.blocks().length; ++i) {
    let blk = context.database.blocks()[i];
    if (count < first) {
      if (since && blk.timestamp < since) continue;
      if (till && blk.timestamp > till) continue;

      blks.push(confirmBlock(blk, context.database.blocks().length));
      ++count;
    }
  }

  return { data: blks };
};

const transactionQuery = (root, {hash}, context) => {
  return confirmTx(
    context.database.transactions().find((tx) => tx.hash === hash),
    context.database.blocks().length
  );
};

const transactionsQuery = (root, {first, end_cur, blk_hash, blk_height, address, role, min, max, since, till}, context) => {
  let txs = [];
  let count = 0;
  if (!first) {
    first = context.database.transactions().length;
  }

  for (let i = 0; i < context.database.transactions().length; ++i) {
    let tx = context.database.transactions()[i];
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

      txs.push(confirmTx(tx, context.database.blocks().length));
      ++count;
    }
  }
  return { data: txs };
};

const accountQuery = (root, {address}, context) => {
  return context.database.accounts().find((acct) => acct.address === address);
};

const resolvers = {
  Query: {
    chain: chainQuery,
    block: blockQuery,
    blocks: blocksQuery,
    transaction: transactionQuery,
    transactions: transactionsQuery,
    account: accountQuery,
  },
  Mutation: {
    createRawTransaction: (root, {coin, name, tx}, context) => {
      return {
        coin: coin,
        name: name,
        block_hash: "6099ec16761692de38f705e3e19552fd7ba834168a695a8d51e6031bd5257de0",
        block_height: 12345,
        hash: tx
      }
    },
    createBlock: (root, {coin, name}, context) => {
      let newBlk = confirmBlock(
        context.database.createBlock(),
        context.database.blocks().length
      );

      pubsub.publish(NEW_BLOCK_RECEIVED, { newBlockReceived: { Height: context.database.blocks().length }});
      return newBlk;
    }
  },
  Subscription: {
    newBlockReceived: {
      // subscribe: withFilter(
      //   () => pubsub.asyncIterator(‘messageAdded’),
      //   (payload, variables) => {
      //     return payload.channelId === variables.channelId;
      //   }
      // ),
      subscribe: () => pubsub.asyncIterator(NEW_BLOCK_RECEIVED)
    }
  },
  Chain: {
    blocks(obj, args, context) {
      return blocksQuery(obj, args, context);
    }
  },
  Block: {
    txs(obj, args, context) {
      return transactionsQuery(
        args,
        {
          first: args.first,
          end_cur: args.end_cur,
          blk_hash: null, // block hash
          blk_height: obj.height,
          address: args.address,
          role: args.role,
          min: args.min,
          max: args.max,
          since: args.since,
          till: args.till
        },
        context
      );
    }
  },
  Transaction: {
    from(obj, args, context) {
      return accountQuery(obj, { address: obj.from }, context);
    },
    to(obj, args, context) {
      return accountQuery(obj, { address: obj.to }, context);
    }
  },
  Account: {
    txs_issue(obj, args, context) {
      return transactionsQuery(
        obj,
        {
          first: args.first,
          end_cur: args.end_cur,
          blk_hash: null, // block hash
          blk_height: null,
          address: obj.address,
          role: "ISSUER",
          min: args.min,
          max: args.max,
          since: args.since,
          till: args.till
        },
        context
      );
    },
    txs_receive(obj, args, context) {
      return transactionsQuery(
        obj,
        {
          first: args.first,
          end_cur: args.end_cur,
          blk_hash: null, // block hash
          blk_height: null,
          address: obj.address,
          role: "RECEIVER",
          min: args.min,
          max: args.max,
          since: args.since,
          till: args.till
        },
        context
      );
    },
  }
}

module.exports = resolvers;
