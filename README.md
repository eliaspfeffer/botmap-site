# trybotmap.com

The public pages of Botmap: the landing page, the privacy policy, support and the Impressum, served by GitHub Pages from this branch
as they are (no build). Desktop installers are served from this repo's Releases. There are no third-party scripts; the commercial license page links to PayPal’s hosted checkout.

The homepage and support page pick up new installers from the existing release channels:

- Mac uses `Botmap.dmg` on the latest stable release.
- Windows uses `Botmap-Setup-x64.exe` on `windows-latest`.
- Linux picks the highest uploaded `botmap_<version>_<architecture>.deb` on `linux-latest` for each architecture. Keep the packages linked in the site HTML available as fallbacks if the public GitHub API is unreachable.

The Mac terminal installer is also available on Apple silicon (macOS 12+, Node.js 18+):

```sh
npx --yes --allow-remote=all https://trybotmap.com/install-v1.0.2.tgz
```

See [installer/README.md](installer/README.md) for checks, behavior and packaging.

## Commercial license checkout

`/license/` offers one organization a USD 50 monthly license, with no per-seat charge. Personal use and organizations of up to five people remain free under the source license. No app activation service or license key is needed; the provider receipt and paid subscription establish the commercial permission.

The checkout is a normal link to PayPal’s active fixed-price subscription plan `P-5DL45796PW8713606NL26RQI`. No SDK, API key, backend, client-side payment confirmation or activation endpoint is required. The license covers the purchasing organization; purchases from personal accounts can be matched by emailing the organization name and subscription ID.

Provider configuration: product `botmap-team-monthly`, fixed USD 50.00 every 1 month, unlimited billing cycles, no setup fee, no trial, no added tax, suspension after 1 missed cycle. PayPal processes the payment; Elias Pfeffer remains the supplier and handles license and tax administration. PayPal’s merchant fees are deducted from proceeds. Manage the plan and customers at <https://www.paypal.com/billing/plans>.

Validate changes with `git diff --check` and an actual browser walkthrough from the homepage to the provider checkout, including mobile layout and keyboard navigation. A checkout view alone does not prove a successful charge, renewal or refund; report exactly which of those were tested.

## Search and AI discovery

The five public pages have distinct search titles, descriptions, canonicals and social metadata. `sitemap.xml` lists their canonical URLs and is advertised in `robots.txt`. Unknown routes use `404.html` with `noindex`; it is not a sitemap page.

The homepage explains the product in ordinary HTML and includes SoftwareApplication, WebSite, WebPage and developer structured data. The JSON-LD block is allowed by its exact SHA-256 CSP hash. After changing that block, update the hash; do not add `unsafe-inline`. No ratings or reviews are invented. Software rich results are not promised: Google requires an actual review or rating for that feature.

`llms.txt` is a public product and setup reference, not an indexing guarantee or an access-control mechanism. Keep requirements, licensing and the versioned installer URL aligned with the visible pages. Do not publish private chats, credentials, customer screenshots or internal research in this static repository.

Run `python3 .github/scripts/check-site.py` and `git diff --check`. GitHub Actions repeats the site check with read-only permissions and a pinned checkout action. It checks metadata, sitemap coverage, internal links and anchors, the JSON-LD/CSP hash and local resource restrictions. GitHub Pages still deploys directly from `main`; this validation workflow is not a deployment gate. Review and test before pushing to `main`.

The 17 November 2026 update follows [Illyism's SEO skills](https://github.com/Illyism/seo-skills) (reference commit `99d51a3`) and [Google's AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide). Product facts come from the Botmap source README, existing license/privacy pages and installer documentation. Existing URLs, the chosen hero, release downloads and commercial terms are retained. No paid links, recurring SEO job, analytics collector or hosting migration is added.

Search-engine ownership uses the provider-issued `googlea7138364f93f69ce.html` and `BingSiteAuth.xml` files at the site root. Keep them deployed to retain verification. These are public ownership proofs, not API credentials; no tracking scripts or changes to DNS are needed. The site check protects their contents from accidental removal or replacement. The canonical URL-prefix property is `https://trybotmap.com/` and its sitemap is `https://trybotmap.com/sitemap.xml`.

Setup verified on 17 November 2026 in the owner's existing Google session and Google sign-in for Bing. Google Search Console accepted the sitemap with status Success and five discovered pages. Bing accepted it with status Processing. Both URL Inspection reports confirmed the homepage was already indexed, and both accepted a new homepage indexing request for the latest content. Sitemap discovery and recrawl requests do not establish that every page or the latest revision is indexed.

Before claiming indexing or traffic growth, check Search Console and Bing Webmaster Tools and compare real clicks, impressions and conversions. Publishing verification files alone does not prove the services accepted verification or indexed the site. No keyword volumes, rankings or AI citations have been measured by the static check.
