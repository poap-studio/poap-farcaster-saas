import { useState } from "react";
import sdk from "@farcaster/frame-sdk";

interface FollowGateProps {
  username: string;
  onFollowComplete?: () => void;
}

export default function FollowGate({ username, onFollowComplete }: FollowGateProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollowClick = async () => {
    setIsFollowing(true);
    try {
      // Open the user profile in Farcaster
      await sdk.actions.openUrl(`https://warpcast.com/${username}`);
      
      // After a delay, check if they followed (they need to come back to the app)
      setTimeout(() => {
        if (onFollowComplete) {
          onFollowComplete();
        }
      }, 1000);
    } catch (error) {
      console.error("Error opening profile:", error);
      setIsFollowing(false);
    }
  };

  return (
    <div className="follow-gate-container">
      <section className="follow-gate-section card">
        <div className="follow-content">
          <h2 className="follow-title">Follow Required</h2>
          
          <div className="follow-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21V19C19 17.9391 18.5786 16.9217 17.8284 16.1716C17.0783 15.4214 16.0609 15 15 15H9C7.93913 15 6.92172 15.4214 6.17157 16.1716C5.42143 16.9217 5 17.9391 5 19V21" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <p className="follow-description">
            To mint this POAP, you must follow <strong>@{username}</strong> on Farcaster.
          </p>

          <p className="follow-instructions">
            Click the button below to visit their profile and follow them. Once you&apos;ve followed, come back to this app and refresh the page.
          </p>

          <button
            type="button"
            onClick={handleFollowClick}
            disabled={isFollowing}
            className={`follow-button ${isFollowing ? 'loading' : ''}`}
          >
            {isFollowing ? (
              <div className="flex items-center gap-2">
                <div className="spinner" />
                <span>Opening Profile...</span>
              </div>
            ) : (
              `Follow @${username}`
            )}
          </button>

          <button
            type="button"
            onClick={onFollowComplete}
            className="check-follow-button"
          >
            I&apos;ve followed - Check again
          </button>
          
          <p className="follow-note">
            After following, click the button above to check your follow status.
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

        .follow-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          background: #f3f4f6;
          border-radius: 50%;
          margin: 0.5rem 0;
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

        .follow-button {
          background: #7c3aed;
          color: white;
          padding: 0.875rem 2rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 200px;
        }

        .follow-button:hover:not(:disabled) {
          background: #6d28d9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .follow-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .check-follow-button {
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
        }

        .check-follow-button:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .follow-button.loading {
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