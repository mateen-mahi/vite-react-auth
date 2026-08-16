// Loads the YouTube IFrame Player API exactly once and returns a Promise
// every caller can safely await — regardless of how many components try to
// load it, or how their timing lines up against the API's own async script.
//
// Why this exists: the common pattern of manually assigning
// `window.onYouTubeIframeAPIReady = someCallback` is racy. The IFrame API
// calls that global function EXACTLY ONCE, the moment it finishes loading.
// If a component assigns its callback a beat too late — e.g. because it
// was waiting on its own data fetch first — the API has often already
// fired, and the callback is simply never invoked. The player then never
// gets created, and any "loading player…" UI is stuck forever. That's the
// exact bug this fixes: it doesn't matter when you call this, or how many
// times — you always get the API once it's ready.

let apiPromise = null;

export function loadYouTubeIframeAPI() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    // Already loaded — e.g. the user visited another lecture page earlier
    // in this session. Resolve immediately, no script needed.
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    // Chain onto any OTHER onYouTubeIframeAPIReady the page may already
    // have set, so we never silently clobber someone else's callback.
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT);
    };

    // Only inject the script tag once, even across multiple calls/mounts —
    // checked via the DOM itself rather than a module-level flag, so it
    // stays correct across HMR reloads too.
    const alreadyInjected = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!alreadyInjected) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });

  return apiPromise;
}