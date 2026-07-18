# Signets

A personal, hosted gallery for browsing the design images an owner has saved as X (Twitter) bookmarks, used as inspiration when creating new products. ("Signets" is French for "bookmarks".)

## Language

**Shot**:
A single design image, the atomic unit the owner browses. A bookmarked post with several images yields several shots; a text-only bookmark yields none.
_Avoid_: Image, picture, pin, card

**Bookmark**:
A post the owner saved on X. The source from which shots are extracted. A bookmark is not itself browsable — it is the origin of one or more shots and the link back to X.
_Avoid_: Like, favorite, save

**Sync**:
The act of the companion extension reading the owner's current X bookmarks (in their logged-in browser session) and pushing them into Signets. Manual and on-demand; additive only — it upserts shots (adds new ones, refreshes metadata on existing ones) and never deletes.
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

**Author page**:
A library view scoped to one author's shots, at `/authors/{handle}`. Still part of the library; the route fixes the author filter.
_Avoid_: Profile, channel, collection page

**Wall**:
The default vertical masonry view of shots, ordered by bookmark date (newest first). Optimized for scanning and infinite scroll.
_Avoid_: Feed, grid, gallery

**Canvas**:
A spatial overview of the same library slice: shots on a pannable, zoomable plane for grasping volume and layout at a glance. A second lens on the library, not a separate collection.
_Avoid_: Map, overview, mood board
