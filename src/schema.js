const {
  makeExecutableSchema,
  addMockFunctionsToSchema,
} = require('graphql-tools');

const resolvers = require('./resolvers');

// Build a schema
const typeDefs = `
  type Chain {
    coin: String!
    name: String!
    height: Int!
    blocks(first: Int, end_cur: String, since: Int, till: Int): PagedBlocks
  }

  type Block {
    hash: String!
    height: Int!
    pre_hash: String!
    nonce: Int!
    confirmations: Int!
    txIds: [String!]
    txs(
      first: Int,
      end_cur: String,
      address: String,
      role: Role,
      min: Int,
      max: Int,
      since: Int,
      till: Int): PagedTransactions
  }

  type Transaction {
    blk_hash: String!
    blk_height: Int!
    hash: String!
    tx_index: Int!
    total: Int!
    fees: Int!
    from: Account!
    to: Account!
    confirmations: Int!
  }

  type Account {
    address: String!
    balance: Int!
    txs_issue(
      first: Int,
      end_cur: String,
      min: Int,
      max: Int,
      since: Int,
      till: Int): PagedTransactions
    txs_receive(
      first: Int,
      end_cur: String,
      min: Int,
      max: Int,
      since: Int,
      till: Int): PagedTransactions
  }

  type PageInfo {
    totalCount: Int!
    end_cur: String!
    hasNextPage: Boolean!
  }

  type PagedBlocks {
    data: [Block!]
    pageInfo: PageInfo
  }

  type PagedTransactions {
    data: [Transaction!]
    pageInfo: PageInfo
  }

  enum Role {
    ISSUER
    RECEIVER
    BOTH
  }

  type Query {
    chain(coin: String!, name: String!): Chain
    block(hash: String, height: Int): Block
    blocks(first:Int, after: String, since: Int, till: Int): PagedBlocks
    transaction(hash: String): Transaction
    transactions(
      first: Int,
      end_cur: String,
      blk_hash: String,
      blk_height: Int,
      address: String,
      role: Role,
      min: Int,
      max: Int,
      since: Int,
      till: Int): PagedTransactions
    account(address: String): Account
  }

  type Mutation {
    createRawTransaction(coin: String!, name: String!, tx: String!): Transaction
    createBlock(coin: String, name: String): Block
  }

  type Subscription {
      newBlockReceived: ChainHeight
  }

  type ChainHeight {
    Height: Int!
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });
module.exports = schema;
