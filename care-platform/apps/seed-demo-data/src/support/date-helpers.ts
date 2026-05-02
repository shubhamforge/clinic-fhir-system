export const anchor = new Date();
export const daysAgo = (n: number): string =>
  new Date(anchor.getTime() - n * 86_400_000).toISOString().split('T')[0];
export const daysAhead = (n: number): string =>
  new Date(anchor.getTime() + n * 86_400_000).toISOString().split('T')[0];
