import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Lottie from "lottie-react";
import animationData from "../assets/animation.json";

interface POAPSuccessProps {
  walletAddress?: string; // The wallet address where POAP was minted
}

export default function POAPSuccess({ walletAddress }: POAPSuccessProps) {
  const [poapEventData, setPoapEventData] = useState<{name: string, image_url: string} | null>(null);
  const [isLoadingPoapData, setIsLoadingPoapData] = useState(true);
  const { address } = useAccount();
  
  // Use provided wallet address or fallback to connected address
  const displayAddress = walletAddress || address || "";

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

  // Format wallet address for display (first 6 and last 6 chars)
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    if (addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div className="success-page">
      <div className="content">
        <div className="logo">
          <img className="group" src="/group0.svg" alt="" />
          <img className="group2" src="/group1.svg" alt="" />
        </div>
        <div className="c-ard">
          <div className="header">
            <div className="congratulations-you-ve-got-it">
              Congratulations,
              <br />
              you&apos;ve got it!
            </div>
            <div className="frame-37">
              <Lottie className="lottie" animationData={animationData} loop={true} />
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
                <img 
                  className="poap-image" 
                  src="/poap-image0.png"
                  alt="POAP" 
                />
              )}
              <div className="ellipse-2"></div>
              <img className="frame" src="/frame0.svg" alt="" />
            </div>
          </div>
          <div className="body">
            <div className="poap-successfully-minted-to-your-wallet">
              POAP successfully minted
              <br />
              to your wallet:
            </div>
            <div className="wallet">
              <div className="data">
                <img className="wallet2" src="/wallet1.svg" alt="" />
                <div className="_0-x-1234-34-abcd">
                  {formatAddress(displayAddress) || "0x1234...34abcd"}
                </div>
              </div>
              <img className="copy" src="/copy0.svg" alt="" />
            </div>
          </div>
          <img className="background" src="/background0.svg" alt="" />
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

        .success-page,
        .success-page * {
          box-sizing: border-box;
        }

        .success-page {
          background: url('/success-page.png') center;
          background-size: cover;
          background-repeat: no-repeat;
          height: 844px;
          position: relative;
          overflow: hidden;
          font-family: 'Unica77LlTt', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .content {
          padding: 24px;
          width: 390px;
          height: 595px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: 0px;
        }

        .logo {
          width: 200px;
          height: 51px;
          position: absolute;
          left: 95px;
          top: 24px;
          overflow: hidden;
          aspect-ratio: 200/51;
        }

        .group {
          width: 22.56%;
          height: 100%;
          position: absolute;
          right: 77.44%;
          left: 0%;
          bottom: 0%;
          top: 0%;
          overflow: visible;
        }

        .group2 {
          width: 71.96%;
          height: 25.71%;
          position: absolute;
          right: -0.03%;
          left: 28.06%;
          bottom: 37.14%;
          top: 37.14%;
          overflow: visible;
        }

        .c-ard {
          background: linear-gradient(to left, #000000, #000000);
          border-radius: 12px;
          padding: 24px 16px 32px 16px;
          width: 342px;
          height: 472px;
          position: absolute;
          left: 24px;
          top: 99px;
          overflow: hidden;
        }

        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 310px;
          position: absolute;
          left: 16px;
          top: 24px;
        }

        .congratulations-you-ve-got-it {
          color: #ffffff;
          text-align: center;
          font-family: "Unica77LlTt", sans-serif;
          font-size: 24px;
          font-weight: 700;
          position: relative;
        }

        .frame-37 {
          margin: -16px 0 0 0;
          flex-shrink: 0;
          width: 268px;
          height: 268px;
          position: relative;
        }

        .lottie {
          width: 268px;
          height: 268px;
          position: absolute;
          left: 0px;
          top: 0px;
          object-fit: cover;
          aspect-ratio: 1;
        }

        .poap-image {
          border-radius: 50%;
          width: 200px;
          height: 200px;
          position: absolute;
          left: 35px;
          top: 44px;
          object-fit: cover;
          aspect-ratio: 1;
        }

        .poap-image-skeleton {
          border-radius: 50%;
          width: 200px;
          height: 200px;
          position: absolute;
          left: 35px;
          top: 44px;
          background: #1a1c1d;
          display: flex;
          align-items: center;
          justify-content: center;
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

        @keyframes skeleton-loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .ellipse-2 {
          background: #adeb9d;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          position: absolute;
          left: 204px;
          top: 72px;
        }

        .frame {
          width: 23.7px;
          height: 23.7px;
          position: absolute;
          left: 212.15px;
          top: 80.15px;
          overflow: visible;
          aspect-ratio: 1;
        }

        .body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
          justify-content: flex-start;
          width: 310px;
          position: absolute;
          left: 16px;
          top: 334px;
        }

        .poap-successfully-minted-to-your-wallet {
          color: #c6c6c6;
          text-align: center;
          font-family: "Unica77LlTt", sans-serif;
          font-size: 18px;
          font-weight: 400;
          position: relative;
          align-self: stretch;
        }

        .wallet {
          background: #283026;
          border-radius: 8px;
          border-style: solid;
          border-color: #000000;
          border-width: 1px;
          padding: 12px;
          display: flex;
          flex-direction: row;
          gap: 32px;
          align-items: center;
          justify-content: flex-start;
          align-self: stretch;
          flex-shrink: 0;
          position: relative;
        }

        .data {
          display: flex;
          flex-direction: row;
          gap: 8px;
          align-items: center;
          justify-content: flex-start;
          flex: 1;
          position: relative;
        }

        .wallet2 {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          position: relative;
          overflow: visible;
          aspect-ratio: 1;
        }

        ._0-x-1234-34-abcd {
          color: #caf2bf;
          text-align: left;
          font-family: "Unica77LlTt", sans-serif;
          font-size: 18px;
          font-weight: 700;
          position: relative;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .copy {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          position: relative;
          overflow: visible;
          aspect-ratio: 1;
        }

        .background {
          width: 342px;
          height: 363px;
          position: absolute;
          left: 0px;
          top: 0px;
          overflow: visible;
        }
      `}</style>
    </div>
  );
}