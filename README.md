# POAP Farcaster Minter

A production-ready Farcaster Frame v2 application for minting POAP tokens with follow-gate functionality.

## Features

- **Dual Requirements Gate**: Users must both follow a specified Farcaster account AND recast the original cast before minting
- **Auto-Detection**: Automatically detects the cast hash from Frame context for recast verification
- **Verified Address Auto-Fill**: Automatically fills wallet address with user's verified Ethereum address from their Farcaster profile
- **POAP Minting**: Seamless POAP token claiming process with production-ready API integration
- **Wallet Integration**: Connect and interact with users' wallets using Wagmi v2
- **Frame v2 SDK**: Built with the latest Farcaster Frame v2 SDK and optimized for mini-apps
- **Real-time Verification**: Live checking of follow and recast status with manual refresh capability
- **Production Ready**: Fully optimized for deployment on Vercel with proper caching controls

## Environment Variables

Set up the following environment variables in your `.env.local` file or deployment platform:

### Required Variables

```bash
# POAP API Configuration
POAP_CLIENT_ID=your_poap_client_id                    # POAP API client ID from your POAP developer account
POAP_CLIENT_SECRET=your_poap_client_secret            # POAP API client secret for authentication
POAP_API_KEY=your_poap_api_key                        # POAP API key for accessing POAP services
POAP_EVENT_ID=12345                                   # The specific POAP event ID for your event
POAP_SECRET_CODE=your_secret_code                     # Secret code required for POAP claiming

# Neynar API Configuration
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_api_key        # Neynar API key for Farcaster follow verification and cast data

# Follow Gate Configuration
NEXT_PUBLIC_REQUIRED_FOLLOW_USERNAME=username         # Farcaster username that users must follow to mint (without @)

# Frame Configuration
NEXT_PUBLIC_FRAME_URL=https://your-domain.vercel.app  # Your deployed frame URL (auto-detected if not set)
```

### Optional Variables

```bash
# Recast Requirement (optional - auto-detects from frame context if not set)
NEXT_PUBLIC_REQUIRED_RECAST_HASH=0xabc123...          # Specific cast hash that users must recast

# Development/Debug mode (optional)
NEXT_PUBLIC_DEBUG_FOLLOW=true                         # Bypass follow check in development mode
NODE_ENV=development                                   # Environment mode (development/production)
```

### Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `POAP_CLIENT_ID` | ✅ | Your POAP API client ID obtained from the POAP developer portal |
| `POAP_CLIENT_SECRET` | ✅ | Your POAP API client secret for secure authentication |
| `POAP_API_KEY` | ✅ | API key for accessing POAP services and minting tokens |
| `POAP_EVENT_ID` | ✅ | The unique identifier for your POAP event (numeric) |
| `POAP_SECRET_CODE` | ✅ | Secret code that validates POAP claims for your event |
| `NEXT_PUBLIC_NEYNAR_API_KEY` | ✅ | API key from Neynar for Farcaster data access and follow verification |
| `NEXT_PUBLIC_REQUIRED_FOLLOW_USERNAME` | ✅ | Farcaster username (without @) that users must follow |
| `NEXT_PUBLIC_FRAME_URL` | ⚠️ | Your deployed frame URL. Auto-detects from Vercel if not provided |
| `NEXT_PUBLIC_REQUIRED_RECAST_HASH` | ❌ | Specific cast hash to require recast. Auto-detects from frame context if not set |
| `NEXT_PUBLIC_DEBUG_FOLLOW` | ❌ | Set to `true` to bypass follow requirements in development |

### Getting API Keys

- **POAP API**: Visit [POAP Studio](https://poap.studio) or [POAP Developer Portal](https://poap.tech/developers) to create an event and get API credentials
- **Neynar API**: Sign up at [Neynar](https://neynar.com) to get your API key for Farcaster data access

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A POAP API account with event setup
- A Neynar API key for follow verification

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/poap-farcaster-minter.git
cd poap-farcaster-minter
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel (Recommended)

1. Deploy to Vercel:
```bash
vercel --prod
```

2. Set environment variables in the Vercel dashboard
3. Redeploy if needed after setting variables

### Frame Configuration

Add your deployed URL as a Frame in the Farcaster ecosystem by configuring your frame metadata.

## API Endpoints

- `/api/claim-poap` - Handles POAP minting requests
- `/api/refresh-token` - Manages POAP API token refresh

## Architecture

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom components
- **Wallet Integration**: Wagmi v2 with Farcaster Frame Connector
- **Follow Verification**: Neynar API integration
- **Deployment**: Optimized for Vercel with serverless functions

## Development

### Testing Follow Gate

To test the application without requiring actual follows:

1. Set `NEXT_PUBLIC_DEBUG_FOLLOW=true` in your environment
2. The follow gate will be bypassed in development mode

### Debugging

The application includes comprehensive logging:
- `[POAPMinter]` - Main component logs
- `[Follow Check]` - Follow verification logs
- `[Neynar API]` - API connectivity logs

Open browser developer tools to view console logs for debugging.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or support, please open an issue in the GitHub repository.