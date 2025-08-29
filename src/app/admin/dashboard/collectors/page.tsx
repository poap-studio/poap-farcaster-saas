'use client';

import POAPCollectors from '~/components/admin/POAPCollectors';

export default function AdminCollectorsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Collectors by POAP</h1>
      <POAPCollectors />
    </div>
  );
}