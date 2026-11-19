"""Collect read-only checks and update the public, date-keyed CSV."""

import argparse
import csv
from datetime import date, datetime, timedelta, timezone
import http.client
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess


HOST = "mosaic-objects.vercel.app"
KST = timezone(timedelta(hours=9))
CHECKS = {
    "https_home": "공개 홈 HTTPS 응답",
    "hsts": "HSTS 헤더",
    "nosniff": "X-Content-Type-Options 헤더",
    "tracked_sensitive_files": "민감한 파일명 Git 추적",
    "public_secret_variables": "브라우저 공개 변수명",
    "npm_high_critical": "운영 npm 의존성 High/Critical",
}
FIELDS = ("date_kst", "checked_at_kst", "overall", *CHECKS, "commit", "actions_run")


def check_https():
    connection = http.client.HTTPSConnection(HOST, timeout=12)
    try:
        connection.request("HEAD", "/", headers={"User-Agent": "mosaic-shop-daily-check/1"})
        response = connection.getresponse()
        if not 200 <= response.status < 300:
            return {
                "https_home": "ERROR" if response.status >= 500 else "REVIEW",
                "hsts": "SKIP",
                "nosniff": "SKIP",
            }
        hsts = response.getheader("Strict-Transport-Security", "")
        max_age = re.search(r"(?:^|;)\s*max-age\s*=\s*(\d+)\s*(?:;|$)", hsts, re.I)
        nosniff = response.getheader("X-Content-Type-Options", "").strip().lower()
        return {
            "https_home": "PASS",
            "hsts": "PASS" if max_age and int(max_age.group(1)) > 0 else "REVIEW",
            "nosniff": "PASS" if nosniff == "nosniff" else "REVIEW",
        }
    except (OSError, http.client.HTTPException):
        return {"https_home": "ERROR", "hsts": "SKIP", "nosniff": "SKIP"}
    finally:
        connection.close()


def check_git():
    files = subprocess.run(
        ["git", "ls-files", "-z"], capture_output=True, check=True, timeout=10
    ).stdout.decode(errors="replace")
    names = {PurePosixPath(path).name.lower() for path in files.split("\0") if path}
    sensitive = any(
        name in {".env", "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519"}
        or (name.startswith(".env.") and name != ".env.example")
        or name.endswith((".pem", ".key", ".p12", ".pfx"))
        for name in names
    )
    result = subprocess.run(
        [
            "git", "grep", "-q", "-E",
            "NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE|PASSWORD|PRIVATE_KEY|ACCESS_TOKEN)",
            "--", "src", ".env.example", "next.config.ts",
        ],
        capture_output=True, timeout=10,
    )
    match_status = {0: "REVIEW", 1: "PASS"}
    return {
        "tracked_sensitive_files": "REVIEW" if sensitive else "PASS",
        "public_secret_variables": match_status.get(result.returncode, "ERROR"),
    }


def check_npm():
    try:
        audit = subprocess.run(
            [
                "npm", "audit", "--package-lock-only", "--omit=dev", "--audit-level=high",
                "--json", "--registry=https://registry.npmjs.org/",
                "--fetch-retries=1", "--fetch-timeout=12000",
            ],
            capture_output=True, timeout=60,
        )
        if audit.returncode not in (0, 1):
            return "ERROR"
        counts = json.loads(audit.stdout)["metadata"]["vulnerabilities"]
        high, critical = counts["high"], counts["critical"]
        if any(type(count) is not int or count < 0 for count in (high, critical)):
            return "ERROR"
        if high or critical:
            return "REVIEW"
        return "PASS" if audit.returncode == 0 else "ERROR"
    except (OSError, subprocess.SubprocessError, ValueError, KeyError, TypeError):
        return "ERROR"


def collect():
    row = check_https()
    try:
        row.update(check_git())
    except (OSError, subprocess.SubprocessError):
        row.update(tracked_sensitive_files="ERROR", public_secret_variables="ERROR")
    row["npm_high_critical"] = check_npm()
    statuses = set(row.values())
    now = datetime.now(KST)
    row.update(
        date_kst=now.date().isoformat(),
        checked_at_kst=now.isoformat(timespec="seconds"),
        overall="ERROR" if "ERROR" in statuses else "REVIEW" if "REVIEW" in statuses else "PASS",
        commit=os.environ.get("GITHUB_SHA") or subprocess.check_output(
            ["git", "rev-parse", "HEAD"], text=True
        ).strip(),
        actions_run="",
    )
    if os.environ.get("GITHUB_RUN_ID"):
        row["actions_run"] = (
            f"{os.environ['GITHUB_SERVER_URL']}/{os.environ['GITHUB_REPOSITORY']}"
            f"/actions/runs/{os.environ['GITHUB_RUN_ID']}"
        )
    data = json.dumps(row, separators=(",", ":"))
    if filename := os.environ.get("GITHUB_OUTPUT"):
        with open(filename, "a", encoding="utf-8") as output:
            output.write(f"row={data}\nstatus={row['overall']}\n")
    else:
        print(data)
    if filename := os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(filename, "a", encoding="utf-8") as summary:
            summary.write(f"## 일일 보안 점검 · {row['date_kst']} KST\n\n")
            summary.write(f"종합 결과 **{row['overall']}**\n\n")
            summary.write("| 점검 항목 | 상태 |\n| --- | --- |\n")
            for key, label in CHECKS.items():
                summary.write(f"| {label} | {row[key]} |\n")
            summary.write(
                f"\n[날짜별 CSV]({os.environ['GITHUB_SERVER_URL']}/{os.environ['GITHUB_REPOSITORY']}"
                "/blob/security-reports/daily-security-check.csv)\n"
            )
    if row["overall"] == "REVIEW" and os.environ.get("GITHUB_ACTIONS"):
        print("::warning::Review one or more items in the daily security check summary.")


def update_archive(path):
    row = json.loads(os.environ["SECURITY_CHECK_ROW"])
    if set(row) != set(FIELDS) or not all(isinstance(value, str) for value in row.values()):
        raise ValueError("Unexpected security check row")
    if path.is_symlink():
        raise ValueError("The report must be a regular CSV file")

    history = {}
    if path.exists():
        with path.open(encoding="utf-8-sig", newline="") as file:
            reader = csv.DictReader(file)
            if tuple(reader.fieldnames or ()) != FIELDS:
                raise ValueError("Unexpected report columns")
            for previous in reader:
                key = date.fromisoformat(previous["date_kst"])
                if None in previous or None in previous.values() or key in history:
                    raise ValueError("Invalid or duplicate date in report")
                history[key] = previous

    key = date.fromisoformat(row["date_kst"])
    if key in history and row["checked_at_kst"] < history[key]["checked_at_kst"]:
        return
    history[key] = row
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, FIELDS)
        writer.writeheader()
        writer.writerows(history[key] for key in sorted(history, reverse=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("collect")
    archive = commands.add_parser("archive")
    archive.add_argument("path", type=Path)
    args = parser.parse_args()
    if args.command == "collect":
        collect()
    else:
        update_archive(args.path)
