import type { Market } from '../src/types';

/** When there are no votes yet, both yields display at 0% until the first vote. */
export function marketYieldFromVotes(
  m: Pick<Market, 'votesYes' | 'votesNo'>,
): { yesPct: number; noPct: number; totalVotes: number; awaitingVotes: boolean } {
  const totalVotes = m.votesYes + m.votesNo;
  if (totalVotes === 0) {
    return { yesPct: 0, noPct: 0, totalVotes: 0, awaitingVotes: true };
  }
  const yesPct = Math.round((m.votesYes / totalVotes) * 100);
  return { yesPct, noPct: 100 - yesPct, totalVotes, awaitingVotes: false };
}
