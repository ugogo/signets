# Signets

A personal, hosted gallery for browsing design reference media an owner has saved as X (Twitter) bookmarks — static images and short motion clips — used as inspiration when creating new products. ("Signets" is French for "bookmarks".)

## Language

**Shot**:
A single piece of design reference media, the atomic unit the owner browses. May be a photo, a video, or an animated GIF. A bookmarked post with several media assets yields several shots; a text-only bookmark yields none.
_Avoid_: Image, picture, pin, card, clip

**Kind**:
Whether a shot is a photo, a video, or an animated GIF. Determines wall overlays and how the shot plays in focus view.
_Avoid_: mediaType, format, mime

**Bookmark**:
A post the owner saved on X. The source from which shots are extracted. A bookmark is not itself browsable — it is the origin of one or more shots and the link back to X.
_Avoid_: Like, favorite, save

**Sync**:
The act of the companion extension reading the owner's current X bookmarks (in their logged-in browser session) and pushing them into Signets. Manual and on-demand; additive only — it upserts shots (adds new ones, refreshes metadata on existing ones) and never deletes. Re-syncs are incremental: scrolling stops once bookmarks older than the last successful sync are reached.
_Avoid_: Import, fetch, scrape, crawl, mirror

**Favorite**:
A shot the owner has flagged as a standout, browsable as its own subset of the library.
_Avoid_: Like, star, pin

**User**:
The person a library belongs to. Signets is single-user today, but every shot belongs to a user so multi-user is a later addition rather than a rewrite.
_Avoid_: Owner, account, member

**Library**:
The complete set of shots belonging to one user.
_Avoid_: Collection, gallery, board

**Author**:
The X account a shot came from, identified by handle. A way to slice the library — not a Signets-owned entity.
_Avoid_: Creator, user, account

**Wall**:
The default vertical masonry view of shots, ordered by bookmark date (newest first). Optimized for scanning and infinite scroll. Motion shots show a static poster with a play icon (video) or GIF badge; they do not autoplay here.
_Avoid_: Feed, grid, gallery

**Canvas**:
A spatial overview of the same library slice: shots on a pannable, zoomable plane for grasping volume and layout at a glance. A second lens on the library, not a separate collection. Same static-poster rules as the wall for motion shots.
_Avoid_: Map, overview, mood board
