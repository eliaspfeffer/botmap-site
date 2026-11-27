"""Publish the Botmap beta link when Apple's public page offers enrollment."""
import base64
import json
import os
import re
import subprocess
from urllib.request import Request, urlopen

BRANCH = "testflight-availability"


def is_installable(invite, html):
    deep_link = re.escape(invite.replace("https:", "itms-beta:", 1))
    return (
        "<title>Join the Botmap beta - TestFlight - Apple</title>" in html
        and re.search(rf'<a\b[^>]*\bhref="{deep_link}"[^>]*>\s*View in TestFlight\s*</a>', html) is not None
    )


def gh(*args):
    return subprocess.check_output(["gh", "api", *args], text=True)


def main():
    invite = os.environ["BOTMAP_TESTFLIGHT_INVITE"]
    if not re.fullmatch(r"https://testflight\.apple\.com/join/[A-Za-z0-9]+", invite):
        raise SystemExit("Invalid TestFlight invitation URL.")

    request = Request(invite, headers={"Accept-Language": "en-US,en;q=0.9"})
    with urlopen(request, timeout=15) as response:
        available = response.url == invite and is_installable(invite, response.read(1_000_000).decode())

    endpoint = f"repos/{os.environ['GITHUB_REPOSITORY']}/contents/testflight.json"
    marker = json.loads(gh(f"{endpoint}?ref={BRANCH}"))
    state = {"invite": invite if available else None}
    if json.loads(base64.b64decode(marker["content"])) != state:
        content = base64.b64encode((json.dumps(state) + "\n").encode()).decode()
        gh(endpoint, "--method", "PUT", "-f", f"branch={BRANCH}", "-f", f"sha={marker['sha']}",
           "-f", "message=Update Botmap iPhone beta availability", "-f", f"content={content}")

    print("TestFlight is accepting testers." if available else "TestFlight enrollment is unavailable.")


if __name__ == "__main__":
    main()
