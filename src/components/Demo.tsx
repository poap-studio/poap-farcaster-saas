import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { parseEther } from "viem";
import {
  useAccount,
  useConnect,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { config } from "./providers/WagmiProvider";

export default function Demo() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [claimStatus, setClaimStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [claimError, setClaimError] = useState<string>("");

  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { sendTransaction, isPending: isSendTxPending } = useSendTransaction();
  const { isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Set default wallet address when connected
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
    }
  }, [address]);

  // Farcaster Mini App Integration
  useEffect(() => {
    const load = async () => {
      await sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const shareCast = async () => {
    sdk.actions.composeCast({
      text: "Farewell Warpcast, I just minted the new POAP! Get yours too and support Farcaster choooo chooo🚂! Thanks @gabo and @samuellhuber.eth",
      embeds: ["https://fc-poap.dtech.vision/"],
      close: true,
    });
  };

  const mintPoap = async (amount: string) => {
    if (!address) {
      console.error("Wallet not connected");
      return;
    }

    try {
      setIsLoading(true);
      sendTransaction(
        {
          to: "0xd1A84b374fd0B9466C1e99DDCE15dc6179C8376a",
          value: parseEther(amount.toString()),
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
          },
        },
      );
    } catch (error) {
      console.error("Transaction failed:", error);
      window.alert(
        error instanceof Error
          ? error.message
          : "Transaction failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const claimPoap = async () => {
    if (!txHash || !walletAddress) {
      setClaimError("Transaction hash and wallet address are required");
      return;
    }

    try {
      setClaimStatus("loading");
      const response = await fetch("/api/claim-poap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: walletAddress,
          txHash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim POAP");
      }

      setClaimStatus("success");
    } catch (error) {
      setClaimStatus("error");
      setClaimError(error instanceof Error ? error.message : "Failed to claim POAP");
    }
  };

  const handleShare = () => {
    shareCast();
  };

  return (
    <div>
      <section id="poap" className="poap-section card">
        <h2 className="poap-title">
          <img
            className="poap-logo"
            src="https://ethereumupgrades.com/assets/img/poap-logo.webp"
            alt="POAP Logo"
            width={40}
            height={40}
          />
          <img
            className="poap-text"
            src="https://ethereumupgrades.com/assets/img/poap.png"
            alt="POAP Text"
            width={120}
            height={30}
          />
          <img
            src="https://dtech.vision/favicon.svg"
            alt="dTech Logo"
            width={60}
            height={60}
          />
        </h2>
        <div className="poap-directions">
          <p>
            To mint the Farewell Warpcast POAP,{" "}
            <strong>
              send 0.001 ETH to{" "}
              <a
                href="https://nouns.build/dao/base/0x8de71d80ee2c4700bc9d4f8031a2504ca93f7088/789"
                target="_blank"
                rel="noreferrer"
                className="ethstaker-link"
              >
                Purple DAO
              </a>
            </strong>{" "}
            before May 30, 11:59 PM UTC
          </p>
          <ul>
            <li>
              To get the Farewell Warpcast POAP you have to send using this mini
              app as we&apos;ll issue you the POAP.
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
                <img
                  src="https://assets.poap.xyz/5adeb818-235d-4824-9ba5-ffb3e46c4279.png?size=large"
                  alt="POAP Artwork"
                  title="POAP Artwork"
                  className="poap-img"
                  width={100}
                  height={100}
                />
              </a>
            </div>
            <div className="poap-cost">Support Purple DAO</div>
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
              ) : !isSuccess ? (
                <button
                  type="button"
                  disabled={isLoading || isSendTxPending}
                  onClick={() => mintPoap("0.001")}
                  className={`poap-airship-button ${(isLoading || isSendTxPending) ? 'loading' : ''}`}
                >
                  {(isLoading || isSendTxPending) ? (
                    <div className="flex items-center gap-2">
                      <div className="spinner" />
                      <span>Minting...</span>
                    </div>
                  ) : (
                    "Mint POAP"
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
                    placeholder="Enter wallet address"
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={claimPoap}
                    disabled={claimStatus === "loading"}
                    className={`poap-airship-button ${claimStatus === "loading" ? 'loading' : ''}`}
                  >
                    {claimStatus === "loading" ? (
                      <div className="flex items-center gap-2">
                        <div className="spinner" />
                        <span>Claiming...</span>
                      </div>
                    ) : (
                      "Claim POAP"
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
