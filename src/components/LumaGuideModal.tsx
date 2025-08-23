"use client";

interface LumaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LumaGuideModal({ isOpen, onClose }: LumaGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-2xl bg-slate-900 shadow-2xl transition-all max-w-md w-full">
          {/* Header */}
          <div className="bg-slate-800 px-6 py-4">
            <h3 className="text-xl font-semibold text-white">
              How to Add POAP Studio as Manager
            </h3>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-gray-300 mb-6">
              To validate your event, POAP Studio must be added as a Manager. Follow these steps:
            </p>

            {/* Steps */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-600 text-white text-xs flex items-center justify-center">
                  1
                </div>
                <p className="text-gray-300 text-sm">
                  Go to your event page on Luma
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-600 text-white text-xs flex items-center justify-center">
                  2
                </div>
                <p className="text-gray-300 text-sm">
                  Click on &quot;Team&quot; or &quot;Co-hosts&quot; section
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-600 text-white text-xs flex items-center justify-center">
                  3
                </div>
                <p className="text-gray-300 text-sm">
                  Add <span className="font-mono bg-slate-800 px-2 py-1 rounded">admin@poap.fr</span>
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-600 text-white text-xs flex items-center justify-center">
                  4
                </div>
                <p className="text-gray-300 text-sm">
                  Set access level to <strong>Manager</strong> as shown below:
                </p>
              </div>
            </div>

            {/* Luma UI Recreation */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-medium">Update Host</h4>
                  <p className="text-gray-400 text-sm">POAP Studio (admin@poap.fr)</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Show on the Event Page</span>
                  <div className="relative">
                    <div className="w-12 h-6 bg-green-500 rounded-full"></div>
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform"></div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-300 mb-3">Access Control</p>
                  
                  {/* Manager option - selected */}
                  <div className="bg-[#2a2a2a] border-2 border-white rounded-xl p-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#3a3a3a] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-white font-medium">Manager</h5>
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">Full manage access to the event</p>
                      </div>
                    </div>
                  </div>

                  {/* Check-in Only option - disabled */}
                  <div className="opacity-50 mb-3">
                    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[#3a3a3a] rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-gray-500 font-medium">Check-in Only</h5>
                          <p className="text-gray-600 text-sm mt-1">Check in guests and view guest list</p>
                          <p className="text-yellow-600 text-xs mt-1">Requires Luma Plus</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Non-Manager option */}
                  <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#3a3a3a] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="text-gray-400 font-medium">Non-Manager</h5>
                        <p className="text-gray-500 text-sm mt-1">No manage event access</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <button className="flex-1 bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors">
                    Update
                  </button>
                  <button className="flex-1 bg-transparent border border-red-500 text-red-500 font-medium py-3 px-4 rounded-lg">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-800 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}