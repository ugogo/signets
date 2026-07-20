import { z } from 'zod';

export const shotKindSchema = z.enum(['photo', 'video', 'animated_gif']);

export type ShotKind = z.infer<typeof shotKindSchema>;
