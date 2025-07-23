import { useState, useEffect } from "react";

interface POAPSuccessProps {
  isNewlyClaimed?: boolean; // true if just minted, false if already had it
  onShare?: () => void;
}

export default function POAPSuccess({ isNewlyClaimed = false, onShare }: POAPSuccessProps) {
  const [poapEventData, setPoapEventData] = useState<{name: string, image_url: string} | null>(null);
  const [isLoadingPoapData, setIsLoadingPoapData] = useState(true);

  // Fetch POAP event data
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

  return (
    <div className="poap-success-container">
      <div className="frame-container">
        <div className="white-text-horizontal">
          <img className="group" src="/group0.svg" alt="" />
          <img className="group2" src="/group1.svg" alt="" />
        </div>
        <div className="card">
          <div className="header">
            <div className="success-icon">🎉</div>
            <div className="success-title">
              {isNewlyClaimed ? 'POAP Claimed Successfully!' : 'You Already Have This POAP!'}
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
              <div className="success-message">
                {isNewlyClaimed 
                  ? `Congratulations! You've successfully claimed your ${poapEventData?.name || 'POAP'}. Share your achievement with the Farcaster community!`
                  : `You have already claimed this ${poapEventData?.name || 'POAP'} event. Each user can only claim one POAP per event.`
                }
              </div>
            </div>
            <div className="cta">
              <button
                type="button"
                onClick={onShare}
                className="share-button"
              >
                Share on Farcaster
              </button>
              <div className="share-note">
                {isNewlyClaimed 
                  ? "Let everyone know about your new POAP!"
                  : "Show off your POAP collection!"
                }
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

        .poap-success-container {
          width: 100%;
          max-width: 390px;
          min-height: 100vh;
          background: url('/background.jpg') center;
          background-size: cover;
          background-repeat: no-repeat;
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
          box-sizing: border-box;
        }

        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }

        .success-title {
          color: #51cf66;
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
          .poap-success-container {
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
          gap: 16px;
        }

        .success-message {
          color: #c6c6c6;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.5;
          text-align: center;
        }

        .cta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          margin-bottom: 20px;
        }

        .share-button {
          width: 100%;
          max-width: 310px;
          padding: 16px;
          background: #0a5580;
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

        .share-button:hover {
          background: #0c6394;
          transform: translateY(-1px);
        }

        .share-note {
          color: #c6c6c6;
          font-size: 13px;
          font-weight: 400;
          text-align: center;
          line-height: 1.4;
          width: 100%;
        }
      `}</style>
    </div>
  );
}