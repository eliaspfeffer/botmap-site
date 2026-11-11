# Simpler Botmap hero and share preview

Requested title, kept verbatim: “Too many AI chats? Sort them agents in a mindmap”. The homepage headline, Open Graph title and X card title use it. The social image now contains only an illustrated project mindmap, with the headline supplied by the link card underneath, following the supplied ShipFast and CodeFast references.

Final asset: `/media/botmap-link-20261111-simple.jpg`, 1731 × 909 pixels. Built-in imagegen generated the illustration; JPEG export preserves the whole composition. The preceding share image remains available at its original URL. A new image filename and stylesheet query avoid reusing the preceding assets' cache entries.

The website hero keeps one headline, one short description, the existing Mac download and the existing film. Device mockups and the additional source block were removed. The source and licence remain in the footer. Shared document-page styling, download destination, video source and playback handler stay in place.

## Verification

- Existing ego lite profile, Botmap-assigned visible browser, Space 182. No isolated profile, headless browser or Chrome was used. Existing user Spaces were preserved.
- Actual native-window viewport plus 1280 × 720, 960 × 540, 390 × 844 and 320 × 640 CSS viewports: no horizontal overflow, pitch/video do not overlap, download stays within the page. Mobile scrolling reaches the final footer link.
- Tab shows the download focus ring. Enter starts a download named `Botmap.dmg`. The SDK's cancel operation is unsupported (`Browser.cancelDownload`); no recent Botmap files appeared in the user's Downloads folder. No app was installed or opened by the test.
- The video plays, enters fullscreen, and exits through its fullscreen button. SDK Escape did not leave fullscreen. Physical Escape was not tested because native keyboard focus belonged to a separate user Space, which was left untouched. This does not establish a website Escape bug; the existing playback script is unchanged.
- Privacy navigation works, and document-page styles before the homepage section are byte-for-byte unchanged. Metadata keys are unique; both social titles match the requested sentence and both image URLs use the new asset. The JPEG is 176,324 bytes.
- A local link-card fixture was inspected with the diagram above the requested title, matching the supplied references. Actual rendering or cache refresh inside WhatsApp and X was not tested; no messages or posts were sent.

## Generation prompt

```text
Use case: ads-marketing. Create a FINAL simple social-link preview illustration for Botmap. Horizontal 1200 × 630 composition, approx 1.905:1, no outer frame. The attached two reference screenshots are for the level of simplicity and the diagram treatment only. Do not copy their product names, brands or their surrounding messaging-app UI.

Important: the long marketing headline will be rendered BELOW the image by WhatsApp/X. Do NOT put a marketing headline, slogan, call-to-action button, URL, paragraph, or large wordmark into this image. The whole image is one instantly understandable product diagram, like the reference examples.

Flat charcoal #141414 canvas, warm white and Botmap orange #f08a3c only. Large friendly simple shapes, abundant negative space, crisp readable labels, no gradients, glow, 3D, decorative noise, stock people or device mockups.
One compact, loose mindmap centered in the image: an orange central circular node labelled "Your project", branching via three graceful thin curved lines to three warm-white chat/terminal nodes. Each outer node has a very simple black chat bubble or terminal symbol, with its short label beside it. The three labels are exactly "Claude Code", "Codex", and "Research". A light hand-drawn oval encloses this one connected map, as in the first reference. The map should occupy most of the image while keeping at least 70px outer safe margins. A tiny orange "Botmap" label can sit near the oval's lower right edge. It should be evident that several AI agents/chats are now organized together around one project, rather than a pile of browser tabs.
Use only the specified five labels. No other text. Keep the graph airy and visually balanced, not a dashboard or a box full of panels. All labels and the whole mental model must be clear at 400 pixels wide.
```
