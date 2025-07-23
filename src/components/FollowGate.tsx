import { useState } from "react";
import sdk from "@farcaster/frame-sdk";

interface FollowGateProps {
  username: string;
  castHash?: string;
  castAuthor?: string | null;
  isFollowing?: boolean | null;
  hasRecasted?: boolean | null;
  onFollowComplete?: () => void;
}

export default function FollowGate({ username, castHash, castAuthor, isFollowing, hasRecasted, onFollowComplete }: FollowGateProps) {
  const [isOpeningProfile, setIsOpeningProfile] = useState(false);
  const [isOpeningCast, setIsOpeningCast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  return (
    <div className="follow-gate-container">
      <div className="frame-container">
        <div className="white-text-horizontal">
          <svg width="245" height="45" viewBox="0 0 245 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.15 44.55C9.45 44.55 7.05 43.95 4.95 42.75C2.85 41.55 1.2 39.9 0 37.8L5.4 34.65C6.3 36.15 7.425 37.275 8.775 38.025C10.125 38.775 11.55 39.15 13.05 39.15C15.75 39.15 17.85 38.25 19.35 36.45C20.85 34.65 21.6 32.25 21.6 29.25V2.7H27.45V29.25C27.45 33.75 26.175 37.275 23.625 39.825C21.075 42.375 17.55 43.65 13.05 43.65L12.15 44.55Z" fill="white"/>
          </svg>
          <svg width="245" height="45" viewBox="0 0 245 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M221.15 44.55C218.45 44.55 216.05 43.95 213.95 42.75C211.85 41.55 210.2 39.9 209 37.8L214.4 34.65C215.3 36.15 216.425 37.275 217.775 38.025C219.125 38.775 220.55 39.15 222.05 39.15C224.75 39.15 226.85 38.25 228.35 36.45C229.85 34.65 230.6 32.25 230.6 29.25V2.7H236.45V29.25C236.45 33.75 235.175 37.275 232.625 39.825C230.075 42.375 226.55 43.65 222.05 43.65L221.15 44.55Z" fill="white"/>
          </svg>
        </div>
        <div className="card">
          <div className="header">
            <div className="get-your-arbitrum-poap">
              Get your<br />Arbitrum POAP
            </div>
            <div className="poap-image-container">
              <svg className="arbitrum-logo" width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="100" fill="#213147"/>
                <path d="M100 30L40 170H160L100 30Z" fill="#12AAFF"/>
                <path d="M100 30L70 130H130L100 30Z" fill="#9DCCED"/>
                <path d="M100 50L80 110H120L100 50Z" fill="#213147"/>
              </svg>
              <img className="poap-image" src="/poap-event-image.png" alt="POAP" />
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
                    className="action-button"
                  >
                    <span>{isFollowing ? 'Done' : 'Follow'}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 12L12 4M12 4H6M12 4V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div className="requirement-item">
                  <div className="requirement-text">
                    <span className="requirement-main">Recast the original cast</span>
                    <span className="requirement-sub">with this POAP</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRecastClick}
                    disabled={isOpeningCast || !!hasRecasted || !castHash}
                    className="action-button"
                  >
                    <span>{hasRecasted ? 'Done' : 'Recast'}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 12L12 4M12 4H6M12 4V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="cta">
              <button
                type="button"
                disabled={!isFollowing || !hasRecasted}
                className="claim-button"
                onClick={onFollowComplete}
              >
                Claim POAP
              </button>
              <div className="claim-note">
                Once both steps are done, your POAP will be ready to claim it.
              </div>
            </div>
          </div>
        </div>
        <svg className="frame-18" width="370" height="52" viewBox="0 0 370 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M0 0H138V6C138 8.20914 136.209 10 134 10H122C119.791 10 118 11.7909 118 14V38C118 40.2091 119.791 42 122 42H248C250.209 42 252 40.2091 252 38V14C252 11.7909 250.209 10 248 10H236C233.791 10 232 8.20914 232 6V0H370V52H0V0Z" fill="white" fillOpacity="0.1"/>
        </svg>
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
          width: 390px;
          height: 844px;
          background: linear-gradient(-74.01deg, rgba(33, 49, 71, 1) 1.16%, rgba(18, 170, 255, 1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          font-family: 'Unica77LlTt', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .frame-container {
          width: 342px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
        }

        .white-text-horizontal {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 45px;
          padding: 0 48px;
        }

        .card {
          background: #000000;
          border-radius: 12px;
          padding: 24px 16px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 32px;
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
          position: relative;
          width: 200px;
          height: 200px;
        }

        .arbitrum-logo {
          position: absolute;
          width: 200px;
          height: 200px;
          top: 0;
          left: 0;
        }

        .poap-image {
          position: absolute;
          width: 120px;
          height: 120px;
          top: 40px;
          left: 40px;
          border-radius: 50%;
          object-fit: cover;
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
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .refresh:hover:not(:disabled) {
          opacity: 0.8;
        }

        .refresh:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
          padding: 8px 12px 8px 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          white-space: nowrap;
        }

        .action-button:hover:not(:disabled) {
          opacity: 0.8;
          transform: translateY(-1px);
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .claim-button {
          width: 310px;
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

        .frame-18 {
          position: absolute;
          bottom: 0;
          left: 10px;
          width: 370px;
          height: 52px;
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