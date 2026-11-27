import { LottoAbout } from '@views/lotto/ui/LottoAbout';
import { LottoBulkRun } from '@views/lotto/ui/LottoBulkRun';
import { LottoHeader } from '@views/lotto/ui/LottoHeader';
import { LottoJackpotRun } from '@views/lotto/ui/LottoJackpotRun';
import { LottoNumberBoard } from '@views/lotto/ui/LottoNumberBoard';
import { LottoOdds } from '@views/lotto/ui/LottoOdds';
import { LottoResults } from '@views/lotto/ui/LottoResults';
import { LottoRoot } from '@views/lotto/ui/LottoRoot';
import { LottoSingleDraw } from '@views/lotto/ui/LottoSingleDraw';
import { LottoTicketBar } from '@views/lotto/ui/LottoTicketBar';

export const Lotto = {
  Root: LottoRoot,
  Header: LottoHeader,
  NumberBoard: LottoNumberBoard,
  TicketBar: LottoTicketBar,
  SingleDraw: LottoSingleDraw,
  BulkRun: LottoBulkRun,
  JackpotRun: LottoJackpotRun,
  Results: LottoResults,
  Odds: LottoOdds,
  About: LottoAbout,
};
