export default function EnvCheckPage() {
  const envVars = {
    BASE_RPC_URL: process.env.BASE_RPC_URL || 'NOT SET',
    NEXT_PUBLIC_INFURA_PROJECT_ID: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID || 'NOT SET',
    NEXT_PUBLIC_FRAME_URL: process.env.NEXT_PUBLIC_FRAME_URL || 'NOT SET',
    NEXT_PUBLIC_NEYNAR_API_KEY: process.env.NEXT_PUBLIC_NEYNAR_API_KEY ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Check</h1>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
      <p>Note: Only NEXT_PUBLIC_ variables are available in the browser</p>
    </div>
  );
}