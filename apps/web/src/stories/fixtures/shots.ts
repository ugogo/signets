import type { Shot } from '@signets/shared';

const now = '2026-07-17T12:00:00.000Z';

function createShot(overrides: Partial<Shot> & Pick<Shot, 'id' | 'authorHandle' | 'xPostId'>): Shot {
  return {
    authorName: null,
    bookmarkedAt: now,
    caption: null,
    createdAt: now,
    height: 800,
    imageIndex: 0,
    imageUrl: `https://picsum.photos/seed/${overrides.id}/640/800`,
    isFavorite: false,
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
    imageIndex: 1,
    xPostId: '1000000000000000001',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111102',
    authorHandle: 'designstudio',
    caption: 'Card grid exploration for a productivity app.',
    height: 640,
    imageUrl: 'https://picsum.photos/seed/11111111-1111-4111-8111-111111111102/960/640',
    width: 960,
    xPostId: '1000000000000000002',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111103',
    authorHandle: 'uxpatterns',
    authorName: 'UX Patterns',
    caption: 'Navigation patterns for dense admin tools.',
    isFavorite: true,
    imageIndex: 2,
    xPostId: '1000000000000000003',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111104',
    authorHandle: 'uxpatterns',
    height: null,
    imageUrl: 'https://picsum.photos/seed/11111111-1111-4111-8111-111111111104/640/512',
    width: null,
    xPostId: '1000000000000000004',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111105',
    authorHandle: 'typefoundry',
    authorName: 'Type Foundry',
    caption: 'Editorial landing page with oversized display type.',
    imageIndex: 3,
    xPostId: '1000000000000000005',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111106',
    authorHandle: 'typefoundry',
    caption: 'Monochrome poster series for a music festival.',
    isFavorite: true,
    xPostId: '1000000000000000006',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111107',
    authorHandle: 'mobilecraft',
    authorName: 'Mobile Craft',
    caption: 'Onboarding flow with illustration-led empty states.',
    imageIndex: 1,
    xPostId: '1000000000000000007',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111108',
    authorHandle: 'mobilecraft',
    xPostId: '1000000000000000008',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111109',
    authorHandle: 'designstudio',
    caption: 'Settings screen with segmented controls and toggles.',
    imageIndex: 2,
    xPostId: '1000000000000000009',
  }),
  createShot({
    id: '11111111-1111-4111-8111-111111111110',
    authorHandle: 'uxpatterns',
    caption: 'Filter panel layout for inspiration libraries.',
    xPostId: '1000000000000000010',
  }),
];

export const mockAuthors = [...new Set(mockShots.map((shot) => shot.authorHandle))].sort();

export const emptyShots: Shot[] = [];
