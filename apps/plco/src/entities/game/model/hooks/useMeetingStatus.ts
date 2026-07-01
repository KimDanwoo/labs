'use client';

import { useAtomValue } from 'jotai';
import { MEETING_COOLDOWN_MS, MEETING_DAILY_LIMIT } from '@shared/constants';
import { formatDateKey, useCooldown } from '@shared/lib';
import { lastMeetingAtAtom, meetingsTodayAtom, meetingDayAtom } from '../store';

export type MeetingStatus = {
  canMeet: boolean;
  cooldownRemainingMs: number;
  meetingsToday: number;
  dailyLimit: number;
  reachedDailyLimit: boolean;
};

export function useMeetingStatus(): MeetingStatus {
  const lastMeetingAt = useAtomValue(lastMeetingAtAtom);
  const meetingsToday = useAtomValue(meetingsTodayAtom);
  const meetingDay = useAtomValue(meetingDayAtom);
  const { now, remainingMs } = useCooldown(lastMeetingAt, MEETING_COOLDOWN_MS);

  const today = formatDateKey(new Date(now));
  const todaysCount = meetingDay === today ? meetingsToday : 0;
  const reachedDailyLimit = todaysCount >= MEETING_DAILY_LIMIT;
  const inCooldown = remainingMs > 0;

  return {
    canMeet: !inCooldown && !reachedDailyLimit,
    cooldownRemainingMs: remainingMs,
    meetingsToday: todaysCount,
    dailyLimit: MEETING_DAILY_LIMIT,
    reachedDailyLimit,
  };
}
