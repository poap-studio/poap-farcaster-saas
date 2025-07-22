import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import type { Context } from "@farcaster/frame-core";
import {
  useAccount,
  useConnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { base } from "viem/chains";
import { config } from "./providers/WagmiProvider";
import { checkIfUserFollows, getRequiredFollowUsername, verifyNeynarAPI, getUserEthAddress, checkIfUserRecasted, getRequiredRecastHash } from "~/lib/neynar";
import FollowGate from "./FollowGate";
import Image from "next/image";

const FRAME_URL = typeof window !== 'undefined' 
  ? window.location.origin
  : process.env.NEXT_PUBLIC_FRAME_URL 
    || (process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : '');

export default function POAPMinter() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [claimStatus, setClaimStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [claimError, setClaimError] = useState<string>("");
  const [context, setContext] = useState<Context.FrameContext | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [hasRecasted, setHasRecasted] = useState<boolean | null>(null);
  const [checkingFollow, setCheckingFollow] = useState(true);
  const [checkingRecast, setCheckingRecast] = useState(true);
  const [castAuthor, setCastAuthor] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  // Switch to Base chain if not already on it
  useEffect(() => {
    const switchToBase = async () => {
      if (isConnected && chainId !== base.id) {
        try {
          await switchChainAsync({ chainId: base.id });
        } catch (error) {
          console.error("Failed to switch to Base:", error);
        }
      }
    };
    switchToBase();
  }, [chainId, switchChainAsync, isConnected]);

  // Set default wallet address when connected
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
    }
  }, [address]);

  // Farcaster Mini App Integration
  useEffect(() => {
    const load = async () => {
      const frameContext = await sdk.context;
      setContext(frameContext);
      await sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  // Verify Neynar API connectivity on component mount
  useEffect(() => {
    verifyNeynarAPI();
  }, []);

  // Load user's verified ETH address from Neynar
  useEffect(() => {
    const loadUserVerifiedAddress = async () => {
      if (!context?.user?.fid) {
        return;
      }

      console.log("[POAPMinter] Loading user's verified address from Neynar...");
      
      try {
        const ethAddress = await getUserEthAddress(context.user.fid);
        if (ethAddress) {
          console.log(`[POAPMinter] Auto-filling with verified address: ${ethAddress}`);
          setWalletAddress(ethAddress);
        } else {
          console.log("[POAPMinter] No verified address found for user");
        }
      } catch (error) {
        console.error("[POAPMinter] Error loading verified address:", error);
      }
    };

    if (context && walletAddress === "") {
      loadUserVerifiedAddress();
    }
  }, [context, walletAddress]);

  // Check if user follows required account and has recasted
  useEffect(() => {
    const checkRequirements = async () => {
      console.log("[POAPMinter] Starting requirements check, context:", context);
      
      if (!context?.user) {
        console.log("[POAPMinter] No context or user found, skipping requirements check");
        setCheckingFollow(false);
        setCheckingRecast(false);
        setIsFollowing(null);
        setHasRecasted(null);
        return;
      }

      console.log(`[POAPMinter] User FID: ${context.user.fid}, checking requirements...`);
      
      try {
        // Check both follow and recast status in parallel
        // Use the cast hash from the frame context if available
        const castHash = context.location?.type === 'cast_embed' 
          ? context.location.cast.hash 
          : undefined;
        console.log(`[POAPMinter] Frame location type: ${context.location?.type}`);
        console.log(`[POAPMinter] Full location context:`, context.location);
        console.log(`[POAPMinter] Using cast hash from context: ${castHash}`);
        
        const [follows, recastResult] = await Promise.all([
          checkIfUserFollows(context.user.fid),
          checkIfUserRecasted(context.user.fid, castHash)
        ]);
        
        // Extract the author username if available
        if (recastResult && typeof recastResult === 'object' && 'author' in recastResult) {
          console.log('[POAPMinter] Setting cast author from initial check:', recastResult.author);
          setCastAuthor(recastResult.author);
        } else {
          console.log('[POAPMinter] No cast author found in initial check, recastResult:', typeof recastResult, recastResult);
        }
        
        console.log(`[POAPMinter] Follow check result: ${follows}`);
        console.log(`[POAPMinter] Recast check result: ${typeof recastResult === 'boolean' ? recastResult : recastResult.recasted}`);
        
        setIsFollowing(follows);
        setHasRecasted(typeof recastResult === 'boolean' ? recastResult : recastResult.recasted);
      } catch (error) {
        console.error("[POAPMinter] Error checking requirements:", error);
        setIsFollowing(false);
        setHasRecasted(false);
      } finally {
        setCheckingFollow(false);
        setCheckingRecast(false);
      }
    };

    if (context) {
      checkRequirements();
    }
  }, [context]);

  const shareCast = async () => {
    sdk.actions.composeCast({
      text: "Farewell Warpcast, I just minted the new POAP! Get yours too and support Farcaster choooo chooo🚂! All proceeds from mint go to @purple DAO to support RetroPGF across Farcaster. Thanks @gabo @sandiforward.eth and 👨‍💻 @samuellhuber.eth",
      embeds: [FRAME_URL],
      close: true,
    });
  };

  const mintPoap = async () => {
    if (!walletAddress) {
      setClaimError("Wallet address is required");
      return;
    }

    try {
      setClaimStatus("loading");
      // Generate a mock transaction hash for the POAP claim
      // This is just for compatibility with existing API expectations
      const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2)}`;
      
      const response = await fetch("/api/claim-poap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: walletAddress,
          txHash: mockTxHash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim POAP");
      }

      setClaimStatus("success");
    } catch (error) {
      setClaimStatus("error");
      setClaimError(error instanceof Error ? error.message : 'Failed to claim POAP');
    }
  };


  const handleShare = () => {
    shareCast();
  };

  const handleFollowComplete = async () => {
    // Recheck both follow and recast status, and load ETH address if needed
    if (context?.user) {
      setCheckingFollow(true);
      setCheckingRecast(true);
      try {
        // Use the cast hash from the frame context if available
        const castHash = context.location?.type === 'cast_embed' 
          ? context.location.cast.hash 
          : undefined;
        
        const [follows, recastResult] = await Promise.all([
          checkIfUserFollows(context.user.fid),
          checkIfUserRecasted(context.user.fid, castHash)
        ]);
        
        const recasted = typeof recastResult === 'boolean' ? recastResult : recastResult.recasted;
        console.log(`[POAPMinter] Manual recheck - Follow: ${follows}, Recast: ${recasted}`);
        setIsFollowing(follows);
        setHasRecasted(recasted);
        
        // Update cast author if available
        if (recastResult && typeof recastResult === 'object' && 'author' in recastResult) {
          console.log('[POAPMinter] Setting cast author from manual recheck:', recastResult.author);
          setCastAuthor(recastResult.author);
        } else {
          console.log('[POAPMinter] No cast author found in manual recheck, recastResult:', typeof recastResult, recastResult);
        }
        
        // Also load verified address if not already loaded
        if (walletAddress === "") {
          const ethAddress = await getUserEthAddress(context.user.fid);
          if (ethAddress) {
            console.log(`[POAPMinter] Auto-filling verified address after requirements check: ${ethAddress}`);
            setWalletAddress(ethAddress);
          }
        }
      } catch (error) {
        console.error("[POAPMinter] Error in manual recheck:", error);
        setIsFollowing(false);
        setHasRecasted(false);
      } finally {
        setCheckingFollow(false);
        setCheckingRecast(false);
      }
    }
  };

  // Show loading while checking requirements
  if (checkingFollow || checkingRecast) {
    return (
      <div className="loading-container">
        <div className="spinner-large" />
        <p>Checking requirements...</p>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
          }
          .spinner-large {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(124, 58, 237, 0.2);
            border-radius: 50%;
            border-top-color: #7c3aed;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Show requirements gate if user hasn't fulfilled requirements
  if (isFollowing === false || hasRecasted === false) {
    return (
      <FollowGate 
        username={getRequiredFollowUsername()}
        castHash={(context?.location?.type === 'cast_embed' ? context.location.cast.hash : undefined) || getRequiredRecastHash()}
        castAuthor={castAuthor}
        isFollowing={isFollowing}
        hasRecasted={hasRecasted}
        onFollowComplete={handleFollowComplete}
      />
    );
  }

  return (
    <div>
      <section id="poap" className="poap-section card">
        <h2 className="poap-title">
          <Image
            className="poap-logo"
            src="https://ethereumupgrades.com/assets/img/poap-logo.webp"
            alt="POAP Logo"
            width={40}
            height={40}
          />
          <Image
            className="poap-text"
            src="https://ethereumupgrades.com/assets/img/poap.png"
            alt="POAP Text"
            width={120}
            height={30}
          />
        </h2>
        <div className="poap-directions">
          <p>
            <strong>Click &quot;Mint POAP&quot; to claim your Farewell Warpcast POAP!</strong>
          </p>
          <ul>
            <li>
              Connect your wallet and mint your commemorative POAP token.
            </li>
            <li>
              This POAP celebrates the Farcaster community and our journey together.
            </li>
          </ul>
        </div>
        <div>
          <div className="card poap-option-card">
            <div className="poap-img-wrapper">
              <a
                href="https://poap.gallery/drops/189671"
                target="_blank"
                rel="noreferrer"
              >
                <Image
                  src="https://assets.poap.xyz/5adeb818-235d-4824-9ba5-ffb3e46c4279.png?size=large"
                  alt="POAP Artwork"
                  title="POAP Artwork"
                  className="poap-img"
                  width={300}
                  height={300}
                />
              </a>
            </div>
            <div className="poap-cost">Free Commemorative POAP</div>
            <div className="poap-details">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={() => connect({ connector: config.connectors[0] })}
                  disabled={isConnecting}
                  className={`poap-airship-button ${isConnecting ? 'loading' : ''}`}
                >
                  {isConnecting ? (
                    <div className="flex items-center gap-2">
                      <div className="spinner" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    "Connect Wallet"
                  )}
                </button>
              ) : claimStatus === "success" ? (
                <div className="flex flex-col gap-4">
                  <div className="text-center text-green-600">
                    Your POAP has been claimed successfully! Share your achievement with the Farcaster community.
                  </div>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="poap-airship-button"
                  >
                    Share on Farcaster
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder={walletAddress ? "Verified address from your Farcaster profile" : "Enter wallet address"}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={mintPoap}
                    disabled={claimStatus === "loading"}
                    className={`poap-airship-button ${claimStatus === "loading" ? 'loading' : ''}`}
                  >
                    {claimStatus === "loading" ? (
                      <div className="flex items-center gap-2">
                        <div className="spinner" />
                        <span>Minting...</span>
                      </div>
                    ) : (
                      "Mint POAP"
                    )}
                  </button>
                  {claimStatus === "error" && (
                    <div className="text-center text-red-600">
                      {claimError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          :root {
            --bg: 255, 254, 246;
            --card: #ffffff;
            --text: #966103;
            --accent-text: #b8810c;
            --accent-bg: #f8f0d3;
            --accent-border: #b8810c;
            --accent-text-hover: #dcae0e;
            --accent-bg-hover: #f6e8b4;
            --shadow: rgba(0, 0, 0, 0.05);
            --border: #dfe3ec;
            --font-main: 'Inter', 'Segoe UI', sans-serif;
          }

          body {
            font-family: var(--font-main);
            color: var(--text);
            background: rgba(255,254,246,100);
          }

          .card {
            background: var(--card);
            border: 1px solid var(--border);
            box-shadow: 0 4px 12px var(--shadow);
            padding: 24px;
            border-radius: 14px;
            margin-bottom: 30px;
          }

          .poap-section {
            max-width: 1000px;
            margin: 0 auto;
            margin-top: 2rem;
            margin-bottom: 2rem;
            background-image: linear-gradient(rgba(255, 255, 255, 0.97), rgba(255, 255, 255, 0.97)), url(https://ethereumupgrades.com/assets/img/poap-bg.svg);
            background-repeat: no-repeat;
            background-position: center;
            background-size: cover;
            color: #473e6b;
          }

          .poap-title {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .poap-logo {
            height: 40px;
          }

          .poap-text {
            height: 30px;
          }

          .poap-directions {
            margin-bottom: 2rem;
          }

          .poap-directions ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin-top: 1rem;
          }

          .poap-directions li {
            margin: 10px 0;
          }

          a {
            color: var(--accent-text);
            font-weight: 500;
            text-decoration: none;
          }

          a:hover {
            color: var(--accent-text-hover);
            text-decoration: none;
          }

          .ethstaker-link {
            color: #6d62df;
            text-decoration: none;
          }

          .ethstaker-link:hover {
            color: #8579ff;
            text-decoration: underline;
          }

          .poap-options {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            align-items: stretch;
            gap: 25px;
            margin-bottom: 2rem;
          }

          .poap-option-card {
            flex: 1;
            min-width: 280px;
            max-width: 450px;
            border: 1px solid #473e6b !important;
            border-radius: 32px !important;
            box-shadow: -6px 8px #ecebff !important;
            padding: 16px;
            transition: all 0.3s ease !important;
            background: var(--card);
          }

          .poap-option-card:hover {
            box-shadow: -12px 14px #ecebff !important;
            transform: translate(6px, -6px);
          }

          .poap-img-wrapper {
            border: 1px solid #eac9f8;
            border-radius: 24px;
            padding: 16px;
            background: #f5f4ff;
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            margin-bottom: 1rem;
          }

          .poap-img-wrapper a {
            text-decoration: none !important;
          }

          .poap-img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            transition: transform 0.2s ease;
          }

          .poap-img:hover {
            transform: scale(1.05);
          }

          .poap-cost {
            font-size: 1.1rem;
            font-weight: 500;
            margin: 1rem 0;
            color: #473e6b;
            text-align: center;
          }

          .poap-details {
            text-align: center;
          }

          .poap-airship-button {
            background: #7c3aed;
            color: white;
            padding: 0.75rem 2rem;
            border-radius: 50px;
            text-decoration: none !important;
            font-weight: 500;
            transition: all 0.2s ease;
            display: inline-block;
            border: none;
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }

          .poap-airship-button.loading {
            background: linear-gradient(
              90deg,
              #7c3aed,
              #6d28d9,
              #5b21b6,
              #6d28d9,
              #7c3aed
            );
            background-size: 200% auto;
            animation: shine 2s linear infinite;
          }

          .poap-airship-button:hover {
            background: #6d28d9;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            color: white;
            text-decoration: none;
          }

          .poap-airship-button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            box-shadow: none;
          }

          .poap-airship-button:disabled.loading {
            background: linear-gradient(
              90deg,
              #9ca3af,
              #6b7280,
              #4b5563,
              #6b7280,
              #9ca3af
            );
            background-size: 200% auto;
            animation: shine 2s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes shine {
            from {
              background-position: 200% center;
            }
          }

          .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
          }

          .poap-sponsor {
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border);
          }

          .poap-sponsor-img {
            margin-top: 1rem;
            margin-left: auto;
            margin-right: auto;
            display: block;
            max-width: 200px;
          }

          @media screen and (min-width: 768px) {
            .poap-img {
              width: 120px;
              height: 120px;
            }

            .poap-img-wrapper {
              padding: 16px 24px;
            }
          }

          @media screen and (max-width: 767px) {
            .poap-section {
              margin: 1rem;
            }

            .poap-options {
              gap: 16px;
            }

            .poap-option-card {
              width: 100%;
            }

            .poap-img-wrapper {
              gap: 0.75rem;
            }

            .poap-img-wrapper a:not(:first-child) {
              margin-top: 0;
            }
          }
        `}</style>
      </section>
    </div>
  );
}
