# Botmap link preview

Final asset: `/media/botmap-link-20261111.jpg`, 1732 × 908 pixels. Generated with the built-in imagegen tool using the existing, invented-data Mac screenshot as a product reference. JPEG export preserves the complete composition; no crop. The original generated PNG remains in the local Codex generated-images folder.

Chosen copy: “Too many AI chats? Put them on one map.” It pairs recognition of scattered chats with the concrete relief of one project map. The supporting line names Claude Code and Codex; the call to action is “Try Botmap free”. No conversion rate has been measured.

Other headline directions considered: “All your AI chats. One clear map.” (clarity and relief); “Less tab hunting. More AI work.” (recognition and progress). The selected headline explains the problem and solution most directly.

## Verification

- The JPEG is 238,769 bytes. Browser image decoding confirms 1732 × 908 pixels, matching the Open Graph image dimensions.
- Homepage Open Graph fields and `summary_large_image` X fields point to the same absolute HTTPS image URL and include image descriptions. The [Open Graph specification](https://ogp.me/#structured) was checked for the structured image properties.
- Live local testing used the existing ego lite profile in the Botmap-assigned visible Space 178. The image was inspected at small preview sizes and with a central 2:1 crop. The homepage at 390 CSS pixels has no horizontal overflow; the page body, download link and film remain unchanged.
- No messages or posts were sent. Actual rendering inside WhatsApp and X, their thumbnail choices and their cache refreshes have not been verified.

## Generation prompt

```text
Use case: ads-marketing.
Create the FINAL finished social link-preview image for Botmap, a Mac app that organizes Claude Code and Codex chats as nodes on one mind map. It must make sense in two seconds to someone who has never seen Botmap.

Format: horizontal 1200 × 630 pixels, 1.905:1 aspect ratio, one single finished image, not a presentation or a mockup of an image. All content inside a generous 55px safe margin. Pixel-sharp editorial typography, extremely clear even at 400px wide. Match Botmap's existing charcoal #141414, warm white #ececec and orange #f08a3c visual identity. Quiet, flat, clean, high contrast. No decorative gradients, no atmospheric glow, no 3D, no laptop or phone mockup, no stock imagery.

Layout: small 'Botmap' wordmark at top left. Huge confident sans-serif headline in the upper left and middle, exactly two lines:
"Too many AI chats?"
"Put them on one map."
Second line in orange. These are the largest and most readable elements.
Below that, a short crisp supporting line, exact text:
"Claude Code + Codex. Organized by project."

In the lower middle/right, one exceptionally simple visual explanation of the actual product: a clean mind map on the dark canvas, three modest project containers named exactly "Website", "Research", and "Launch", each containing only two or three small round warm-white/orange chat nodes. Thin curved connections join the project groups. One chat node is selected in orange with a small adjacent reply card reading exactly "Ready for your reply". This is a simplified illustrative product diagram, not a busy screenshot. Only a handful of large shapes, plenty of negative space. The reference image shows how actual Botmap topic groups, round chat nodes and a reply card look; use it for product truth and palette, do not copy its detailed content or tiny UI.

Bottom left an orange call-to-action pill, exact text "Try Botmap free →". Bottom right, small but readable "trybotmap.com". No other copy, no invented features or metrics, no third-party logos, no spelling errors. Do not add an outer white border. The headline, the map concept, the product name and free CTA must all remain readable in a small messaging preview.
```
