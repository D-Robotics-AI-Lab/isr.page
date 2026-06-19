document.addEventListener("DOMContentLoaded", () => {
  const video = document.querySelector("#video video");
  const source = video?.querySelector("source");

  if (!video || !source) {
    return;
  }

  const sourceUrl = source.src;

  const hasUsableSeekRange = () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      return true;
    }

    if (video.seekable.length === 0) {
      return false;
    }

    try {
      return video.seekable.end(video.seekable.length - 1) >= video.duration - 0.5;
    } catch {
      return false;
    }
  };

  const loadSeekableBlob = async () => {
    if (video.dataset.seekFallback === "loaded" || video.dataset.seekFallback === "loading") {
      return;
    }

    video.dataset.seekFallback = "loading";

    try {
      const response = await fetch(sourceUrl, { cache: "reload" });

      if (!response.ok) {
        throw new Error(`Video request failed: ${response.status}`);
      }

      const blobUrl = URL.createObjectURL(await response.blob());
      const poster = video.getAttribute("poster");

      video.removeAttribute("src");
      source.remove();
      video.src = blobUrl;

      if (poster) {
        video.setAttribute("poster", poster);
      }

      video.load();
      video.dataset.seekFallback = "loaded";
    } catch (error) {
      console.warn("Video seek fallback failed.", error);
      video.dataset.seekFallback = "failed";
    }
  };

  const checkSeekability = () => {
    if (!hasUsableSeekRange()) {
      loadSeekableBlob();
    }
  };

  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    checkSeekability();
  } else {
    video.addEventListener("loadedmetadata", checkSeekability, { once: true });
  }
});
