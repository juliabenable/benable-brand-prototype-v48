#!/bin/bash
# sync-invite.sh — public/invite-creators/ is OUR cleaned copy of Amine's v2 popup (V1 only, fixes
# in its README.md), forked from AmineBenjil/invite-creators-prototype-v2 @2cd968a on Oct 22.
# A plain re-copy would wipe those fixes, so by default this only shows what Amine changed since:
#   bash scripts/sync-invite.sh          # diff his latest against the fork point, nothing written
#   bash scripts/sync-invite.sh --stat   # just the file list
# Port anything wanted by hand.
set -e
cd "$(dirname "$0")/.."
REPO=AmineBenjil/invite-creators-prototype-v2
BASE=2cd968a
TMP=$(mktemp -d)
gh repo clone "$REPO" "$TMP/src" -- -q
echo "Amine's latest: $(git -C "$TMP/src" log -1 --format='%h %cI %s')"
if [ "$1" = "--stat" ]; then git -C "$TMP/src" diff --stat "$BASE" HEAD
else git -C "$TMP/src" log --oneline "$BASE"..HEAD; git -C "$TMP/src" diff "$BASE" HEAD -- index.html app.js styles.css mock-api.js; fi
rm -rf "$TMP"
