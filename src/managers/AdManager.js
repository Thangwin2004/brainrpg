export const AdManager = {
  showRewardedVideo: () => {
    return new Promise((resolve) => {
      console.log("[AdManager] Requesting Rewarded Video Ad...");
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  },
  showInterstitial: () => {
    return new Promise((resolve) => {
      console.log("[AdManager] Showing Interstitial Ad...");
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }
};
