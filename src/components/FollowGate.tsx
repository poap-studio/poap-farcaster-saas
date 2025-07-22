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
    
    console.log('[FollowGate] Opening cast with hash:', castHash);
    console.log('[FollowGate] Cast author received:', castAuthor);
    console.log('[FollowGate] Cast author type:', typeof castAuthor);
    
    // Extract the short hash (first 10 characters after 0x)
    const shortHash = castHash.startsWith('0x') 
      ? castHash.substring(0, 10) 
      : `0x${castHash.substring(0, 8)}`;
    
    console.log('[FollowGate] Short hash extracted:', shortHash);
    
    // Use the author username from the cast if available
    const castUrl = castAuthor 
      ? `https://warpcast.com/${castAuthor}/${shortHash}`
      : `https://warpcast.com/~/cast/${castHash}`;
    console.log('[FollowGate] Final cast URL being opened:', castUrl);
    console.log('[FollowGate] Author used:', castAuthor);
    
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

  return (
    <div className="follow-gate-container">
      <section className="follow-gate-section card">
        <div className="follow-content">
          <h2 className="follow-title">Requirements to Mint</h2>
          
          <div className="requirements-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <p className="follow-description">
            To mint this POAP, you must complete both requirements:
          </p>

          <div className="requirements-list">
            <div className={`requirement-item ${isFollowing ? 'completed' : 'pending'}`}>
              <div className="requirement-status">
                {isFollowing ? '✅' : '❌'}
              </div>
              <div className="requirement-text">
                <strong>Follow @{username}</strong> on Farcaster
              </div>
            </div>
            
            <div className={`requirement-item ${hasRecasted ? 'completed' : 'pending'}`}>
              <div className="requirement-status">
                {hasRecasted ? '✅' : '❌'}
              </div>
              <div className="requirement-text">
                <strong>Recast the original cast</strong> where this app was shared
              </div>
            </div>
          </div>

          <p className="follow-instructions">
            Complete both actions using the buttons below, then check again.
          </p>

          <div className="action-buttons">
            {!isFollowing && (
              <button
                type="button"
                onClick={handleFollowClick}
                disabled={isOpeningProfile}
                className={`requirement-button follow-button ${isOpeningProfile ? 'loading' : ''}`}
              >
                {isOpeningProfile ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner" />
                    <span>Opening Profile...</span>
                  </div>
                ) : (
                  `Follow @${username}`
                )}
              </button>
            )}

            {castHash && !hasRecasted && (
              <button
                type="button"
                onClick={handleRecastClick}
                disabled={isOpeningCast}
                className={`requirement-button recast-button ${isOpeningCast ? 'loading' : ''}`}
              >
                {isOpeningCast ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner" />
                    <span>Opening Cast...</span>
                  </div>
                ) : (
                  'Recast the Cast'
                )}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onFollowComplete}
            className="check-requirements-button"
          >
            I&apos;ve completed the requirements - Check again
          </button>
          
          <p className="follow-note">
            After completing both requirements, click the check button above.
          </p>
        </div>
      </section>

      <style jsx>{`
        .follow-gate-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .follow-gate-section {
          max-width: 400px;
          width: 100%;
          background: white;
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .follow-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .follow-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .requirements-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          background: #f3f4f6;
          border-radius: 50%;
          margin: 0.5rem 0;
        }

        .requirements-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          margin: 1rem 0;
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 12px;
          border: 2px solid transparent;
        }

        .requirement-item.completed {
          background: #f0fdf4;
          border-color: #22c55e;
        }

        .requirement-item.pending {
          background: #fef2f2;
          border-color: #ef4444;
        }

        .requirement-status {
          font-size: 1.25rem;
          min-width: 24px;
        }

        .requirement-text {
          flex: 1;
          text-align: left;
          font-size: 0.9rem;
          color: #374151;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }

        .follow-description {
          font-size: 1.125rem;
          color: #4b5563;
          margin: 0;
          line-height: 1.6;
        }

        .follow-description strong {
          color: #7c3aed;
          font-weight: 600;
        }

        .follow-instructions {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .requirement-button {
          padding: 0.875rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 200px;
          color: white;
        }

        .follow-button {
          background: #7c3aed;
        }

        .follow-button:hover:not(:disabled) {
          background: #6d28d9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .recast-button {
          background: #f59e0b;
        }

        .recast-button:hover:not(:disabled) {
          background: #d97706;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .requirement-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .requirement-button.loading {
          background: linear-gradient(
            90deg,
            currentColor,
            transparent,
            currentColor
          );
          background-size: 200% auto;
          animation: shine 2s linear infinite;
        }

        .check-requirements-button {
          background: #10b981;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 180px;
          margin-top: 0.5rem;
        }

        .check-requirements-button:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .follow-note {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0;
          font-style: italic;
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
        }

        .flex {
          display: flex;
        }

        .items-center {
          align-items: center;
        }

        .gap-2 {
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}