import { useState, useEffect } from "react";
import sdk from "@farcaster/frame-sdk";

interface FollowGateProps {
  username: string;
  castHash?: string;
  castAuthor?: string | null;
  isFollowing?: boolean | null;
  hasRecasted?: boolean | null;
  onFollowComplete?: () => void;
  onClaimPoapClick?: () => void;
}

export default function FollowGate({ username, castHash, castAuthor, isFollowing, hasRecasted, onFollowComplete, onClaimPoapClick }: FollowGateProps) {
  const [isOpeningProfile, setIsOpeningProfile] = useState(false);
  const [isOpeningCast, setIsOpeningCast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [poapEventData, setPoapEventData] = useState<{name: string, image_url: string} | null>(null);
  const [isLoadingPoapData, setIsLoadingPoapData] = useState(true);

  const handleFollowClick = async () => {
    setIsOpeningProfile(true);
    try {
      // Open the user profile in Farcaster
      await sdk.actions.openUrl(`https://warpcast.com/${username}`);
      
      // After a delay, check if they followed (they need to come back to the app)
      setTimeout(() => {
        setIsOpeningProfile(false);
      }, 1000);
    } catch (error) {
      console.error("Error opening profile:", error);
      setIsOpeningProfile(false);
    }
  };

  const handleRecastClick = async () => {
    if (!castHash) return;
    
    // Extract the short hash (first 10 characters after 0x)
    const shortHash = castHash.startsWith('0x') 
      ? castHash.substring(0, 10) 
      : `0x${castHash.substring(0, 8)}`;
    
    // Use the author username from the cast if available
    const castUrl = castAuthor 
      ? `https://warpcast.com/${castAuthor}/${shortHash}`
      : `https://warpcast.com/~/cast/${castHash}`;
    
    setIsOpeningCast(true);
    try {
      // Open the cast in Farcaster
      await sdk.actions.openUrl(castUrl);
      
      setTimeout(() => {
        setIsOpeningCast(false);
      }, 1000);
    } catch (error) {
      console.error("Error opening cast:", error);
      setIsOpeningCast(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onFollowComplete) {
        await onFollowComplete();
      }
      // After updating data, reload the page
      window.location.reload();
    } catch (error) {
      console.error("Error during refresh:", error);
      // Even on error, reload the page
      window.location.reload();
    }
  };

  useEffect(() => {
    const fetchPoapEventData = async () => {
      try {
        setIsLoadingPoapData(true);
        const response = await fetch('/api/poap-event');
        if (response.ok) {
          const data = await response.json();
          setPoapEventData(data);
        }
      } catch (error) {
        console.error('Error fetching POAP event data:', error);
      } finally {
        setIsLoadingPoapData(false);
      }
    };

    fetchPoapEventData();
  }, []);

  // Safety mechanism: ensure refresh button is never permanently disabled
  useEffect(() => {
    if (isRefreshing) {
      const timeout = setTimeout(() => {
        setIsRefreshing(false);
      }, 3000); // Force re-enable after 3 seconds maximum
      
      return () => clearTimeout(timeout);
    }
  }, [isRefreshing]);

  return (
    <div className="follow-gate-container">
      <div className="frame-container">
        <div className="white-text-horizontal">
          <img className="group" src="/group0.svg" alt="" />
          <img className="group2" src="/logo.svg" alt="" />
        </div>
        <div className="card">
          <div className="header">
            <div className="get-your-arbitrum-poap">
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
                  src={poapEventData.image_url} 
                  alt="POAP" 
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
                  <div className="requirements">Requirements</div>
                  <button 
                    className="refresh"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    type="button"
                  >
                    <svg className={`refresh-icon ${isRefreshing ? 'rotating' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.5 2.5V5.5H7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1.5 9.5V6.5H4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.205 4.5C2.451 3.621 2.97825 2.85075 3.7095 2.301C4.44075 1.75125 5.33625 1.452 6.25875 1.452C7.18125 1.452 8.07675 1.75125 8.808 2.301C9.53925 2.85075 10.0665 3.621 10.3125 4.5M1.6875 7.5C1.9335 8.379 2.46075 9.14925 3.192 9.699C3.92325 10.2488 4.81875 10.548 5.74125 10.548C6.66375 10.548 7.55925 10.2488 8.2905 9.699C9.02175 9.14925 9.549 8.379 9.795 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="refresh-text">Refresh</span>
                  </button>
                </div>
                <div className="complete-both-steps-to-unlock-your-poap">
                  Complete both steps to unlock your POAP:
                </div>
              </div>
              <div className="requirements-container">
                <div className="requirement-item">
                  <div className="requirement-text">
                    <span className="requirement-main">Follow @{username}</span>
                    <span className="requirement-sub">on Farcaster</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFollowClick}
                    disabled={isOpeningProfile || !!isFollowing}
                    className={`action-button ${isFollowing ? 'completed' : ''}`}
                  >
                    {isFollowing ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="#CAF2BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : null}
                    <span>{isFollowing ? 'Done' : 'Follow'}</span>
                    {!isFollowing ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 12L12 4M12 4H6M12 4V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : null}
                  </button>
                </div>
                <div className="requirement-item">
                  <div className="requirement-text">
                    <span className="requirement-main">Recast the original cast</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRecastClick}
                    disabled={isOpeningCast || !!hasRecasted || !castHash}
                    className={`action-button ${hasRecasted ? 'completed' : ''}`}
                  >
                    {hasRecasted ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="#CAF2BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : null}
                    <span>{hasRecasted ? 'Done' : 'Recast'}</span>
                    {!hasRecasted ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 12L12 4M12 4H6M12 4V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : null}
                  </button>
                </div>
              </div>
            </div>
            <div className="cta">
              <button
                type="button"
                disabled={!isFollowing || !hasRecasted}
                className="claim-button"
                onClick={onClaimPoapClick}
              >
                Claim POAP
              </button>
              <div className="claim-note">
                Once both steps are done, your POAP will be ready to claim it.
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

        .follow-gate-container {
          width: 100%;
          max-width: 390px;
          min-height: 100vh;
          background: #073d5c;
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
        }

        .white-text-horizontal {
          flex-shrink: 0;
          width: 200px;
          height: 51px;
          position: relative;
          overflow: hidden;
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
          position: relative;
          overflow: hidden;
        }

        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .get-your-arbitrum-poap {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.2;
          text-align: center;
        }

        .poap-image-container {
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .poap-image {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          object-fit: cover;
        }

        .poap-image-skeleton {
          width: 200px;
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
          width: 200px;
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
          .follow-gate-container {
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
          justify-content: space-between;
        }

        .requirements {
          color: #ffffff;
          font-size: 20px;
          font-weight: 700;
        }

        .refresh {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 6px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          border: none;
        }

        .refresh:hover:not(:disabled) {
          opacity: 0.8;
          background: rgba(255, 255, 255, 0.1);
        }

        .refresh:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .refresh:active:not(:disabled) {
          transform: scale(0.95);
        }

        .refresh-icon {
          width: 12px;
          height: 12px;
        }

        .refresh-icon.rotating {
          animation: spin 0.8s linear infinite;
        }

        .refresh-text {
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
        }

        .complete-both-steps-to-unlock-your-poap {
          color: #c6c6c6;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.5;
        }

        .requirements-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .requirement-item {
          background: #1a1c1d;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .requirement-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .requirement-main {
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
        }

        .requirement-sub {
          color: #c6c6c6;
          font-size: 15px;
          font-weight: 400;
        }

        .action-button {
          background: #2e3234;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          white-space: nowrap;
          width: 88px;
        }

        .action-button.completed {
          background: #394636;
          color: #caf2bf;
          cursor: default;
          justify-content: flex-start;
          gap: 6px;
        }

        .action-button.completed {
          background: #394636;
          color: #caf2bf;
          cursor: default;
        }

        .action-button:hover:not(:disabled):not(.completed) {
          opacity: 0.8;
          transform: translateY(-1px);
        }

        .action-button:disabled:not(.completed) {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          margin-bottom: 20px;
        }

        .claim-button {
          width: 100%;
          max-width: 310px;
          padding: 16px;
          background: #073d5c;
          border-radius: 8px;
          color: #5c727f;
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          cursor: not-allowed;
          transition: all 0.2s;
        }

        .claim-button:not(:disabled) {
          color: #ffffff;
          cursor: pointer;
          background: #0a5580;
        }

        .claim-button:not(:disabled):hover {
          background: #0c6394;
          transform: translateY(-1px);
        }

        .claim-note {
          color: #c6c6c6;
          font-size: 13px;
          font-weight: 400;
          text-align: left;
          line-height: 1.4;
          width: 100%;
        }


        @keyframes spin {
          to {
            transform: rotate(360deg);
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