"use client";

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  emailSubject?: string;
  emailMessage?: string;
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  eventName,
  emailSubject = "Your POAP is ready! 🎉",
  emailMessage = "Thank you for attending! Here's your exclusive POAP to commemorate your participation."
}: EmailPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Email Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email Preview */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="bg-slate-900 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-400 mb-2">To: attendee@example.com</div>
            <div className="text-sm text-gray-400 mb-2">From: POAP Studio &lt;noreply@poap.studio&gt;</div>
            <div className="text-sm text-gray-400 mb-4">Subject: {emailSubject}</div>
          </div>

          <div className="bg-white rounded-lg p-6">
            {/* Email Body */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your POAP is ready! 🎉</h2>
              <p className="text-gray-600">{eventName}</p>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">{emailMessage}</p>
            </div>

            <div className="text-center mb-6">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Claim your POAP
              </a>
              <p className="text-sm text-gray-500 mt-2">
                Example link: https://poap.xyz/claim/example-code
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 text-center">
                This POAP commemorates your attendance at {eventName}.
                <br />
                POAPs are digital collectibles that serve as proof of your experiences.
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Powered by POAP Studio • 
                <a href="https://poap.studio" className="text-purple-600 hover:underline ml-1">
                  poap.studio
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800">
          <p className="text-sm text-gray-400 text-center">
            This is a preview of the email that will be sent to checked-in attendees
          </p>
        </div>
      </div>
    </div>
  );
}