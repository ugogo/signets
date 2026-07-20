import type { Shot } from '@signets/shared';

const now = '2026-07-17T12:00:00.000Z';

function createShot(
  overrides: Partial<Shot> & Pick<Shot, 'id' | 'authorHandle' | 'postId'>,
): Shot {
  return {
    authorName: null,
    bookmarkedAt: now,
    caption: null,
    createdAt: now,
    height: 800,
    isFavorite: false,
    kind: 'photo',
    mediaId: overrides.id,
    mediaPosterUrl: null,
    mediaUrl: `https://picsum.photos/seed/${overrides.id}/640/800`,
    updatedAt: now,
    width: 640,
    ...overrides,
  };
}

export const mockShots: Shot[] = [
  createShot({
    id: '11111111-1111-4111-8111-111111111101',
    authorHandle: 'designstudio',
    authorName: 'Design Studio',
    caption: 'Minimal dashboard with soft gradients and tight typography.',
    isFavorite: true,
    mediaId: 'media-101',
    postId: '1000000000000000001',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111102',
    authorHandle: 'designstudio',
    caption: 'Card grid exploration for a productivity app.',
    height: 640,
    mediaId: 'media-102',
    mediaUrl: 'https://picsum.photos/seed/11111111-1111-4111-8111-111111111102/960/640',
    postId: '1000000000000000002',
    width: 960,
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111103',
    authorHandle: 'uxpatterns',
    authorName: 'UX Patterns',
    caption: 'Navigation patterns for dense admin tools.',
    isFavorite: true,
    kind: 'video',
    mediaId: 'media-103',
    mediaPosterUrl: 'https://picsum.photos/seed/11111111-1111-4111-8111-111111111103/640/800',
    mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    postId: '1000000000000000003',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111104',
    authorHandle: 'uxpatterns',
    height: null,
    mediaId: 'media-104',
    mediaUrl: 'https://picsum.photos/seed/11111111-1111-4111-8111-111111111104/640/512',
    postId: '1000000000000000004',
    width: null,
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111105',
    authorHandle: 'typefoundry',
    authorName: 'Type Foundry',
    caption: 'Editorial landing page with oversized display type.',
    kind: 'animated_gif',
    mediaId: 'media-105',
    mediaPosterUrl: 'https://picsum.photos/seed/11111111-1111-4111-8111-111111111105/640/800',
    mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    postId: '1000000000000000005',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111106',
    authorHandle: 'typefoundry',
    caption: 'Monochrome poster series for a music festival.',
    isFavorite: true,
    mediaId: 'media-106',
    postId: '1000000000000000006',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111107',
    authorHandle: 'mobilecraft',
    authorName: 'Mobile Craft',
    caption: 'Onboarding flow with illustration-led empty states.',
    mediaId: 'media-107',
    postId: '1000000000000000007',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111108',
    authorHandle: 'mobilecraft',
    mediaId: 'media-108',
    postId: '1000000000000000008',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111109',
    authorHandle: 'designstudio',
    caption: 'Settings screen with segmented controls and toggles.',
    mediaId: 'media-109',
    postId: '1000000000000000009',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111110',
    authorHandle: 'uxpatterns',
    caption: 'Filter panel layout for inspiration libraries.',
    mediaId: 'media-110',
    postId: '1000000000000000010',
  }),
];

export const mockAuthors = [...new Set(mockShots.map((shot) => shot.authorHandle))].sort();

export const emptyShots: Shot[] = [];
