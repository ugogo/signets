# Hotlink X media in the MVP; host on R2 later

The MVP stores only shot **metadata + X image URLs** (`pbs.twimg.com/...?name=<size>`) and hotlinks them for display; it does not download image bytes. This contradicts the durable-archive goal at the *pixel* level — a deleted post or suspended author yields a broken image, and hosting later does not recover images that have already 404'd. We accept this for the MVP because it is zero-storage and gives sized thumbnail variants for free via the `name=` param.

The shot schema reserves a nullable `hostedImageKey` so R2-backed hosting can light up without a migration. The long-term intent is a free tier (live-sync/hotlink) and a premium tier (images auto-hosted on R2, plus owner-uploaded shots). The durable-archive decision still holds at the **record** level: shot records persist (upsert-only, manual delete); only the pixels lean on X's CDN until hosting ships.
