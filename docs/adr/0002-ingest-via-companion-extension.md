# Ingest bookmarks via a companion browser extension, not the official X API

Bookmarks enter Signets through a **companion Chrome MV3 extension** (works in Chrome and Dia) that intercepts X's internal GraphQL `Bookmarks` responses while the owner scrolls their logged-in bookmarks page, then pushes the batch to a token-guarded sync endpoint.

We chose this over the **official X API bookmarks endpoint** even though the API is cheap (~$0.001/read) and ToS-clean, because: (1) the API only returns the **800 most-recent** bookmarks, (2) it requires a developer account + saved payment method + credit balance, and (3) the free X data-archive export does **not** include bookmarks at all. The extension uses the owner's real browser session, so it has no per-user cap, needs no dev account, and is robust against X's cosmetic UI changes (it reads the JSON API, not the DOM). Trade-off accepted: this is a ToS-gray, self-run tool, and we maintain the extension against X's internal API shape.
