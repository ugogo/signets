# Author routes for per-author browsing

When the owner picks an author from the home library, Signets navigates to `/authors/{handle}` instead of filtering in place on `/`. The home page stays the full **library**; an **author page** is a route-scoped slice of that library (search and favorites still apply within it). Selecting an author resets search/favorites — the author page starts clean. Unknown handles render a normal empty state, not a 404.
