# Single-user now, multi-user-ready; public gallery

> **Superseded by [0010-better-auth-private-library.md](./0010-better-auth-private-library.md).** Kept for history.

Signets is built for one user today but every shot is scoped to a **user** from day one, so turning on multi-user later is an addition, not a data migration. We do **not** build sign-up/login in the MVP.

The **sync endpoint** is protected by a shared secret token (only the user's extension can push). The **browsing UI is public** — anyone with the URL can view the wall — which is a deliberate choice that enables a future "share" feature (shareable links to a shot, a filtered view, or a whole wall). When we go multi-user/premium, we add real auth and revisit public-by-default vs. share-by-link.
