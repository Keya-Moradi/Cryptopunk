# Cryptopunk
This repository contains a The Graph subgraph for the CryptoPunks Market contract on Ethereum mainnet. It defines the data sources, schema, and mapping logic used to index on-chain events into a GraphQL API.

## What this is
- A subgraph configuration targeting `0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB` (CryptoPunksMarket) on Ethereum mainnet.
- AssemblyScript mappings that process events such as Assign, Transfer, PunkBought, and others.
- A GraphQL schema describing indexed entities and tests for mapping behavior.

## Repo layout
- `liveatethglobalwaterloo/`: The Graph subgraph project (schema, mappings, tests, and deployment config).
- `abis/`: Contract ABI artifacts used by the subgraph.

## Current tech stack
- The Graph (`@graphprotocol/graph-cli`, `@graphprotocol/graph-ts`)
- AssemblyScript for mappings
- GraphQL schema
- Node.js tooling and `matchstick-as` for tests
- Docker (local Graph node stack via `docker-compose.yml`)

## Next steps for a Solana + blockchain direction
- Define the Solana use case (on-chain program, off-chain indexer, or both).
- Pick the network target (devnet/testnet/mainnet) and an RPC provider.
- Decide on a minimal project structure (e.g., `programs/`, `indexer/`, `scripts/`).
- If building a program, scaffold an Anchor workspace and add a small TypeScript client.
- If building an indexer, choose a simple ingestion path (Helius webhooks or Solana RPC) and a storage layer.

## Suggested simple stack for Solana work
- Anchor (Rust) for program development
- Solana CLI and local validator for development
- TypeScript + `@solana/web3.js` for client scripts
- RPC provider (Helius or QuickNode)
- Lightweight storage if needed (Postgres or SQLite)
