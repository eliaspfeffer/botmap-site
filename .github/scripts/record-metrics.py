"""Publish one UTC snapshot per day on the metrics-history branch."""
import base64
import json
import subprocess
from datetime import datetime, timezone
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import os

REPO = "repos/eliaspfeffer/botmap-site"
FILE = REPO + "/contents/metrics-history.json"
BRANCH = "metrics-history"


def gh(path, *args):
    return subprocess.check_output(["gh", "api", path, *args], text=True)


def main():
    now = datetime.now(timezone.utc)
    req = Request(f"https://api.github.com/{FILE}?ref={BRANCH}", headers={
        "Authorization": "Bearer " + os.environ["GH_TOKEN"],
        "Accept": "application/vnd.github+json",
    })
    try:
        with urlopen(req, timeout=20) as response:
            previous = json.load(response)
    except HTTPError as error:
        if error.code != 404:
            raise
        previous = None
    snapshots = json.loads(base64.b64decode(previous["content"])) if previous else []
    date = now.date().isoformat()
    if snapshots and snapshots[-1]["at"][:10] >= date:
        print(f"Snapshot already exists for {date}.")
        return

    stars = int(gh("repos/eliaspfeffer/botmap", "--jq", ".stargazers_count"))
    if stars < 0:
        raise ValueError("GitHub returned an invalid star count.")
    snapshot = {"at": now.isoformat(timespec="seconds"), "stars": stars}
    snapshots.append(snapshot)
    content = base64.b64encode((json.dumps(snapshots, separators=(",", ":")) + "\n").encode()).decode()
    fields = {"branch": BRANCH, "message": f"Record Botmap metrics for {date}", "content": content}
    if previous:
        fields["sha"] = previous["sha"]
    args = [flag for name, value in fields.items() for flag in ("-f", f"{name}={value}")]
    gh(FILE, "--method", "PUT", *args)
    print(json.dumps(snapshot))


if __name__ == "__main__":
    main()
