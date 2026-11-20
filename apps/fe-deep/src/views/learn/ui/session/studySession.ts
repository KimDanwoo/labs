import { StudySessionActions } from '@views/learn/ui/session/StudySessionActions';
import { StudySessionBadges } from '@views/learn/ui/session/StudySessionBadges';
import { StudySessionCard } from '@views/learn/ui/session/StudySessionCard';
import { StudySessionHeader } from '@views/learn/ui/session/StudySessionHeader';
import { StudySessionHints } from '@views/learn/ui/session/StudySessionHints';
import { StudySessionPrompt } from '@views/learn/ui/session/StudySessionPrompt';
import { StudySessionResponse } from '@views/learn/ui/session/StudySessionResponse';
import { StudySessionRoot } from '@views/learn/ui/session/StudySessionRoot';

export const StudySession = {
  Root: StudySessionRoot,
  Header: StudySessionHeader,
  Card: StudySessionCard,
  Badges: StudySessionBadges,
  Prompt: StudySessionPrompt,
  Hints: StudySessionHints,
  Response: StudySessionResponse,
  Actions: StudySessionActions,
};
