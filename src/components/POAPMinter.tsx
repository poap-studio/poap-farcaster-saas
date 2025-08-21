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
import { resolveAddressOrENS } from "~/lib/ens";
import { isSpamUser, isSpamValidationEnabled } from "~/lib/spam-validation";
import FollowGate from "./FollowGate";
import POAPSuccess from "./POAPSuccess";
import { getCurrentDrop, getDropConfig } from "~/lib/drop-data";


interface POAPMinterProps {
  initialDrop?: {
    id: string;
    slug: string;
    poapEventId: string;
    buttonColor: string;
    backgroundColor: string;
    logoUrl?: string;
    mintMessage: string;
    requireFollow: boolean;
    followUsername?: string;
    requireRecast: boolean;
  };
}

export default function POAPMinter({ initialDrop }: POAPMinterProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userHasModifiedAddress, setUserHasModifiedAddress] = useState<boolean>(false);
  const [claimStatus, setClaimStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [claimError, setClaimError] = useState<string>("");
  const [context, setContext] = useState<Context.FrameContext | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [hasRecasted, setHasRecasted] = useState<boolean | null>(null);
  const [checkingFollow, setCheckingFollow] = useState(true);
  const [checkingRecast, setCheckingRecast] = useState(true);
  const [castAuthor, setCastAuthor] = useState<string | null>(null);
  const [hasAlreadyClaimed, setHasAlreadyClaimed] = useState<boolean | null>(null);
  const [checkingClaim, setCheckingClaim] = useState(true);
  const [poapEventData, setPoapEventData] = useState<{name: string, image_url: string} | null>(null);
  const [isLoadingPoapData, setIsLoadingPoapData] = useState(true);
  const [showMintingScreen, setShowMintingScreen] = useState(false);
  const [savedMintingAddress, setSavedMintingAddress] = useState<string>("");
  const [isResolvingENS, setIsResolvingENS] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string>("");
  const [ensError, setEnsError] = useState<string>("");
  
  // Get drop configuration - use initialDrop if provided, otherwise get from context
  const drop = initialDrop || getCurrentDrop();
  const dropConfig = drop ? {
    buttonColor: drop.buttonColor,
    backgroundColor: drop.backgroundColor,
    logoUrl: drop.logoUrl,
    mintMessage: drop.mintMessage,
    disclaimerMessage: drop.disclaimerMessage,
    requireFollow: drop.requireFollow,
    followUsername: drop.followUsername,
    requireRecast: drop.requireRecast
  } : getDropConfig();

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

  // Set default wallet address when connected (only if not manually changed)
  useEffect(() => {
    if (address && walletAddress === "" && !userHasModifiedAddress) {
      setWalletAddress(address);
    }
  }, [address, walletAddress, userHasModifiedAddress]);

  // Fetch POAP event data
  useEffect(() => {
    const fetchPoapEventData = async () => {
      try {
        setIsLoadingPoapData(true);
        const url = drop?.id ? `/api/poap-event?dropId=${drop.id}` : '/api/poap-event';
        console.log('[POAPMinter] Fetching POAP event data from:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[POAPMinter] POAP event data received:', data);
          // Verify image URL is valid
          if (data.image_url) {
            console.log('[POAPMinter] Testing image URL:', data.image_url);
            // Preload image to check if it's accessible
            const img = new Image();
            img.onload = () => console.log('[POAPMinter] Image preloaded successfully');
            img.onerror = () => console.error('[POAPMinter] Image preload failed');
            img.src = data.image_url;
          }
          setPoapEventData(data);
        } else {
          console.error('[POAPMinter] Error fetching POAP event data:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('[POAPMinter] Error response:', errorText);
          setPoapEventData(null);
        }
      } catch (error) {
        console.error('[POAPMinter] Error fetching POAP event data:', error);
        setPoapEventData(null);
      } finally {
        setIsLoadingPoapData(false);
      }
    };

    fetchPoapEventData();
  }, [drop]);

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

  // Resolve ENS names in real-time as user types
  useEffect(() => {
    const resolveENSDebounced = async () => {
      if (!walletAddress || !userHasModifiedAddress) {
        setResolvedAddress("");
        setEnsError("");
        return;
      }

      // Only try to resolve if it looks like an ENS name
      if (walletAddress.includes('.') && walletAddress.length > 4) {
        setIsResolvingENS(true);
        setEnsError("");
        
        try {
          const resolution = await resolveAddressOrENS(walletAddress);
          
          if (resolution.isENS) {
            if (resolution.address) {
              setResolvedAddress(resolution.address);
              setEnsError("");
            } else {
              setResolvedAddress("");
              setEnsError("ENS name could not be resolved");
            }
          } else {
            setResolvedAddress("");
            setEnsError("");
          }
        } catch (error) {
          console.error('Error resolving ENS:', error);
          setResolvedAddress("");
          setEnsError("Error resolving ENS name");
        } finally {
          setIsResolvingENS(false);
        }
      } else {
        setResolvedAddress("");
        setEnsError("");
      }
    };

    // Debounce ENS resolution to avoid too many requests
    const timeoutId = setTimeout(resolveENSDebounced, 500);
    return () => clearTimeout(timeoutId);
  }, [walletAddress, userHasModifiedAddress]);

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

    if (context && walletAddress === "" && !userHasModifiedAddress) {
      loadUserVerifiedAddress();
    }
  }, [context, walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if user follows required account, has recasted, and hasn't already claimed
  useEffect(() => {
    const checkRequirements = async () => {
      console.log("[POAPMinter] Starting requirements check, context:", context);
      
      if (!context?.user) {
        console.log("[POAPMinter] No context or user found, skipping requirements check");
        setCheckingFollow(false);
        setCheckingRecast(false);
        setCheckingClaim(false);
        setIsFollowing(null);
        setHasRecasted(null);
        setHasAlreadyClaimed(null);
        return;
      }

      console.log(`[POAPMinter] User FID: ${context.user.fid}, checking requirements...`);
      
      try {
        // Check follow, recast, and claim status in parallel
        // Use the cast hash from the frame context if available
        const castHash = context.location?.type === 'cast_embed' 
          ? context.location.cast.hash 
          : undefined;
        
        const [follows, recastResult, claimResponse] = await Promise.all([
          dropConfig.requireFollow 
            ? checkIfUserFollows(context.user.fid, dropConfig.followUsername || getRequiredFollowUsername())
            : Promise.resolve(true),
          dropConfig.requireRecast
            ? checkIfUserRecasted(context.user.fid, castHash)
            : Promise.resolve(true),
          fetch("/api/poap-claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fid: context.user.fid, dropId: drop?.id })
          })
        ]);
        
        // Extract the author username if available
        if (recastResult && typeof recastResult === 'object' && 'author' in recastResult) {
          setCastAuthor(recastResult.author);
        }
        
        // Process claim check response
        let hasClaimedThisEvent = false;
        let savedAddress = '';
        if (claimResponse.ok) {
          const claimData = await claimResponse.json();
          hasClaimedThisEvent = claimData.claimed;
          savedAddress = claimData.address || '';
        } else {
          console.error("[POAPMinter] Error checking claim status:", await claimResponse.text());
        }
        
        // Set the saved address if user has already claimed and hasn't manually changed address
        if (hasClaimedThisEvent && savedAddress) {
          setSavedMintingAddress(savedAddress);
          if (!userHasModifiedAddress) {
            setWalletAddress(savedAddress);
          }
        }
        
        console.log(`[POAPMinter] Follow check result: ${follows}`);
        console.log(`[POAPMinter] Recast check result: ${typeof recastResult === 'boolean' ? recastResult : recastResult.recasted}`);
        console.log(`[POAPMinter] Already claimed check result: ${hasClaimedThisEvent}`);
        
        setIsFollowing(follows);
        setHasRecasted(typeof recastResult === 'boolean' ? recastResult : recastResult.recasted);
        setHasAlreadyClaimed(hasClaimedThisEvent);
      } catch (error) {
        console.error("[POAPMinter] Error checking requirements:", error);
        setIsFollowing(false);
        setHasRecasted(false);
        setHasAlreadyClaimed(false);
      } finally {
        setCheckingFollow(false);
        setCheckingRecast(false);
        setCheckingClaim(false);
      }
    };

    if (context) {
      checkRequirements();
    }
  }, [context, drop?.id, dropConfig.followUsername, dropConfig.requireFollow, dropConfig.requireRecast, userHasModifiedAddress]);


  const mintPoap = async () => {
    if (!walletAddress) {
      setClaimError("Wallet address is required");
      return;
    }

    if (!context?.user?.fid) {
      setClaimError("Farcaster user information is required");
      return;
    }

    try {
      setClaimStatus("loading");
      setClaimError("");
      
      // Check if user is marked as spam (if validation is enabled)
      console.log(`[POAPMinter] Spam validation enabled: ${isSpamValidationEnabled()}`);
      console.log(`[POAPMinter] Checking spam status for FID: ${context.user.fid}`);
      const userIsSpam = await isSpamUser(context.user.fid);
      
      if (userIsSpam) {
        setClaimStatus("error");
        setClaimError("It looks like your user is SPAM");
        return;
      }
      
      // Resolve ENS name to address if needed
      console.log(`[POAPMinter] Resolving wallet address: ${walletAddress}`);
      const resolution = await resolveAddressOrENS(walletAddress);
      
      if (!resolution.address) {
        setClaimStatus("error");
        if (resolution.isENS) {
          setClaimError(`Could not resolve ENS name: ${resolution.original}`);
        } else {
          setClaimError("Invalid wallet address or ENS name");
        }
        return;
      }
      
      const finalAddress = resolution.address;
      console.log(`[POAPMinter] Using final address: ${finalAddress} (original: ${resolution.original}, isENS: ${resolution.isENS})`);
      
      // Generate a mock transaction hash for the POAP claim
      // This is just for compatibility with existing API expectations
      const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2)}`;
      
      const response = await fetch("/api/claim-poap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: finalAddress,
          txHash: mockTxHash,
          fid: context.user.fid,
          dropId: drop?.id,
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



  const handleFollowComplete = async () => {
    // Recheck follow, recast, and claim status, and load ETH address if needed
    if (context?.user) {
      setCheckingFollow(true);
      setCheckingRecast(true);
      setCheckingClaim(true);
      try {
        // Use the cast hash from the frame context if available
        const castHash = context.location?.type === 'cast_embed' 
          ? context.location.cast.hash 
          : undefined;
        
        const [follows, recastResult, claimResponse] = await Promise.all([
          dropConfig.requireFollow 
            ? checkIfUserFollows(context.user.fid, dropConfig.followUsername || getRequiredFollowUsername())
            : Promise.resolve(true),
          dropConfig.requireRecast
            ? checkIfUserRecasted(context.user.fid, castHash)
            : Promise.resolve(true),
          fetch("/api/poap-claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fid: context.user.fid, dropId: drop?.id })
          })
        ]);
        
        const recasted = typeof recastResult === 'boolean' ? recastResult : recastResult.recasted;
        
        // Process claim check response
        let hasClaimedThisEvent = false;
        let savedAddress = '';
        if (claimResponse.ok) {
          const claimData = await claimResponse.json();
          hasClaimedThisEvent = claimData.claimed;
          savedAddress = claimData.address || '';
        }
        
        // Set the saved address if user has already claimed and hasn't manually changed address
        if (hasClaimedThisEvent && savedAddress) {
          setSavedMintingAddress(savedAddress);
          if (!userHasModifiedAddress) {
            setWalletAddress(savedAddress);
          }
        }
        
        console.log(`[POAPMinter] Manual recheck - Follow: ${follows}, Recast: ${recasted}, Claimed: ${hasClaimedThisEvent}`);
        setIsFollowing(follows);
        setHasRecasted(recasted);
        setHasAlreadyClaimed(hasClaimedThisEvent);
        
        // Update cast author if available
        if (recastResult && typeof recastResult === 'object' && 'author' in recastResult) {
          setCastAuthor(recastResult.author);
        }
        
        // Also load verified address if not already loaded and user hasn't modified it
        if (walletAddress === "" && !userHasModifiedAddress) {
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
        setHasAlreadyClaimed(false);
      } finally {
        setCheckingFollow(false);
        setCheckingRecast(false);
        setCheckingClaim(false);
      }
    }
  };

  const handleClaimPoapClick = () => {
    // Navigate to minting screen when user clicks "Claim POAP" from FollowGate
    setShowMintingScreen(true);
  };

  // Show loading while checking requirements
  if (checkingFollow || checkingRecast || checkingClaim) {
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

  // Show success page if user has already claimed this POAP event
  if (hasAlreadyClaimed === true) {
    return (
      <POAPSuccess 
        walletAddress={savedMintingAddress || walletAddress}
      />
    );
  }

  // Show FollowGate unless user has clicked "Claim POAP" to proceed to minting
  if (!showMintingScreen) {
    return (
      <FollowGate 
        username={dropConfig.followUsername || getRequiredFollowUsername()}
        castHash={(context?.location?.type === 'cast_embed' ? context.location.cast.hash : undefined) || getRequiredRecastHash()}
        castAuthor={castAuthor}
        isFollowing={isFollowing}
        hasRecasted={hasRecasted}
        requireFollow={dropConfig.requireFollow}
        requireRecast={dropConfig.requireRecast}
        onFollowComplete={handleFollowComplete}
        onClaimPoapClick={handleClaimPoapClick}
      />
    );
  }

  // Show success page if POAP was just minted successfully
  if (claimStatus === "success") {
    return (
      <POAPSuccess 
        walletAddress={walletAddress}
      />
    );
  }

  return (
    <div className="poap-minter-container">
      <div className="frame-container">
        <div className="white-text-horizontal">
          {drop?.logoUrl ? (
            <img src={drop.logoUrl} alt="" style={{ width: 'auto', height: 'auto', maxHeight: '48px' }} />
          ) : (
            <img src="/logo.svg" alt="" style={{ width: 'auto', height: 'auto', maxHeight: '48px' }} />
          )}
        </div>
        <div className="card">
          <div className="header">
            <div className="get-your-poap">
              Get your<br />{poapEventData?.name || 'POAP'}
            </div>
            <div className="poap-image-container">
              {isLoadingPoapData ? (
                <div className="poap-image-skeleton">
                  <div className="skeleton-pulse"></div>
                </div>
              ) : poapEventData?.image_url ? (
                <img 
                  className="poap-image" 
                  src={`/api/proxy-image?url=${encodeURIComponent(poapEventData.image_url)}`} 
                  alt="POAP"
                  onError={(e) => {
                    console.error('[POAPMinter] POAP image failed to load:', poapEventData.image_url);
                    // Fallback to direct URL if proxy fails
                    const img = e.target as HTMLImageElement;
                    if (!img.src.includes(poapEventData.image_url)) {
                      console.log('[POAPMinter] Trying direct URL...');
                      img.src = poapEventData.image_url;
                    } else {
                      setPoapEventData({ ...poapEventData, image_url: '' });
                    }
                  }}
                />
              ) : (
                <div className="poap-image-error">
                  <div className="error-icon">⚠️</div>
                  <div className="error-text">Unable to load POAP image</div>
                </div>
              )}
            </div>
          </div>
          <div className="body">
            <div className="content">
              <div className="text">
                <div className="title">
                  <div className="mint-title">Mint Your POAP</div>
                </div>
                <div className="mint-description">
                  {dropConfig.mintMessage}
                </div>
              </div>
              <div className="mint-form">
                <div className="form-field">
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => {
                      setWalletAddress(e.target.value);
                      setUserHasModifiedAddress(true);
                    }}
                    placeholder={walletAddress ? "Verified address from your Farcaster profile" : "Enter wallet address or ENS name (e.g., vitalik.eth)"}
                    className="wallet-input"
                    disabled={claimStatus === "loading"}
                  />
                </div>
                
                {/* ENS Resolution Status */}
                {isResolvingENS && (
                  <div className="ens-status resolving">
                    <div className="spinner-small" />
                    <span>Resolving ENS name...</span>
                  </div>
                )}
                
                {resolvedAddress && (
                  <div className="ens-status resolved">
                    <span className="resolved-address">{resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}</span>
                  </div>
                )}
                
                {ensError && (
                  <div className="ens-status error">
                    <span>{ensError}</span>
                  </div>
                )}
                
                {claimStatus === "error" && (
                  <div className="error-message">
                    {claimError}
                  </div>
                )}
              </div>
            </div>
            <div className="cta">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={() => connect({ connector: config.connectors[0] })}
                  disabled={isConnecting}
                  className={`mint-button ${isConnecting ? 'loading' : ''}`}
                >
                  {isConnecting ? (
                    <>
                      <div className="spinner" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    "Connect Wallet"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={mintPoap}
                  disabled={claimStatus === "loading" || !walletAddress}
                  className={`mint-button ${claimStatus === "loading" ? 'loading' : ''}`}
                >
                  {claimStatus === "loading" ? (
                    <>
                      <div className="spinner" />
                      <span>Minting...</span>
                    </>
                  ) : (
                    "Mint POAP"
                  )}
                </button>
              )}
              <div className="mint-note">
                {dropConfig.disclaimerMessage}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @font-face {
          font-family: 'Unica77LlTt';
          src: url('/fonts/Unica77LLWeb-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
        }

        @font-face {
          font-family: 'Unica77LlTt';
          src: url('/fonts/Unica77LLWeb-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          border: none;
          text-decoration: none;
          background: none;
          -webkit-font-smoothing: antialiased;
        }

        html, body {
          overflow-x: hidden;
          width: 100%;
          max-width: 100vw;
        }
        
        * {
          max-width: 100%;
        }

        .poap-minter-container {
          width: 100%;
          max-width: 390px;
          min-height: 100vh;
          background: var(--drop-background-color, ${dropConfig.backgroundColor});
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow-y: auto;
          overflow-x: hidden;
          position: relative;
          font-family: 'Unica77LlTt', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0 auto;
          padding: 20px 0 40px 0;
        }

        .frame-container {
          width: 100%;
          max-width: 342px;
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
          justify-content: flex-start;
          margin-top: auto;
          margin-bottom: auto;
          box-sizing: border-box;
        }

        .white-text-horizontal {
          flex-shrink: 0;
          width: 100%;
          height: 51px;
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .group {
          width: 22.56%;
          height: 100%;
          position: absolute;
          right: 77.44%;
          left: 0%;
          bottom: 0%;
          top: 0%;
        }

        .group2 {
          width: 71.96%;
          height: 25.71%;
          position: absolute;
          right: -0.03%;
          left: 28.06%;
          bottom: 37.14%;
          top: 37.14%;
        }

        .card {
          background: #000000;
          border-radius: 12px;
          padding: 24px 16px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 32px;
          margin-bottom: 20px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .get-your-poap {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.2;
          text-align: center;
        }

        .poap-image-container {
          width: 100%;
          max-width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .poap-image {
          width: 100%;
          max-width: 200px;
          height: 200px;
          border-radius: 50%;
          object-fit: cover;
        }

        .poap-image-skeleton {
          width: 100%;
          max-width: 200px;
          height: 200px;
          border-radius: 50%;
          background: #1a1c1d;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .skeleton-pulse {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          animation: skeleton-loading 1.5s infinite;
        }

        .poap-image-error {
          width: 100%;
          max-width: 200px;
          height: 200px;
          border-radius: 50%;
          background: #1a1c1d;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .error-icon {
          font-size: 32px;
        }

        .error-text {
          color: #c6c6c6;
          font-size: 12px;
          text-align: center;
          font-weight: 400;
        }

        @keyframes skeleton-loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        /* Iframe specific adjustments */
        @media (max-height: 700px) {
          .poap-minter-container {
            align-items: flex-start;
            padding: 10px 0 30px 0;
          }
          
          .frame-container {
            gap: 16px;
          }
          
          .card {
            gap: 20px;
            padding: 20px 16px;
          }
          
          .poap-image-container {
            width: 160px;
            height: 160px;
          }
          
          .poap-image,
          .poap-image-skeleton,
          .poap-image-error {
            width: 160px;
            height: 160px;
          }
        }

        .body {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .title {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mint-title {
          color: #ffffff;
          font-size: 20px;
          font-weight: 700;
        }

        .mint-description {
          color: #c6c6c6;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.5;
          text-align: center;
        }

        .mint-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-field {
          background: #1a1c1d;
          border-radius: 8px;
          padding: 12px;
        }

        .wallet-input {
          width: 100%;
          background: transparent;
          color: #ffffff;
          font-size: 15px;
          font-weight: 400;
          border: none;
          outline: none;
          font-family: inherit;
        }

        .wallet-input::placeholder {
          color: #c6c6c6;
          opacity: 1;
        }

        .wallet-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          color: #ff6b6b;
          font-size: 14px;
          font-weight: 400;
          text-align: center;
          padding: 8px;
          background: rgba(255, 107, 107, 0.1);
          border-radius: 6px;
          border: 1px solid rgba(255, 107, 107, 0.2);
        }

        .ens-status {
          font-size: 13px;
          padding: 6px 8px;
          border-radius: 4px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ens-status.resolving {
          background: rgba(255, 255, 255, 0.05);
          color: #c6c6c6;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ens-status.resolved {
          background: rgba(202, 242, 191, 0.1);
          color: #CAF2BF;
          border: 1px solid rgba(202, 242, 191, 0.2);
          justify-content: center;
        }

        .ens-status.error {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
          border: 1px solid rgba(255, 107, 107, 0.2);
        }

        .spinner-small {
          width: 12px;
          height: 12px;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          border-top-color: #c6c6c6;
          animation: spin 0.8s linear infinite;
        }

        .resolved-address {
          font-family: monospace;
          font-size: 13px;
          font-weight: 600;
        }


        .cta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          margin-bottom: 20px;
        }

        .mint-button {
          width: 100%;
          max-width: 310px;
          padding: 16px;
          background: var(--drop-button-color, ${dropConfig.buttonColor});
          border-radius: 8px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          box-sizing: border-box;
        }

        .mint-button:hover:not(:disabled) {
          background: #0c6394;
          transform: translateY(-1px);
        }

        .mint-button:disabled {
          background: #073d5c;
          color: #5c727f;
          cursor: not-allowed;
          transform: none;
        }

        .mint-button.loading {
          background: linear-gradient(
            90deg,
            var(--drop-button-color, ${dropConfig.buttonColor}),
            var(--drop-button-color, ${dropConfig.buttonColor})dd,
            var(--drop-button-color, ${dropConfig.buttonColor})bb,
            var(--drop-button-color, ${dropConfig.buttonColor})dd,
            var(--drop-button-color, ${dropConfig.buttonColor})
          );
          background-size: 200% auto;
          animation: shine 2s linear infinite;
        }

        .mint-note {
          color: #c6c6c6;
          font-size: 13px;
          font-weight: 400;
          text-align: center;
          line-height: 1.4;
          width: 100%;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
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
          to {
            background-position: -200% center;
          }
        }

        .background {
          width: 342px;
          height: 363px;
          position: absolute;
          left: 0px;
          top: -20px;
          overflow: visible;
        }
      `}</style>
    </div>
  );
}
