import { ReactNode } from 'react';

interface DropStyleWrapperProps {
  children: ReactNode;
  backgroundColor: string;
  buttonColor: string;
}

export default function DropStyleWrapper({ children, backgroundColor, buttonColor }: DropStyleWrapperProps) {
  return (
    <>
      <style jsx global>{`
        /* Force styles with high specificity */
        html body .poap-minter-container,
        html body .follow-gate-container,
        html body .success-page {
          background: ${backgroundColor} !important;
          background-color: ${backgroundColor} !important;
        }
        
        html body .mint-button,
        html body .claim-button:not(:disabled),
        html body button.mint-button,
        html body button.claim-button:not(:disabled) {
          background: ${buttonColor} !important;
          background-color: ${buttonColor} !important;
        }
        
        html body .mint-button.loading {
          background: linear-gradient(
            90deg,
            ${buttonColor},
            ${buttonColor}dd,
            ${buttonColor}bb,
            ${buttonColor}dd,
            ${buttonColor}
          ) !important;
        }
        
        /* Override any inline styles */
        [style*="background: #073d5c"] {
          background: ${backgroundColor} !important;
        }
        
        [style*="background: #0a5580"] {
          background: ${buttonColor} !important;
        }
      `}</style>
      {children}
    </>
  );
}