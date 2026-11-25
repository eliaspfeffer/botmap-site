"""Publish the switch once the public Chrome Web Store page offers installation."""
import base64
import json
import subprocess
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ITEM_ID = "lbnbnalehdcghbfhipnecfamlabcbmek"
STORE = "chromewebstore.google.com"
BRANCH = "tab-sharing-store"
FILE = "repos/eliaspfeffer/botmap-site/contents/tab-sharing-store.json"
CHROME = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
          "(KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36")


def is_installable(url, html):
    location = urlsplit(url)
    parts = location.path.strip("/").split("/")
    return (
        location.scheme == "https"
        and location.hostname == STORE
        and len(parts) == 3
        and parts[0] == "detail"
        and parts[1] not in ("", "empty-title")
        and parts[2] == ITEM_ID
        and 'content="Botmap Tab Sharing - Chrome Web Store"' in html
        and ">Add to Chrome<" in html
    )


def gh(*args):
    return subprocess.check_output(["gh", "api", *args], text=True)


def main():
    marker = json.loads(gh(f"{FILE}?ref={BRANCH}"))
    old_status = json.loads(base64.b64decode(marker["content"]))
    if old_status["available"]:
        print("The installer already points to the Chrome Web Store.")
        return

    request = Request(f"https://{STORE}/detail/{ITEM_ID}?hl=en", headers={"User-Agent": CHROME})
    with urlopen(request, timeout=15) as response:
        available = is_installable(response.url, response.read().decode())
    if not available:
        print("Chrome does not yet show an install button. The preview stays available.")
        return

    content = base64.b64encode(b'{"available":true}\n').decode()
    gh(FILE, "--method", "PUT", "-f", f"branch={BRANCH}", "-f", f"sha={marker['sha']}",
       "-f", "message=Switch Tab Sharing installation to Chrome Web Store", "-f", f"content={content}")
    print("Confirmed the listing and install button. The public link will open the store.")


if __name__ == "__main__":
    main()
