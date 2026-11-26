"""Check the static site's crawlability, links and restrictive content policies."""
import base64
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[2]
ORIGIN = "https://trybotmap.com"


class Document(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.tags, self.scripts, self.title = [], [], ""
        self.current = None
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == "script":
            self.scripts.append([attrs, ""])
        if tag in ("script", "title"):
            self.current = tag

    def handle_endtag(self, tag):
        if tag == self.current:
            self.current = None

    def handle_data(self, text):
        if self.current == "title":
            self.title += text
        elif self.current == "script":
            self.scripts[-1][1] += text

    def meta(self, name):
        values = [a["content"] for t, a in self.tags
                  if t == "meta" and (a.get("name") == name or a.get("property") == name)]
        assert len(values) == 1, f"Expected one {name}"
        return values[0]


paths = {"/" + str(p.relative_to(ROOT)).replace("index.html", ""): p
         for p in [ROOT / "index.html", *ROOT.glob("*/index.html")]}
docs = {route: Document(path) for route, path in paths.items()}
docs["/404.html"] = Document(ROOT / "404.html")
urls = [e.text for e in ElementTree.parse(ROOT / "sitemap.xml").iter(
    "{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
assert len(urls) == len(set(urls))
assert set(urls) == {ORIGIN + route for route in paths}, "Sitemap must match public pages"
assert "Sitemap: " + ORIGIN + "/sitemap.xml" in (ROOT / "robots.txt").read_text()
assert "Disallow:" not in (ROOT / "robots.txt").read_text()
# Public ownership proofs must stay deployed while these search-console owners are active.
google_proof = "googlea7138364f93f69ce.html"
assert (ROOT / google_proof).read_text().strip() == "google-site-verification: " + google_proof
bing_proof = ElementTree.parse(ROOT / "BingSiteAuth.xml").getroot()
assert bing_proof.tag == "users" and bing_proof.findtext("user") == "4865810241C6F33DCA19E44E5EB15705"
assert len({doc.title for doc in docs.values()}) == len(docs), "Duplicate title"
assert len({doc.meta("description") for doc in docs.values()}) == len(docs)
links = 0
for route, doc in docs.items():
    assert 10 < len(doc.title) < 80, route
    assert len(doc.meta("description")) > 50, route
    assert sum(t == "h1" for t, _ in doc.tags) == 1, route
    policies = [a["content"] for t, a in doc.tags
                if t == "meta" and a.get("http-equiv") == "Content-Security-Policy"]
    assert len(policies) == 1, route
    csp = dict((parts[0], parts[1:]) for directive in policies[0].split(";")
               if (parts := directive.split()))
    for key in ("default-src", "base-uri", "form-action"):
        assert csp[key] == ["'none'"], (route, key)
    assert not any(word in policies[0] for word in ("unsafe-inline", "unsafe-eval", "*", "data:")), route
    if route == "/":
        assert csp["connect-src"] == ["https://api.github.com"]
    assert doc.meta("referrer") == "no-referrer", route
    assert not any(t in ("form", "iframe", "object", "embed", "base") for t, _ in doc.tags), route
    ids = [a["id"] for _, a in doc.tags if "id" in a]
    assert len(ids) == len(set(ids)), (route, "Duplicate id")
    if route == "/404.html":
        assert doc.meta("robots") == "noindex"
    else:
        assert not any("noindex" in a.get("content", "") for t, a in doc.tags if t == "meta"), route
        canonicals = [a.get("href") for t, a in doc.tags if t == "link" and a.get("rel") == "canonical"]
        assert canonicals == [ORIGIN + route], route
        assert doc.meta("og:url") == ORIGIN + route
        for key in ("og:title", "og:description", "og:image", "og:image:alt",
                    "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"):
            assert doc.meta(key), (route, key)
    for attrs, data in doc.scripts:
        if attrs.get("src"):
            assert "'self'" in csp.get("script-src", [])
            assert urlsplit(attrs["src"]).path in ("/film.js", "/install-copy.js", "/metrics.mjs",
                                                 "/tab-sharing-install.js", "/linux-downloads.mjs")
        else:
            assert attrs.get("type") == "application/ld+json", "Executable inline script"
            digest = base64.b64encode(hashlib.sha256(data.encode()).digest()).decode()
            assert f"'sha256-{digest}'" in csp.get("script-src", []), "CSP hash mismatch"
            schema = json.loads(data)
            app = next(item for item in schema["@graph"] if item["@type"] == "SoftwareApplication")
            assert app["name"] == "Botmap" and app["applicationCategory"] == "DeveloperApplication"
            assert "aggregateRating" not in app and "review" not in app, "Do not invent reviews"
            assert app["offers"][0]["price"] == "0"
            paid = app["offers"][1]["priceSpecification"]
            assert (paid["price"], paid["priceCurrency"], paid["billingDuration"]) == ("50", "USD", "P1M")
    for tag, attrs in doc.tags:
        assert not any(key.startswith("on") for key in attrs), "Inline event handler"
        for attr in ("href", "src", "poster"):
            if attr not in attrs:
                continue
            target = urlsplit(urljoin(ORIGIN + route, attrs[attr]))
            assert target.scheme in ("https", "mailto"), attrs[attr]
            if target.netloc != "trybotmap.com":
                assert tag == "a" or (tag == "link" and attrs.get("rel") == "canonical"), attrs[attr]
                continue
            path = unquote(target.path)
            file = ROOT / path.lstrip("/")
            if file.is_dir():
                file /= "index.html"
            assert file.is_file(), (route, attrs[attr], "Missing local target")
            if target.fragment:
                target_doc = docs.get(path)
                assert target_doc and any(a.get("id") == unquote(target.fragment) for _, a in target_doc.tags), attrs[attr]
            links += 1

llms = (ROOT / "llms.txt").read_text()
assert "/install-v1.0.2.tgz" in llms and "/install.tgz" not in llms
assert "not open source" in llms
assert "in Apple's review" not in llms
print(f"PASS: {len(paths)} sitemap pages, custom 404, {links} local references, metadata, schema and CSP")
