# Dashxboard — @dashxboard/bot

From ideas to actions. The unofficial platform designed for the **Stronghold (SHx)** community.

**[Website](https://dashxboard.com)** • **[Discord](https://discord.gg/eJhzDbKbdj)** • **[GitHub](https://github.com/dashxboard)**

## Overview

**@dashxboard/bot** is the Discord bot that handles interactions between users and proposals for the **Dashxboard** platform. Its features include:

- **Proposal Management**: Automated handling of forum threads with support for creation, locking, and concluding proposals.
- **Reputation System**: Points-based system that rewards community participation.
- **Vouching System**: Allows users to temporarily sponsor others.
- **Community and Moderation Commands**: Offers commands for community engagement and moderation, like upvoting, checking points, reporting issues, and more.
- **Privacy Control**: Respects user privacy with opt-out options for public display of Discord information.

## Getting Started

### Prerequisites

- **Node.js** 18 or higher.
- **GitHub PAT** with `read: packages` scope.
- **PostgreSQL** database.
- **Discord Bot Token** and **Application ID** (see [Discord Developers Documentation](https://discord.com/developers/docs/intro)).
- Environment variables (see `.env.example`).

### Installation

1. Clone the repository:

```sh
git clone https://github.com/dashxboard/dashxboard-bot.git
```

2. Install dependencies:

```sh
cd dashxboard-bot

npm install
```

3. Set up environment variables:

```sh
cp .env
# Fill in your environment variables
```

## Scripts

- `npm run build` — Compiles the package.
- `npm run dev` — Runs the bot in development mode.
- `npm run register` — Register commands with Discord.
- `npm run dev:register` — Watch command registration changes in development mode.

## Contributing

Dashxboard is open-source, and contributions are welcome! You can help by:

- Submitting pull requests (_for minor changes._)
- Reporting bugs or suggesting features (_for major changes_).
- Enhancing the documentation.
- Engaging with the community on Discord.

## License

This project is licensed under the [MIT license](https://choosealicense.com/licenses/mit/).
