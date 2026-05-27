'use client';

import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  MEETING_COOLDOWN_MS,
  MEETING_DAILY_LIMIT,
} from '@shared/constants';
import {
  lastMeetingAtAtom,
  meetingsTodayAtom,
  meetingDayAtom,
} from '../store';

function todayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lastMeetingAt) return;
    const elapsed = Date.now() - lastMeetingAt;
    if (elapsed >= MEETING_COOLDOWN_MS) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [lastMeetingAt]);

  const today = todayKey(now);
  const todaysCount = meetingDay === today ? meetingsToday : 0;
  const reachedDailyLimit = todaysCount >= MEETING_DAILY_LIMIT;

  const cooldownRemainingMs = lastMeetingAt
    ? Math.max(0, MEETING_COOLDOWN_MS - (now - lastMeetingAt))
    : 0;
  const inCooldown = cooldownRemainingMs > 0;

  return {
    canMeet: !inCooldown && !reachedDailyLimit,
    cooldownRemainingMs,
    meetingsToday: todaysCount,
    dailyLimit: MEETING_DAILY_LIMIT,
    reachedDailyLimit,
  };
}
