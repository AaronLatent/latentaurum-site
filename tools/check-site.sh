#!/usr/bin/env bash
# Checks the site before GitHub publishes it. GitHub runs this on every push (see .github/workflows/publish.yml),
# and stops the publish if anything below fails. It changes nothing.
# To run it on your own computer: open Git Bash in this folder and type   bash tools/check-site.sh
set -u
cd "$(dirname "$0")/.."
SITE=site
DECK=hidden-gold-rvqwyb
FAIL=0
stop() { echo "  [STOP] $*"; FAIL=1; }
note() { echo "  [NOTE] $*"; }

echo
echo "Checking the Latent Aurum site before it goes online..."
echo

for f in index.html faq.html contact.html legal.html 404.html robots.txt sitemap.xml llms.txt; do
  [ -f "$SITE/$f" ] || stop "$SITE/$f is missing."
done

grep -q 'info@latentaurum.com' "$SITE/index.html" 2>/dev/null || stop "The contact email is missing from index.html."
grep -l 'REPLACE-WITH-LIVE-URL' "$SITE"/*.html >/dev/null 2>&1 && stop "A placeholder web address is still in a page."

# The contact form sends through EmailJS (settings at the top of site.js). With JavaScript switched off it opens
# the visitor's email app instead, addressed to us, so that fallback has to stay.
grep -q 'action="mailto:info@latentaurum.com"' "$SITE/contact.html" 2>/dev/null || stop "The contact form in contact.html no longer opens an email to info@latentaurum.com when JavaScript is off."
grep -q "service: 'service_" "$SITE/assets/js/site.js" 2>/dev/null || stop "The EmailJS service ID is missing from the top of site.js."
grep -q -E "(template|publicKey): ''" "$SITE/assets/js/site.js" 2>/dev/null \
  && note "EmailJS is not finished: the template ID or public key at the top of site.js is empty, so the contact form opens the visitor's email app for now. This does not stop the publish."

# The privacy and legal page has to be finished and checked before the site goes live.
grep -q 'draft-note' "$SITE/legal.html" 2>/dev/null && stop 'legal.html has a "Draft for review" box. Delete it before publishing.'
if grep -q 'class="todo"' "$SITE"/*.html 2>/dev/null; then
  stop "legal.html still has gaps in gold square brackets. Fill them in:"
  grep -n -o '<span class="todo">[^<]*</span>' "$SITE"/*.html | sed 's/^/           /'
fi

# Every file the pages ask for has to be there.
missing=$( { grep -h -o -E '(src|href|poster|data-src|data-src-large|data-webm|data-mp4|data-webm-large|data-mp4-large)="assets/[^"]+"' "$SITE"/index.html "$SITE"/faq.html "$SITE"/contact.html "$SITE"/legal.html \
               | sed -E 's/^[a-z0-9-]+="//; s/"$//'
             grep -h -o -E 'srcset="[^"]+"' "$SITE"/index.html "$SITE"/legal.html | sed -E 's/srcset="//; s/"$//' | tr ',' '\n' | awk '{print $1}'
           } | sort -u | while read -r p; do
               [ "$p" = "assets/images/linkedin-logo.png" ] && continue
               [ -f "$SITE/$p" ] || echo "$p"
             done )
if [ -n "$missing" ]; then stop "Files the page asks for are missing:"; echo "$missing" | sed 's/^/           /'; fi

# GitHub refuses files over 100 MB, and big files make the page slow.
big=$(find . -path ./.git -prune -o -type f -size +90M -print)
[ -n "$big" ] && stop "These files are over 90 MB. GitHub refuses files over 100 MB: $big"

# The private page: nothing may link to it, and it must stay locked. Private working files never belong in this folder.
grep -l "$DECK" "$SITE"/*.html "$SITE"/assets/js/*.js "$SITE"/assets/css/*.css "$SITE"/robots.txt "$SITE"/sitemap.xml "$SITE"/llms.txt >/dev/null 2>&1 \
  && stop "A page, the script, the styles, robots.txt, sitemap.xml or llms.txt mentions the private folder. Remove it so the page stays hidden."
private=$(grep -rlI --exclude-dir=.git -e 'const GA''TE = ' -e 'id="vid-co''ver"' . 2>/dev/null)
if [ -n "$private" ]; then
  stop "A private working file is in this folder. Move it back to where you keep it on your computer:"
  echo "$private" | sed 's/^/           /'
fi
P="$SITE/$DECK/index.html"
if [ ! -f "$P" ]; then
  stop "$P is missing."
elif grep -q 'data-placeholder' "$P"; then
  stop "The private page is not locked yet. Lock it with the lock tool on your computer and save the locked page over site\\$DECK\\index.html"
elif ! grep -q 'data-locked' "$P" || grep -q -E 'class="([^"]* )?(cover-note|disclaimer)( [^"]*)?"|id="vid-co''ver"|Confidential' "$P"; then
  stop "site\\$DECK\\index.html is not a locked page. Never put the open version in this folder."
elif ! grep -q 'name="robots" content="noindex' "$P"; then
  stop "site\\$DECK\\index.html has lost its noindex line, so search engines could list it. Lock the page again with the lock tool on your computer."
fi

# The data blocks at the top of index.html and faq.html (what search engines and AI read about the company) must be
# readable, and every question in faq.html's block must also be on that page, word for word. Change both together.
if command -v python3 >/dev/null 2>&1; then
  python3 - "$SITE/index.html" "$SITE/faq.html" <<'PY' || stop "A data block at the top of index.html or faq.html is broken, or the questions in it no longer match the Questions page."
import sys, json, re, html
for f in sys.argv[1:]:
  s = open(f, encoding="utf-8").read()
  m = re.search(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
  g = json.loads(m.group(1))
  page = html.unescape(re.sub(r"<[^>]+>", "", s.replace(m.group(0), "")))
  for n in g["@graph"]:
    if n.get("@type") == "FAQPage":
        for q in n["mainEntity"]:
            for t in (q["name"], q["acceptedAnswer"]["text"]):
                if t not in page:
                    print("  not on the page:", t[:70]); sys.exit(1)
PY
fi

[ -f "$SITE/assets/images/linkedin-logo.png" ] || note "No LinkedIn logo yet, so the footer says LinkedIn in words. This does not stop the publish."

echo
if [ "$FAIL" = 1 ]; then
  echo "  Not ready. Fix the lines above, then push again."
  exit 1
fi
echo "  All clear."
