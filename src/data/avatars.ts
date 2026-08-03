export interface ProfileAvatar {
  id: string;
  image: string;
  order: number;
}

export const PROFILE_AVATARS: ProfileAvatar[] = [
  { id: "avatar-1", image: "/avatars/avatar-1.webp", order: 1 },
  { id: "avatar-2", image: "/avatars/avatar-2.webp", order: 2 },
  { id: "avatar-3", image: "/avatars/avatar-3.webp", order: 3 },
  { id: "avatar-4", image: "/avatars/avatar-4.webp", order: 4 },
  { id: "avatar-5", image: "/avatars/avatar-5.webp", order: 5 },
  { id: "avatar-6", image: "/avatars/avatar-6.webp", order: 6 },
  { id: "avatar-7", image: "/avatars/avatar-7.webp", order: 7 },
  { id: "avatar-8", image: "/avatars/avatar-8.webp", order: 8 },
  { id: "avatar-9", image: "/avatars/avatar-9.webp", order: 9 },
  { id: "avatar-10", image: "/avatars/avatar-10.webp", order: 10 },
  { id: "avatar-11", image: "/avatars/avatar-11.webp", order: 11 },
  { id: "avatar-12", image: "/avatars/avatar-12.webp", order: 12 },
  { id: "avatar-13", image: "/avatars/avatar-13.webp", order: 13 },
  { id: "avatar-14", image: "/avatars/avatar-14.webp", order: 14 },
  { id: "avatar-15", image: "/avatars/avatar-15.webp", order: 15 },
  { id: "avatar-16", image: "/avatars/avatar-16.webp", order: 16 },
  { id: "avatar-17", image: "/avatars/avatar-17.webp", order: 17 },
  { id: "avatar-18", image: "/avatars/avatar-18.webp", order: 18 },
  { id: "avatar-19", image: "/avatars/avatar-19.webp", order: 19 },
  { id: "avatar-20", image: "/avatars/avatar-20.webp", order: 20 },
  { id: "avatar-21", image: "/avatars/avatar-21.webp", order: 21 },
  { id: "avatar-22", image: "/avatars/avatar-22.webp", order: 22 },
];

const avatarsByUrl = new Map(PROFILE_AVATARS.map((avatar) => [avatar.image, avatar]));

export function isAllowedAvatarUrl(value: unknown): value is string {
  return typeof value === "string" && avatarsByUrl.has(value);
}

export function getAvatarByUrl(value: string | null | undefined): ProfileAvatar | undefined {
  return value ? avatarsByUrl.get(value) : undefined;
}

export function getDefaultAvatar(): ProfileAvatar | undefined {
  return PROFILE_AVATARS[0];
}
