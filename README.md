# AgentProof – AI-Powered Web3 Risk Intelligence on Hedera

**Live Demo:** https://agentproof-eta.vercel.app  
**Track:** AI & Agents (Hedera Hello Future Apex Hackathon 2026)

## Overview

AgentProof is an autonomous AI agent that analyzes Web3 project descriptions (tokenomics, team, smart contracts, etc.), generates structured security & risk reports using Groq's Llama 3.1 model, computes a SHA-256 hash of the report, and anchors it immutably on **Hedera Consensus Service** (HCS) for transparent, verifiable proof.

This demonstrates AI-driven agents that think, decide, and transact on-chain with Hedera's fast, low-cost microtransactions — aligning perfectly with the **AI & Agents** theme.

## Features

- Natural language input → structured risk report (Low/Medium/High rating + confidence %)
- On-chain immutability via Hedera Topic Message (hash anchoring)
- Dashboard with scan history & risk distribution chart
- Deployed on Vercel for instant access

## Tech Stack

- **AI**: Groq SDK (Llama-3.1-8b-instant)
- **Hedera**: @hashgraph/sdk (Consensus Service – TopicMessageSubmitTransaction)
- **Backend**: Node.js + Express
- **Frontend**: HTML/CSS/JS (minimal, responsive)
- **Deployment**: Vercel
- **Other**: crypto (SHA-256), Chart.js (dashboard)

## How to Run Locally

1. Clone the repo
   ```bash
   git clone https://github.com/Nerocodeit/Hedera-agentproof.git
   cd Hedera-agentproof
   
2. Install dependencies
   npm install

3.Create .env from .env.example and fill in your keys
   GROQ_API_KEY=...
   HEDERA_ACCOUNT_ID=...
   HEDERA_PRIVATE_KEY=...
   HEDERA_TOPIC_ID=...
   
4. Start the server
   node app.js

5. Open http://localhost:3000

## Demo / Test Input Example

Use this real-world-style input to see a  report in action:
Project Name: MoonYield
Type: DeFi staking platform
Blockchain: Ethereum
Anonymous team
Promising 40% APY
No public audit

Hackathon Relevance

Uses Hedera Consensus Service for low-cost, high-throughput immutable anchoring
Builds an autonomous AI agent that analyzes, decides risk level, and transacts on-chain
Potential to extend with Hedera Agent Kit, multi-agent collaboration, or Bonzo vault risk assessment (bounty alignment)

Future Roadmap

Integrate Hedera Agent Kit for more agentic behavior
Add multi-turn chat for iterative analysis
Support mainnet + HTS for premium features
Community voting on risk reports via Hedera

Built for Hedera Hello Future Apex Hackathon 2026 by Sagoe (@Nerocodeit)
