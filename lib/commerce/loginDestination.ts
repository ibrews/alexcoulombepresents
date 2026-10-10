// Only explicit internal destinations can survive a magic-link round trip.
export function loginDestination(value: unknown): string {
  return value === "/members/second-brain" ? value : "/account";
}
