# Motion shots, media-centric schema, and incremental sync

Signets broadens **Shot** from photos-only to all design reference media: photos, native video, and animated GIFs. The Shot model is reworked around neutral **media** naming (`mediaId`, `postId`, `kind`, `mediaUrl`, `mediaPosterUrl`) instead of image-specific fields. Each shot is keyed by `(userId, mediaId)` where `mediaId` is the platform media identifier. Photos use `mediaUrl` alone; video and GIF store a poster URL for wall/canvas thumbnails and an MP4 in `mediaUrl` for focus playback (middle bitrate variant, ~480p–720p). MVP hotlinks all URLs from X, same trade-off as ADR 0003.

**bookmarkedAt** now means when the owner bookmarked the post on X, not when the post was published — required for incremental sync. After each successful sync the server stores the newest bookmark timestamp seen; the extension stops paginating once entries are older than that watermark.

**Display:** wall and canvas show static posters with a play overlay (video) or GIF badge (GIF). Focus view autoplays both, muted; video loops.

**Considered:** keeping `imageIndex` for within-post identity (rejected — order-dependent); wall-clock `lastSyncAt` as cutoff (rejected — use max bookmark timestamp instead); hosting video bytes on R2 in MVP (deferred — same hotlink-first path as photos).
