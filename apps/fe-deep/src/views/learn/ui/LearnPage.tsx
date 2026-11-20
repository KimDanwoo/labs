'use client';

import { PHASE } from '@views/learn/model/constants/study';
import { useLearnFlow } from '@views/learn/model/hooks/useLearnFlow';
import { LearnDone } from '@views/learn/ui/LearnDone';
import { LearnExitButton } from '@views/learn/ui/LearnExitButton';
import { StudySession } from '@views/learn/ui/session/studySession';
import { StudySetup } from '@views/learn/ui/setup/studySetup';

export function LearnPage() {
  const flow = useLearnFlow();

  if (flow.phase === PHASE.setup || flow.phase === PHASE.loading) {
    return (
      <StudySetup.Root setup={flow.setup}>
        <StudySetup.Intro />
        <StudySetup.Form>
          <StudySetup.Category />
          <StudySetup.Order />
          <StudySetup.Difficulty />
          <StudySetup.Start />
        </StudySetup.Form>
        <StudySetup.Tip />
      </StudySetup.Root>
    );
  }

  if (flow.phase === PHASE.done) {
    return <LearnDone questionCount={flow.questionCount} streak={flow.streak} onRestart={flow.backToSetup} />;
  }

  return (
    <StudySession.Root session={flow.session}>
      <StudySession.Header>
        <LearnExitButton onExit={flow.backToSetup} />
      </StudySession.Header>
      <StudySession.Card>
        <StudySession.Badges />
        <StudySession.Prompt />
        <StudySession.Hints />
        <StudySession.Response />
      </StudySession.Card>
      <StudySession.Actions />
    </StudySession.Root>
  );
}
