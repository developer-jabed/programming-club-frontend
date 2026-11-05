/* eslint-disable @typescript-eslint/no-explicit-any */

// Adjust the field names here if your backend uses something else
export function getOwnerId(project: any): string | null {
  return (
    project?.ownerId ??
    project?.creatorId ??
    project?.createdById ??
    project?.owner?.id ??
    project?.creator?.id ??
    null
  );
}

export function isProjectOwner(project: any, userId?: string | null) {
  if (!userId) return false;
  return getOwnerId(project) === userId;
}

export function getMyMembership(project: any, userId?: string | null) {
  if (!userId) return null;
  const members: any[] = project?.members || [];
  return (
    members.find((m) => (m.userId ?? m.user?.id ?? m.id) === userId) ?? null
  );
}