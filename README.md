# trybotmap.com

The public pages of Botmap: the landing page, the privacy policy, support and the Impressum, served by GitHub Pages from this branch
as they are (no build). Botmap for Mac downloads are this repo's Releases. There are no third-party scripts; the commercial license page links to PayPal’s hosted checkout.

Install directly from a terminal on Apple silicon Mac (macOS 12+, Node.js 18+):

```sh
npx --yes --allow-remote=all https://trybotmap.com/install-v1.0.2.tgz
```

See [installer/README.md](installer/README.md) for checks, behavior and packaging.

## Commercial license checkout

`/license/` offers one organization a USD 50 monthly license, with no per-seat charge. Personal use and organizations of up to five people remain free under the source license. No app activation service or license key is needed; the provider receipt and paid subscription establish the commercial permission.

The checkout is a normal link to PayPal’s active fixed-price subscription plan `P-5DL45796PW8713606NL26RQI`. No SDK, API key, backend, client-side payment confirmation or activation endpoint is required. The license covers the purchasing organization; purchases from personal accounts can be matched by emailing the organization name and subscription ID.

Provider configuration: product `botmap-team-monthly`, fixed USD 50.00 every 1 month, unlimited billing cycles, no setup fee, no trial, no added tax, suspension after 1 missed cycle. PayPal processes the payment; Elias Pfeffer remains the supplier and handles license and tax administration. PayPal’s merchant fees are deducted from proceeds. Manage the plan and customers at <https://www.paypal.com/billing/plans>.

Validate changes with `git diff --check` and an actual browser walkthrough from the homepage to the provider checkout, including mobile layout and keyboard navigation. A checkout view alone does not prove a successful charge, renewal or refund; report exactly which of those were tested.
