export default function CardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-[360px] animate-pulse">
      {/* Color Preview Bar */}
      <div className="h-3 bg-slate-700" />
      
      <div className="p-6 flex flex-col flex-1">
        {/* Top row with platform icon and status chip */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-700" />
            <div className="h-4 w-16 bg-slate-700 rounded" />
          </div>
          <div className="h-6 w-20 bg-slate-700 rounded-full" />
        </div>
        
        {/* Title */}
        <div className="h-6 w-3/4 bg-slate-700 rounded mb-4" />

        <div className="flex-1">
          <div className="space-y-2 mb-4">
            {/* Created date */}
            <div className="h-4 w-32 bg-slate-700 rounded" />
            {/* Event ends */}
            <div className="h-4 w-48 bg-slate-700 rounded" />
            {/* Additional info */}
            <div className="h-4 w-40 bg-slate-700 rounded" />
            {/* Guest stats */}
            <div className="h-4 w-36 bg-slate-700 rounded" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-auto">
          <div className="flex-1 h-12 sm:h-10 bg-slate-700 rounded-lg" />
          <div className="flex-1 h-12 sm:h-10 bg-slate-700 rounded-lg" />
          <div className="flex-1 h-12 sm:h-10 bg-slate-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}