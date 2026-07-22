import type { Shot } from '@signets/shared';

const now = '2026-07-17T12:00:00.000Z';

function createShot(
  overrides: Partial<Shot> & Pick<Shot, 'authorHandle' | 'id' | 'postId'>,
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
    authorHandle: 'designstudio',
    authorName: 'Design Studio',
    caption: 'Minimal dashboard with soft gradients and tight typography.',
    id: '11111111-1111-4111-8111-111111111101',
    isFavorite: true,
    mediaId: 'media-101',
    postId: '1000000000000000001',
  }),
  createShot({
    authorHandle: 'designstudio',
    caption: 'Card grid exploration for a productivity app.',
    height: 640,
    id: '11111111-1111-4111-8111-111111111102',
    mediaId: 'media-102',
    mediaUrl:
      'https://picsum.photos/seed/11111111-1111-4111-8111-111111111102/960/640',
    postId: '1000000000000000002',
    width: 960,
  }),
  createShot({
    authorHandle: 'uxpatterns',
    authorName: 'UX Patterns',
    caption: 'Navigation patterns for dense admin tools.',
    id: '11111111-1111-4111-8111-111111111103',
    isFavorite: true,
    kind: 'video',
    mediaId: 'media-103',
    mediaPosterUrl:
      'https://picsum.photos/seed/11111111-1111-4111-8111-111111111103/640/800',
    mediaUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    postId: '1000000000000000003',
  }),
  createShot({
    authorHandle: 'uxpatterns',
    height: null,
    id: '11111111-1111-4111-8111-111111111104',
    mediaId: 'media-104',
    mediaUrl:
      'https://picsum.photos/seed/11111111-1111-4111-8111-111111111104/640/512',
    postId: '1000000000000000004',
    width: null,
  }),
  createShot({
    authorHandle: 'typefoundry',
    authorName: 'Type Foundry',
    caption: 'Editorial landing page with oversized display type.',
    id: '11111111-1111-4111-8111-111111111105',
    kind: 'animated_gif',
    mediaId: 'media-105',
    mediaPosterUrl:
      'https://picsum.photos/seed/11111111-1111-4111-8111-111111111105/640/800',
    mediaUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    postId: '1000000000000000005',
  }),
  createShot({
    authorHandle: 'typefoundry',
    caption: 'Monochrome poster series for a music festival.',
    id: '11111111-1111-4111-8111-111111111106',
    isFavorite: true,
    mediaId: 'media-106',
    postId: '1000000000000000006',
  }),
  createShot({
    authorHandle: 'mobilecraft',
    authorName: 'Mobile Craft',
    caption: 'Onboarding flow with illustration-led empty states.',
    id: '11111111-1111-4111-8111-111111111107',
    mediaId: 'media-107',
    postId: '1000000000000000007',
  }),
  createShot({
    authorHandle: 'mobilecraft',
    id: '11111111-1111-4111-8111-111111111108',
    mediaId: 'media-108',
    postId: '1000000000000000008',
  }),
  createShot({
    authorHandle: 'designstudio',
    caption: 'Settings screen with segmented controls and toggles.',
    id: '11111111-1111-4111-8111-111111111109',
    mediaId: 'media-109',
    postId: '1000000000000000009',
  }),
  createShot({
    authorHandle: 'uxpatterns',
    caption: 'Filter panel layout for inspiration libraries.',
    id: '11111111-1111-4111-8111-111111111110',
    mediaId: 'media-110',
    postId: '1000000000000000010',
  }),
];

export const mockAuthors = [
  ...new Set(mockShots.map((shot) => shot.authorHandle)),
].sort();

export const emptyShots: Shot[] = [];
