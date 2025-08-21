export default function FramePreview() {
  return (
    <div className="bg-slate-800 rounded-xl shadow-2xl p-4 max-w-md mx-auto">
      {/* Farcaster Frame Container */}
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        {/* Frame Image */}
        <div className="relative aspect-square bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-2xl font-bold mb-2">Exclusive POAP</h3>
            <p className="text-sm opacity-90">Celebrate with our community</p>
          </div>
        </div>
        
        {/* Frame Button */}
        <div className="p-4">
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
            🎁 Claim POAP
          </button>
        </div>
      </div>
      
      {/* Farcaster UI Elements */}
      <div className="mt-4 flex items-center justify-between text-gray-400 text-sm">
        <div className="flex items-center gap-4">
          <button className="hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button className="hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button className="hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <span className="text-xs">Frame by POAP Drop</span>
      </div>
    </div>
  );
}