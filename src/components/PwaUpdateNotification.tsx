import { useRegisterSW } from 'virtual:pwa-register/react';

function PwaUpdateNotification() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      console.log(`SW Registered: ${r}`);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">
      <p className="mr-4">A new version is available.</p>
      <button
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold"
        onClick={() => updateServiceWorker(true)}
      >
        Reload
      </button>
    </div>
  );
}

export default PwaUpdateNotification;
