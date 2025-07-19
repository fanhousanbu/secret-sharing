// Mock for virtual:pwa-register/react
module.exports = {
  useRegisterSW: () => ({
    needRefresh: [false],
    updateServiceWorker: () => {},
  }),
}; 