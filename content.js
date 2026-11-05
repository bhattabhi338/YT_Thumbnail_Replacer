function extractVideoId(urlStr) {
    if (!urlStr) return null;
    
    // Extract video ID from thumbnail image URLs (/vi/VIDEO_ID/ or /vi_webp/VIDEO_ID/)
    const imgMatch = urlStr.match(/\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})\//);
    if (imgMatch) return imgMatch[1];

    // Fallback: Extract video ID from page watch links (?v=VIDEO_ID)
    const watchMatch = urlStr.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    return null;
}

function replaceImageSrc(img, videoId) {
    // Avoid re-processing images already randomized for this video
    if (!img || img.dataset.randomized === videoId) return;

    // Select a random frame: mq1.jpg, mq2.jpg, or mq3.jpg
    const randomFrame = Math.floor(Math.random() * 3) + 1;
    const randomImageUrl = `https://i.ytimg.com/vi/${videoId}/mq${randomFrame}.jpg`;

    // Override src and srcset to block YouTube's default image restoration
    img.src = randomImageUrl;
    img.removeAttribute('srcset');
    img.setAttribute('srcset', `${randomImageUrl} 1x`);
    
    // Tag image to prevent infinite loop triggers
    img.dataset.randomized = videoId;
}

function randomizeThumbnails() {
    // Scan all <img> tags regardless of container structure
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        const src = img.src || img.getAttribute('src') || img.getAttribute('data-src') || '';
        const srcset = img.getAttribute('srcset') || '';
        
        let videoId = extractVideoId(src) || extractVideoId(srcset);
        
        // If image URL hasn't loaded yet, check surrounding link href
        if (!videoId) {
            const parentAnchor = img.closest('a[href*="watch?v="]');
            if (parentAnchor) {
                videoId = extractVideoId(parentAnchor.href);
            }
        }

        if (videoId) {
            replaceImageSrc(img, videoId);
        }
    });
}

// Initial execution
randomizeThumbnails();

// Debouncing observer calls for dynamic scrolling updates
let timeout = null;
const observer = new MutationObserver(() => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        randomizeThumbnails();
    }, 150);
});

// Watch document for lazy-loaded images and DOM additions
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'srcset']
});