# POAP Farcaster SaaS

A production-ready Farcaster Frame v2 SaaS application for creating and managing POAP drops with customizable requirements and branding.

## Features

### For Drop Creators
- **Backoffice Dashboard**: Create and manage multiple POAP drops with unique configurations
- **Farcaster Authentication**: Secure login with Farcaster (SIWF)
- **Customizable Requirements**: Configure follow and recast requirements per drop
- **Visual Customization**: Set custom colors, logos, and messages for each drop
- **Live Preview**: See exactly how your frames will look before publishing
- **Unique URLs**: Each drop gets a unique shareable link

### For End Users
- **Dual Requirements Gate**: Configurable follow and recast requirements per drop
- **Duplicate Prevention**: PostgreSQL-powered tracking prevents multiple claims
- **Auto-Detection**: Automatically detects cast hash from Frame context
- **Verified Address Auto-Fill**: Auto-fills user's verified Ethereum address from Farcaster
- **POAP Minting**: Seamless POAP token claiming process
- **Wallet Integration**: Connect and interact with wallets using Wagmi v2
- **Frame v2 SDK**: Built with the latest Farcaster Frame v2 SDK

## Setup Instructions

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database
- POAP API credentials
- Neynar API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/poap-studio/poap-farcaster-saas.git
cd poap-farcaster-saas
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Set up environment variables**
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

4. **Set up the database**
```bash
# Create the database (if not exists)
createdb poap-farcaster-saas

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Optional: Seed with sample data
npx prisma db seed
```

5. **Run the development server**
```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

Set up the following environment variables in your `.env.local` file or deployment platform:

### Required Variables

```bash
# Database - PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database

# POAP API Configuration (Global)
POAP_CLIENT_ID=your_poap_client_id
POAP_CLIENT_SECRET=your_poap_client_secret
POAP_API_KEY=your_poap_api_key

# Neynar API Configuration
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_api_key

# Frame Configuration
NEXT_PUBLIC_URL=https://your-domain.vercel.app

# Base RPC
BASE_RPC_URL=https://mainnet.base.org

# Luma Cookie Service (for Luma integration)
WEBHOOK_SECRET=37c860512fe98aafe08b3042dc03fb28a33612df70ed79518db1119f9ebc1021
```

### Getting API Keys

- **POAP API**: Visit [POAP Studio](https://poap.studio) to create events and get API credentials
- **Neynar API**: Sign up at [Neynar](https://neynar.com) for Farcaster data access
- **PostgreSQL**: Use any PostgreSQL provider (AWS RDS, Supabase, Neon, etc.)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- POAP API account
- Neynar API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/poap-studio/poap-farcaster-saas.git
cd poap-farcaster-saas
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Set up the database:
```bash
npx prisma migrate deploy
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Creating a Drop

1. Navigate to `/admin`
2. Login with your Farcaster account
3. Click "Create New Drop"
4. Enter your POAP event details:
   - POAP Event ID
   - Secret Code
   - Custom colors and branding
   - Requirements (follow/recast)
   - Custom mint message
5. Preview your drop
6. Create and share the unique drop URL

### Managing Drops

- View all your drops in the admin dashboard
- Edit drop configurations
- Toggle drops active/inactive
- Download claim data as CSV
- Copy shareable links

## Deployment

### Vercel (Recommended)

1. Deploy to Vercel:
```bash
vercel --prod
```

2. Set environment variables in Vercel dashboard
3. Configure your PostgreSQL database connection

### Database Setup

The application uses PostgreSQL with Prisma ORM. Tables:
- `User`: Stores Farcaster user data
- `Drop`: Stores drop configurations
- `Claim`: Tracks POAP claims per drop
- `LumaDelivery`: Tracks Luma event deliveries
- `LumaCookie`: Stores Luma authentication cookies

### Luma Integration

The application includes a Luma integration for event management:

1. **Cookie Management**: The app receives Luma authentication cookies via webhook from an external service
2. **Automatic Updates**: The Luma Cookie Service (running on AWS EC2) automatically renews cookies daily
3. **Webhook Endpoint**: `/api/admin/cookie-webhook` receives cookie updates
4. **Admin Interface**: View cookie status at `/admin/luma-cookie`

To set up Luma integration:
1. Deploy the [Luma Cookie Service](https://github.com/poap-studio/luma-cookie-service) on AWS
2. Configure the webhook URL in the cookie service to point to your app
3. Ensure `WEBHOOK_SECRET` matches in both services

## API Endpoints

- `/api/auth/login` - Farcaster authentication
- `/api/drops` - CRUD operations for drops
- `/api/claim-poap` - Handles POAP minting
- `/api/poap-claim` - Checks claim status
- `/api/poap-event` - Fetches POAP event data
- `/api/download` - Exports claims as CSV

## Architecture

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Farcaster Auth Kit
- **Wallet Integration**: Wagmi v2
- **Deployment**: Optimized for Vercel

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For questions or support, please open an issue in the GitHub repository.