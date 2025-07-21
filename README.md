# POAP Farcaster Minter

A production-ready Farcaster Frame v2 application for minting POAP tokens with follow-gate functionality.

## Features

- **Follow Gate Integration**: Users must follow a specified Farcaster account before minting
- **POAP Minting**: Seamless POAP token claiming process
- **Wallet Integration**: Connect and interact with users' wallets
- **Frame v2 SDK**: Built with the latest Farcaster Frame v2 SDK
- **Production Ready**: Optimized for deployment on Vercel

## Environment Variables

Set up the following environment variables in your `.env.local` file or deployment platform:

```bash
# POAP API Configuration
POAP_CLIENT_ID=your_poap_client_id
POAP_CLIENT_SECRET=your_poap_client_secret
POAP_API_KEY=your_poap_api_key
POAP_EVENT_ID=your_event_id
POAP_SECRET_CODE=your_secret_code

# Frame Configuration
NEXT_PUBLIC_FRAME_URL=https://your-domain.vercel.app

# Neynar API Configuration (for follow checking)
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_api_key

# Follow Gate Configuration
NEXT_PUBLIC_REQUIRED_FOLLOW_USERNAME=username_to_follow

# Development mode (optional)
NEXT_PUBLIC_DEBUG_FOLLOW=true  # Bypass follow check in development
```

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