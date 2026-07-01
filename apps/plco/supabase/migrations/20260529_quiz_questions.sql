-- ============================================================
-- 퀴즈 문제 풀: DB로 이관
-- ============================================================
-- 기존 features/minigame/model/constants/quiz/*.ts 의 145문제를
-- DB로 옮긴다. 클라이언트는 매번 RPC로 N개 랜덤 + 옵션 셔플된
-- 결과를 받아 쓴다.
-- ============================================================

-- 1) 테이블
create table if not exists quiz_questions (
  id            text primary key,
  character_id  text not null,
  question      text not null,
  options       jsonb not null,
  correct_index int  not null,
  fact          text not null,
  is_active     boolean not null default true,
  sort_order    int default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists quiz_questions_character_idx
  on quiz_questions(character_id)
  where is_active;

-- 2) RLS: 누구나 읽기 가능, 쓰기는 service_role만
alter table quiz_questions enable row level security;

drop policy if exists "quiz_questions read" on quiz_questions;
create policy "quiz_questions read"
  on quiz_questions
  for select
  to anon, authenticated
  using (is_active);

-- 3) updated_at 자동 갱신
drop trigger if exists quiz_questions_updated on quiz_questions;
create trigger quiz_questions_updated
  before update on quiz_questions
  for each row execute function update_updated_at();

-- 4) 시드 데이터
insert into quiz_questions (id, character_id, question, options, correct_index, fact) values
-- ===== yeko =====
('yeko-lamb', 'yeko', '예코가 진심으로 좋아하는 고기는?', $j$["양고기","삼겹살","닭갈비","소고기"]$j$::jsonb, 0, '오히려 향 나는 양고기를 더 선호할 정도로 진심입니다 🐑'),
('yeko-redbean', 'yeko', '예코가 좋아하는 단 음식은?', $j$["팥붕어빵·비비빅·양갱 (단팥)","초콜릿","캐러멜","단 거 안 좋아함"]$j$::jsonb, 0, '단팥 들어간 건 다 좋아할 정도로 단팥파입니다 🫘'),
('yeko-game', 'yeko', '예코가 게임 중에 유일하게 진심인 게임은?', $j$["크레이지 아케이드","리그 오브 레전드","배틀그라운드","오버워치"]$j$::jsonb, 0, '게임에 관심이 적은 편이지만 크아만큼은 진심입니다 💣'),
('yeko-mbti', 'yeko', '예코의 MBTI에서 J 비율은?', $j$["99% (극J)","60% 정도","50/50 경계","P 우세"]$j$::jsonb, 0, '재검사에서 J 99%가 나온 극J, 마감 한참 전부터 일정 세분화 📅'),
('yeko-color', 'yeko', '예코의 시그니처 색깔은?', $j$["파란색 💙","보라색 💜","분홍 💗","빨강 ❤️"]$j$::jsonb, 0, '돌고래와 어울리는 파란색이 예코의 시그니처 🐬'),
('yeko-animal', 'yeko', '예코를 대표하는 동물은?', $j$["돌고래","범고래","곰","여우"]$j$::jsonb, 0, '대표 동물은 돌고래, 그래서 별명도 돌고래·범고래 🐬'),
('yeko-drink', 'yeko', '예코의 주량 순위는?', $j$["PLCO 1등","중간 정도","못 마심","술 안 마심"]$j$::jsonb, 0, '"술은 짝으로 사야 한다"고 인정 받은 1등 🍺'),
('yeko-soju', 'yeko', '예코가 회식 때 고집하는 술은?', $j$["소주","맥주","와인","하이볼"]$j$::jsonb, 0, '낮에는 맥주, 밤·회식에는 무조건 소주만 취급 🍶'),
('yeko-noodle', 'yeko', '예코가 좋아하는 라면은?', $j$["진라면 매운맛·틈새라면","신라면","안성탕면","너구리"]$j$::jsonb, 0, '매운 음식 좋아하는 예코답게 매콤한 라면 라인 🌶️'),
('yeko-hate', 'yeko', '예코가 가장 싫어하는 것은?', $j$["벌레·더운 날씨","추위","시끄러운 곳","단 음식"]$j$::jsonb, 0, '여름과 벌레를 진심으로 싫어합니다 🪲☀️'),
('yeko-shower', 'yeko', '예코가 샤워할 때 특이한 습관은?', $j$["순서를 정해놓고 무조건 똑같이","매일 다르게","랜덤하게","샤워 안 함"]$j$::jsonb, 0, '레버 각도까지 똑같이 맞춰야 하루 루틴이 안 망가져요 🚿'),
('yeko-hobby', 'yeko', '예코의 취미가 아닌 것은?', $j$["축구","기타 연주","러닝","커피"]$j$::jsonb, 0, '기타·러닝·커피·술이 예코의 공식 취미 🎸'),
('yeko-height', 'yeko', '예코의 키는?', $j$["183cm","170cm","178cm","190cm"]$j$::jsonb, 0, '183cm, B형, 처녀자리 ✨'),
('yeko-perfume', 'yeko', '예코가 좋아하는 향수 스타일은?', $j$["중성 향수 (BYREDO Blanche)","달콤한 머스크","시트러스","향수 안 씀"]$j$::jsonb, 0, '향수 매니아, 중성적인 Blanche가 시그니처 🌬️'),
('yeko-tv', 'yeko', '예코가 즐겨 보는 TV 장르는?', $j$["연애 프로그램 (나솔·환승연애·하트시그널)","다큐멘터리","뉴스","스포츠 중계"]$j$::jsonb, 0, '도파민이 터지는 연애 프로그램을 가리지 않습니다 💘'),
('yeko-realname', 'yeko', '예코의 본명은?', $j$["남예준","도은호","한노아","채봉구"]$j$::jsonb, 0, '남예준, 그래서 "남리더"라는 별명도 생겼어요 👑'),
('yeko-bloodtype', 'yeko', '예코의 혈액형은?', $j$["B형","O형","A형","AB형"]$j$::jsonb, 0, '혈액형 B, 처녀자리, 가을 태생 ✨'),
('yeko-dessert', 'yeko', '예코가 좋아하는 디저트가 아닌 것은?', $j$["생크림 케이크","스콘","마카롱","인절미"]$j$::jsonb, 0, '단팥·인절미·꿀떡·스콘·마카롱 같은 한식+서양 디저트를 좋아해요 🍰'),
('yeko-snack', 'yeko', '예코가 가장 좋아하는 간식은?', $j$["뭉친 김 (조미김)","초콜릿","과자","아이스크림"]$j$::jsonb, 0, '간식이 김이라니, 예코답죠 🌿'),
('yeko-pineapple', 'yeko', '예코가 싫어하는 음식은?', $j$["파인애플 피자","닭발","회","청국장"]$j$::jsonb, 0, '의외로 파인애플 피자에 대해선 단호하게 NO 🍕🚫'),
('yeko-skate', 'yeko', '예코가 좋아하는 활동 중 하나는?', $j$["스케이트","스키","암벽등반","서핑"]$j$::jsonb, 0, '스케이트 타는 걸 좋아해요 ⛸️'),
('yeko-greeting', 'yeko', '예코의 인사말은?', $j$["예로롱","예이~","예준이입니다","뽀로롱"]$j$::jsonb, 0, '"예준 + 포롱"이 합쳐진 시그니처 인사 🐬'),
('yeko-cafe-signoff', 'yeko', '예코가 공식 카페 글 끝에 항상 쓰는 말은?', $j$["남예준 올림","예준 드림","예준이가","안녕히 계세요"]$j$::jsonb, 0, '편지 형식으로 정중하게 "남예준 올림"으로 마무리 💌'),
('yeko-bubble', 'yeko', '예코의 특수 능력은?', $j$["물·거품을 다룸","불을 다룸","빛을 다룸","바람을 다룸"]$j$::jsonb, 0, '물 줄기를 화면에 그리고 입에서 거품이 나오는 능력 💦'),
('yeko-position', 'yeko', 'PLCO에서 예코의 포지션은?', $j$["리더 & 메인 보컬","메인 댄서","메인 래퍼","서브 보컬"]$j$::jsonb, 0, 'PLCO의 리더이자 메인 보컬, 작사·작곡까지 하는 만능 🎤'),
('yeko-debut', 'yeko', 'PLCO 데뷔곡은?', $j$["기다릴게 (Wait For You)","Way 4 Luv","Pump Up The Volume","Virtual Idol"]$j$::jsonb, 0, '2023년 3월 12일 데뷔 앨범 ASTERUM 타이틀 곡 🌟'),
('yeko-recruit', 'yeko', '예코가 PLCO에 함께 데려온 멤버는?', $j$["노아·은호","밤비·하민","하민·밤비","은호·하민"]$j$::jsonb, 0, '첫 트레이니였고, 노아와 은호를 그룹에 합류시켰어요 🤝'),
('yeko-pork', 'yeko', '예코가 국밥에 선호하는 고기는?', $j$["돼지고기 + 여러 가지","소고기 한 가지","닭고기","국밥 안 먹음"]$j$::jsonb, 0, '돼지고기 베이스에 여러 고기를 섞어 먹는 걸 좋아해요 🍲'),
('yeko-bug', 'yeko', '예코가 진심으로 무서워하는 것은?', $j$["벌레","귀신","높은 곳","바다"]$j$::jsonb, 0, '벌레라면 진심으로 도망갑니다 🪲🏃'),

-- ===== ako =====
('ako-jjigae', 'ako', '아코의 별미 음식은?', $j$["아이스 된장찌개","차가운 김치찌개","미지근한 미역국","시원한 갈비탕"]$j$::jsonb, 0, '진심으로 아이스 된장찌개를 좋아한다고 했어요 🥶'),
('ako-ddeokbokki', 'ako', '아코가 떡볶이에서 안 먹는 것은?', $j$["떡과 어묵","튀김","라면 사리","다 잘 먹는다"]$j$::jsonb, 0, '튀김에 떡볶이 소스 찍어 먹는 건 좋아해요 🍢'),
('ako-hobby', 'ako', '아코의 취미 중 하나가 아닌 것은?', $j$["게임","노래","웨이트","영화 보기"]$j$::jsonb, 0, '맏형은 멤버 중에서 게임에 가장 관심이 없습니다 😅'),
('ako-mbti', 'ako', '아코의 MBTI는?', $j$["ISFJ-A","ENFP-T","ESTP-A","INTP-T"]$j$::jsonb, 0, '챙기는 형아 캐릭터, 이전엔 ISTJ였다가 ISFJ-A로 🦙'),
('ako-color', 'ako', '아코의 시그니처 색깔은?', $j$["보라색 💜","파란색 💙","분홍 💗","검정 🖤"]$j$::jsonb, 0, '알파카와 잘 어울리는 보라색이 아코의 색 🦙'),
('ako-animal', 'ako', '아코를 대표하는 동물은?', $j$["알파카","말티즈","늑대","돌고래"]$j$::jsonb, 0, '폭신폭신 알파카가 아코의 대표 동물 🦙'),
('ako-nickname', 'ako', '아코의 별명이 아닌 것은?', $j$["멍멍이","공주","할머니","스포일러 요정"]$j$::jsonb, 0, '공주·할머니·스포일러 요정·체육관 쥐가 아코의 별명 👑'),
('ako-protein', 'ako', '아코가 가장 좋아하는 영양소는?', $j$["단백질","탄수화물","지방","비타민"]$j$::jsonb, 0, '단백질 매니아, "체육관 쥐"라는 별명이 어울려요 💪'),
('ako-pizza', 'ako', '아코가 하와이안 피자를 먹는 방식은?', $j$["작은 파인애플만 데코처럼","파인애플 빼고","파인애플 두 배","안 먹음"]$j$::jsonb, 0, '큰 파인애플은 별로, 작은 조각만 데코로 좋아해요 🍍'),
('ako-dislike', 'ako', '아코가 즐기지 않는 음식은?', $j$["매운·비린 음식, 해산물","단 음식","고기","튀김"]$j$::jsonb, 0, '매운 음식·해산물 모두 잘 안 먹어요 🐟❌'),
('ako-favorite-song', 'ako', 'PLCO 곡 중 아코의 최애 자작곡은?', $j$["여섯 번째 여름","기다릴게","Virtual Idol","Way 4 Luv"]$j$::jsonb, 0, '아코가 가장 아끼는 자작곡이 "여섯 번째 여름" 🌻'),
('ako-cool', 'ako', '아코가 본인 성격을 한 단어로 정의한 것은?', $j$["Cool","Lovely","Funny","Cute"]$j$::jsonb, 0, '본인 정의는 단호하게 "Cool" 😎'),
('ako-jump', 'ako', '아코의 의외의 특기는?', $j$["높이뛰기","암벽등반","양궁","수영"]$j$::jsonb, 0, '작사·작곡 외 의외의 특기가 높이뛰기 🏃'),
('ako-line', 'ako', '아코가 은코와 함께 만든 라인은?', $j$["No-line (노라인)","Yes-line","Pro-line","Dance-line"]$j$::jsonb, 0, '"수준 높은 개그"를 하는 자만 들어갈 수 있다는 노라인 😆'),
('ako-dance', 'ako', '댄스 챌린지에서 아코의 약점은?', $j$["안무 외우는 데 시간이 걸림","리듬을 못 탐","체력 좋음","안무 천재"]$j$::jsonb, 0, '댄스 라인 두 명과 달리 안무 외우기에 시간이 걸려요 💃'),
('ako-realname', 'ako', '아코의 본명은?', $j$["한노아","남예준","도은호","유하민"]$j$::jsonb, 0, '한노아, 그래서 영문 별명도 Noah 🦙'),
('ako-bloodtype', 'ako', '아코의 혈액형은?', $j$["O형","A형","B형","AB형"]$j$::jsonb, 0, 'O형, 물병자리, PLCO 최연장자 🌊'),
('ako-height', 'ako', '아코의 키는?', $j$["179cm","170cm","184cm","185cm"]$j$::jsonb, 0, '179cm, 멤버 중에서는 중간 정도예요 📏'),
('ako-role', 'ako', 'PLCO에서 아코의 메인 포지션은?', $j$["메인 보컬","메인 댄서","메인 래퍼","리더"]$j$::jsonb, 0, '깊고 파워풀한 보이스, 록 발라드 잘 부르는 메인 보컬 🎤'),
('ako-genre', 'ako', '아코가 가장 잘 부르는 장르는?', $j$["록 발라드","트로트","메탈","재즈"]$j$::jsonb, 0, '록 발라드 부를 때 반응이 가장 폭발적이에요 🎸'),
('ako-instrument', 'ako', '아코가 다룰 수 있는 악기는?', $j$["기타","드럼","바이올린","피아노만"]$j$::jsonb, 0, '예준이만큼은 아니지만 기타도 칩니다 🎸'),
('ako-debut-highnote', 'ako', '"기다릴게" 후반부 고음 파트는 어떻게 만들어졌나?', $j$["아코가 녹음실에서 즉흥으로","예준이 작곡","은호가 추가","프로듀서 지시"]$j$::jsonb, 0, '뭔가 부족하다 싶어서 녹음 도중에 즉흥적으로 떠올렸어요 ✨'),
('ako-pllistmas', 'ako', '"Merry PLLIstmas" 멜로디를 어떻게 보존했나?', $j$["한 시간 동안 흥얼거리며 집으로","바로 악보로","동료에게 전화로 불러줌","잊어버렸다가 다시 떠올림"]$j$::jsonb, 0, '눈 보다가 떠올린 멜로디, 폰이 추위에 꺼지자 한 시간 흥얼흥얼 🎄'),
('ako-perfectionist', 'ako', '아코의 성격을 잘 표현하는 단어는?', $j$["완벽주의자","느긋함","즉흥적","게으름"]$j$::jsonb, 0, '완벽주의자, 운동도 음악도 진심 💪'),
('ako-wink', 'ako', '아코가 윙크할 때 일어나는 일은?', $j$["눈에서 하트가 나옴","반짝임","꽃이 핌","아무 일 없음"]$j$::jsonb, 0, '윙크 시 눈에서 하트가 튀어나오는 특수 능력 💜'),
('ako-laugh', 'ako', '아코가 웃을 때 일어나는 일은?', $j$["얼굴이 반짝임","바람이 분다","꽃잎이 떨어진다","특별한 일 없음"]$j$::jsonb, 0, '웃을 때 얼굴에서 반짝임이 나타나는 능력 ✨'),
('ako-bringing', 'ako', '아코를 PLCO에 데려온 멤버는?', $j$["예코","밤코","은코","하코"]$j$::jsonb, 0, '예코가 첫 트레이니로서 아코·은코를 모았어요 🤝'),
('ako-dislike-cause', 'ako', '아코가 가장 견디지 못하는 환경은?', $j$["시끄러운 곳·끈적한 것","추운 곳","비 오는 날","낯선 사람 많은 곳"]$j$::jsonb, 0, '소음·끈적함 둘 다 싫어해요 🙅'),
('ako-eat-before', 'ako', '아코가 녹음 직전에 든든히 챙겨먹는 것은?', $j$["라면이나 피자","주먹밥","에너지바","안 먹음"]$j$::jsonb, 0, '녹음 전엔 든든하게 먹어야 한대요 🍕'),

-- ===== bamko =====
('bamko-noodle', 'bamko', '밤코가 즐겨 먹는 면 요리는?', $j$["평양냉면","비빔국수","잔치국수","우동"]$j$::jsonb, 0, '담백한 평양냉면 매니아입니다 🥶'),
('bamko-game', 'bamko', '밤코가 좋아하는 게임 스타일은?', $j$["카트라이더 / 크레이지 아케이드 (캐주얼)","FPS / 슈팅","RPG","격투게임"]$j$::jsonb, 0, '단순하고 전략 부담 없는 캐주얼 게임을 좋아해요 🏎️'),
('bamko-pet', 'bamko', '밤코가 좋아하는 것은?', $j$["강아지와 산책","고양이 카페","햄스터 키우기","동물 관심 없음"]$j$::jsonb, 0, '강아지 진심이고 산책도 좋아합니다 🐶'),
('bamko-mbti', 'bamko', '밤코의 MBTI는?', $j$["INTJ-A","INFP-T","ENFJ-A","ESTP-T"]$j$::jsonb, 0, '이전엔 INFP-T였다가 지금은 INTJ-A 🧠'),
('bamko-color', 'bamko', '밤코의 시그니처 색은?', $j$["분홍 💗","파란색 💙","빨강 ❤️","보라색 💜"]$j$::jsonb, 0, '핑크 머리, 핑크 하트가 밤코의 상징 🩷'),
('bamko-animal', 'bamko', '밤코를 대표하는 동물은?', $j$["사슴","말티즈","여우","햄스터"]$j$::jsonb, 0, '대표 동물은 사슴, 별명에 말티즈도 있어요 🦌'),
('bamko-nickname', 'bamko', '밤코의 대표 별명은?', $j$["핑크쪼꼬미 (핑쬬)","검정고양이","늑댕이","돌고래"]$j$::jsonb, 0, '핑크 머리 + 작은 키 콤보로 핑쬬가 됐어요 🩷'),
('bamko-height', 'bamko', '멤버 중 밤코의 키 순위는?', $j$["가장 작음 (174cm)","가장 큼","중간","두번째로 큼"]$j$::jsonb, 0, '174cm로 멤버 중 가장 작아 "쪼꼬미"라는 별명이 붙었어요 📏'),
('bamko-fear', 'bamko', '밤코가 무서워하는 동물은?', $j$["비둘기·앵무새","강아지","고양이","햄스터"]$j$::jsonb, 0, '의외로 새 종류, 특히 비둘기와 앵무새를 무서워해요 🐦'),
('bamko-crab', 'bamko', '밤코가 한 자리에서 많이 먹는 음식은?', $j$["간장게장 (20개 먹다 배탈)","닭발","회 (10접시)","피자 한판"]$j$::jsonb, 0, '무한리필집에서 20개 먹다 탈 났을 정도로 좋아해요 🦀'),
('bamko-sushi', 'bamko', '밤코가 음식 이상형 월드컵에서 꼽은 음식은?', $j$["회","치킨","떡볶이","햄버거"]$j$::jsonb, 0, '회를 매우 좋아한다고 했고, 같은 이유로 초밥도 좋아해요 🍣'),
('bamko-realname', 'bamko', '밤코의 본명은?', $j$["채봉구","남예준","도은호","한노아"]$j$::jsonb, 0, '"채봉구귀엽다"의 줄임말이 별명 "채봉비"에요 🤍'),
('bamko-partner', 'bamko', '밤코와 함께 안무를 짜는 멤버는?', $j$["하코","예코","아코","은코"]$j$::jsonb, 0, '댄스 라인 콤비, PLCO 안무 거의 다 둘이 만들어요 💃'),
('bamko-gym', 'bamko', '밤코가 데뷔 후 시작한 운동은?', $j$["헬스 (꾸준히)","러닝","수영","복싱"]$j$::jsonb, 0, '데뷔 이후 어느 순간부터 시작해서 지금도 꾸준히 해요 💪'),
('bamko-sibling', 'bamko', '밤코의 가족 구성은?', $j$["여동생이 있음","외동","쌍둥이 형","남동생"]$j$::jsonb, 0, '여동생이 있는 오빠 포지션이에요 👨‍👧'),
('bamko-bloodtype', 'bamko', '밤코의 혈액형은?', $j$["B형","A형","O형","AB형"]$j$::jsonb, 0, 'B형, 게자리, 174cm 핑크 머리 🦌'),
('bamko-spicy', 'bamko', '밤코가 자랑하는 미각은?', $j$["맵부심 (불닭볶음면)","단맛","신맛","쓴맛"]$j$::jsonb, 0, '맵부심 있지만 은코는 거짓이라고 주장해요 🔥'),
('bamko-alcohol', 'bamko', '밤코의 술 취향은?', $j$["잘 못 마시고 맥주 선호","소주 매니아","하이볼 매니아","술 안 마심"]$j$::jsonb, 0, '잘 못 마시는 편, 마실 때는 맥주를 선호해요 🍺'),
('bamko-bug', 'bamko', '밤코가 벌레를 만나면?', $j$["아무렇지도 않게 잡거나 굴림","도망감","소리 지르며 무서워함","못 본 척"]$j$::jsonb, 0, '콩벌레를 굴리고 바퀴벌레도 망설임 없이 잡아요 🪲'),
('bamko-pickup', 'bamko', '밤코의 강점인 게임 타입은?', $j$["단순 피지컬 게임 (황새·피카츄배구)","전략 시뮬레이션","RPG","리듬 게임"]$j$::jsonb, 0, '피지컬 베이스 게임은 다 잘해요 🏆'),
('bamko-nickname-real', 'bamko', '밤코의 본명 "채봉구"에서 파생된 별명은?', $j$["채봉비 (채봉구귀엽다)","채구비","채채비","봉봉이"]$j$::jsonb, 0, '"채봉구귀엽다" 줄임말이 별명 "채봉비"에요 🤍'),
('bamko-noodle-eat', 'bamko', '밤코가 평양냉면 먹는 방식은?', $j$["면 추가, 국물까지, 고춧가루+후추","담백하게 그대로","얼음 많이","비벼서"]$j$::jsonb, 0, '진짜 매니아는 면 추가에 양념까지 진심 🥶'),
('bamko-rival', 'bamko', '밤코가 가장 자주 티격태격하는 멤버는?', $j$["은코","예코","아코","하코"]$j$::jsonb, 0, '은코가 밤코를 PLCO에 영입해서 더 친한 만큼 자주 다퉈요 ⚡'),
('bamko-crazyarcade', 'bamko', '크레이지 아케이드에서 밤코의 위치는?', $j$["예코를 이긴 적 있는 고수","입문자","못 함","관심 없음"]$j$::jsonb, 0, '예코가 크아 진심인데, 밤코가 한 판 이긴 적이 있어요 🏎️'),
('bamko-color-hair', 'bamko', '밤코의 상징인 머리 색깔은?', $j$["핑크","파랑","검정","갈색"]$j$::jsonb, 0, '핑크 머리가 핑쬬 별명의 시작 🩷'),
('bamko-shabu', 'bamko', '밤비가 평양냉면 외에 정말 좋아하는 음식은?', $j$["간장게장","치킨","곱창","파스타"]$j$::jsonb, 0, '간장게장 매니아, 20개까지 먹다 배탈도 났어요 🦀'),
('bamko-dance-position', 'bamko', 'PLCO에서 밤코의 메인 포지션은?', $j$["메인 댄서 & 안무가","메인 보컬","메인 래퍼","리드 보컬"]$j$::jsonb, 0, '하코와 함께 PLCO 안무 거의 다 만들어요 💃'),
('bamko-high-voice', 'bamko', '밤코가 노래에서 담당하는 음역대는?', $j$["높은 음역대","중저음","베이스","랩만"]$j$::jsonb, 0, '댄서이면서도 고음 파트를 자주 맡아요 🎶'),
('bamko-vienna', 'bamko', '밤코가 좋아하는 카페 메뉴는?', $j$["아인슈페너","바닐라 라떼","카페모카","녹차"]$j$::jsonb, 0, '진한 커피 위 생크림 조합 아인슈페너를 좋아해요 ☕'),

-- ===== eunko =====
('eunko-ramen', 'eunko', '은코의 라면 취향은?', $j$["진라면 매운맛","신라면","안성탕면","너구리"]$j$::jsonb, 0, '무조건 진라면 매운맛파입니다 🌶️'),
('eunko-kalguksu', 'eunko', '은코가 가장 좋아하는 음식으로 매번 꼽는 것은?', $j$["바지락 칼국수","김치 칼국수","들깨 칼국수","해물 칼국수"]$j$::jsonb, 0, '바지락 칼국수를 정말 자주 언급해요 🍜'),
('eunko-game', 'eunko', '은코의 게임 별명은?', $j$["PLCO 대표 겜돌이","게임 입문자","게임 안 함","게임 트롤"]$j$::jsonb, 0, '공포게임에서도 침착하게 "에임 좋았죠?" 할 정도의 실력파 🎮'),
('eunko-mbti', 'eunko', '은코의 MBTI는?', $j$["ENTP-A","ISTJ-T","INFP-A","ISFJ-T"]$j$::jsonb, 0, '멤버 중 유일하게 E(외향)를 가진 ENTP-A 🐺'),
('eunko-color', 'eunko', '은코의 시그니처 색은?', $j$["빨강 ❤️","검정 🖤","파랑 💙","분홍 💗"]$j$::jsonb, 0, '늑대 + 빨강이 은코의 시그니처 🐺❤️'),
('eunko-animal', 'eunko', '은코의 대표 동물은?', $j$["늑대","여우","강아지","늑댕이"]$j$::jsonb, 0, '일본 무대에서도 본인이 "おおかみ(늑대)"라고 소개해요 🐺'),
('eunko-coffee', 'eunko', '은코가 가장 좋아하는 음료는?', $j$["아이스 아메리카노","라떼","카페모카","핫초코"]$j$::jsonb, 0, '아이스 아메리카노 사랑꾼이에요 ☕'),
('eunko-mint', 'eunko', '은코가 싫어하는 음식 조합은?', $j$["닭발·민트초코","치즈·피클","회·간장","치킨·맥주"]$j$::jsonb, 0, '닭발도 민트초코도 둘 다 NO 🚫'),
('eunko-cook', 'eunko', '은코가 잘 만드는 요리는?', $j$["파스타·짜파게티","제육볶음","김치찌개","삼겹살"]$j$::jsonb, 0, '면 요리에 자신 있는 자취 요리 잘러 🍝'),
('eunko-overwatch', 'eunko', '은코가 자주 하는 게임은?', $j$["오버워치·롤","메이플스토리","동물의 숲","마인크래프트"]$j$::jsonb, 0, '오버워치와 롤이 메인, 실력파 게이머 🎮'),
('eunko-english', 'eunko', '은코가 학교에서 가장 좋아했던 과목은?', $j$["영어","수학","체육","음악"]$j$::jsonb, 0, '영어 능통, 일본어도 어느 정도 가능해요 🌏'),
('eunko-realname', 'eunko', '은코의 본명은?', $j$["도은호","남예준","채봉구","유하민"]$j$::jsonb, 0, '도은호, 별명 "douneo"의 유래 🐺'),
('eunko-recruit', 'eunko', '은코가 PLCO에 합류시킨 멤버는?', $j$["밤코","예코","아코","하코"]$j$::jsonb, 0, '밤코를 데려온 게 은코, 그래서 자주 티격태격해요 ⚡'),
('eunko-hate', 'eunko', '은코가 가장 싫어하는 사람 유형은?', $j$["예의 없는 사람·위선자","말 많은 사람","낯가리는 사람","시끄러운 사람"]$j$::jsonb, 0, '예의 없거나 위선적인 사람을 가장 싫어해요 🙅'),
('eunko-nickname', 'eunko', '아코가 은코에게 붙여준 별명은?', $j$["늑댕이 (늑대+댕댕이)","범고래","핑쬬","햄냥이"]$j$::jsonb, 0, '늑대와 댕댕이 합친 "늑댕이"가 아코표 작명 🐺🐶'),
('eunko-bloodtype', 'eunko', '은코의 혈액형은?', $j$["A형","B형","O형","AB형"]$j$::jsonb, 0, 'A형, 쌍둥이자리, 키 184cm 🐺'),
('eunko-height', 'eunko', '은코의 키는?', $j$["184cm","170cm","178cm","190cm"]$j$::jsonb, 0, '184cm, 멤버 중에서도 큰 편 📏'),
('eunko-position', 'eunko', 'PLCO에서 은코의 메인 포지션은?', $j$["메인 래퍼 & 보컬","메인 보컬","메인 댄서","리더"]$j$::jsonb, 0, '메인 래퍼이면서 보컬도 가능, 프로듀싱까지 🎙️'),
('eunko-recruit-bamko', 'eunko', '은코가 PLCO에 영입한 멤버는?', $j$["밤코","아코","하코","예코"]$j$::jsonb, 0, '밤코를 영입한 사람이 은코, 그 후로 자주 티격태격해요 ⚡'),
('eunko-recruit-by', 'eunko', '은코를 PLCO에 합류시킨 사람은?', $j$["예코","아코","밤코","하코"]$j$::jsonb, 0, '첫 트레이니였던 예코가 아코와 함께 영입했어요 🤝'),
('eunko-power', 'eunko', '은코의 특수 능력은?', $j$["손에서 불, 어두운 곳에서 빨간 눈","물·거품","바람","얼음"]$j$::jsonb, 0, '손을 뒤집으면 불, 어두운 곳에서 눈이 빨갛게 빛나요 🔥'),
('eunko-foodie', 'eunko', '은코의 음식 평가는?', $j$["단호하고 엄격함","뭐든 잘 먹음","편식","안 가림"]$j$::jsonb, 0, '미식가, 맛 평가에 단호함, 별명도 "맛 인지자" 🍴'),
('eunko-japan', 'eunko', '은코가 일본 무대에서 자신을 부를 때 쓰는 단어는?', $j$["おおかみ (늑대)","ワンちゃん (멍멍이)","ねこ (고양이)","ペット (펫)"]$j$::jsonb, 0, '일본 공식 SNS는 "ワンちゃん" 소개지만, 본인은 "늑대"라 해요 🐺'),
('eunko-line-noah', 'eunko', '은코와 아코가 같이 들어간 라인은?', $j$["Producer Line, No-line","Dance Line","리더 라인","Maknae Line"]$j$::jsonb, 0, '예준·아코·은코가 PLCO 곡 제작을 함께하는 프로듀서 라인 🎚️'),
('eunko-pasta', 'eunko', '은코의 자취 요리 자신작은?', $j$["파스타·짜파게티","제육볶음","김치찌개","닭갈비"]$j$::jsonb, 0, '면 요리만큼은 자신 있어요 🍝'),
('eunko-perfume-brand', 'eunko', '은코가 사용하는 향수는?', $j$["Creed Aventus","CK One","Dior Sauvage","Tom Ford"]$j$::jsonb, 0, '크리드 아벤투스 매니아 🌟'),
('eunko-horror', 'eunko', '공포 게임 중 은코의 반응은?', $j$["침착하게 \"에임 좋았죠?\"","비명 지름","게임 끔","집중 못 함"]$j$::jsonb, 0, '공포 게임에서도 멘탈 유지하며 잘해요 🎮'),
('eunko-school', 'eunko', '은코의 자기 PR 멘트는?', $j$["바지락 칼국수 아스테룸 홍보대사","대표 댄서","메인 보컬","비주얼 담당"]$j$::jsonb, 0, '소개에 "바지락 칼국수 아스테룸 홍보대사"가 들어가요 🍜'),
('eunko-eyes', 'eunko', '은코가 받은 자칭/타칭 별명이 아닌 것은?', $j$["돌고래 박사","플러팅 황제","천재 강아지","가슴이 시끄러운 남자"]$j$::jsonb, 0, '플러팅 황제·천재 강아지·가슴이 시끄러운 남자가 은코 소개 멘트 🐺'),

-- ===== hako =====
('hako-meal', 'hako', '하코가 먹은 음식의 80%를 차지하는 것은?', $j$["라면","빵","김밥","햄버거"]$j$::jsonb, 0, '뭘 먹었냐 물어보면 매번 라면이라고 답해요 🍜'),
('hako-ramen', 'hako', '하코가 가장 좋아하는 라면은?', $j$["스낵면","신라면","짜파게티","진라면"]$j$::jsonb, 0, '라면 중에서도 스낵면을 최애로 꼽았어요 ✨'),
('hako-mbti', 'hako', '하코의 MBTI는?', $j$["INFJ-T","ENFP-T","ISTP-A","ENTP-T"]$j$::jsonb, 0, '낯가리는 INFJ, 막내인데 어른스러운 이유 🌙'),
('hako-color', 'hako', '하코의 시그니처 색은?', $j$["검정 🖤","하양 🤍","빨강 ❤️","보라 💜"]$j$::jsonb, 0, '검은 고양이 + 블랙 하트가 하코의 시그니처 🐈‍⬛'),
('hako-animal', 'hako', '하코의 대표 동물은?', $j$["검은 고양이","흰 고양이","햄스터","강아지"]$j$::jsonb, 0, '검은 고양이가 하코의 상징 🐈‍⬛'),
('hako-nickname', 'hako', '하코의 별명은?', $j$["햄냥이·비타민","핑쬬","늑댕이","돌고래"]$j$::jsonb, 0, '햄냥이(hamnyangi)와 비타민(vithamin)이 대표 별명 🍊'),
('hako-height', 'hako', '하코의 키와 멤버 중 순위는?', $j$["185cm, 가장 큼","170cm, 가장 작음","178cm, 중간","180cm, 두번째"]$j$::jsonb, 0, '185cm로 PLCO 최장신, 게다가 막내 📏'),
('hako-blood', 'hako', '하코의 혈액형은?', $j$["AB형","A형","B형","O형"]$j$::jsonb, 0, '독특한 AB형 막내, 전갈자리 ♏'),
('hako-taekwondo', 'hako', '하코의 무술 실력은?', $j$["태권도 검은띠","유도 갈색띠","복싱 챔피언","운동 못함"]$j$::jsonb, 0, '태권도 검은띠 보유자, 댄스에도 큰 도움이 돼요 🥋'),
('hako-art', 'hako', '하코의 의외의 예술 취미는?', $j$["그림 그리기 (아크릴화 카페 전시)","뜨개질","도자기","서예"]$j$::jsonb, 0, '아크릴화를 그려서 Asterum 카페에 전시까지 했어요 🎨'),
('hako-trot', 'hako', '하코가 의외로 잘 부르는 장르는?', $j$["트로트","오페라","재즈","메탈"]$j$::jsonb, 0, '트로트를 진심으로 좋아하고 잘 불러요 🎤'),
('hako-impression', 'hako', '하코의 숨겨진 특기는?', $j$["성대모사","마술","주짓수","복화술"]$j$::jsonb, 0, '성대모사가 정확해서 자주 멤버들 따라해요 😼'),
('hako-hate', 'hako', '하코가 가장 싫어하는 것은?', $j$["거짓말·모기","시끄러운 곳","추위","단 음식"]$j$::jsonb, 0, '거짓말과 모기를 진심으로 싫어해요 🦟'),
('hako-partner', 'hako', '하코와 함께 안무를 짜는 멤버는?', $j$["밤코","예코","아코","은코"]$j$::jsonb, 0, '댄스 라인 콤비, 안무 창작은 거의 둘이서 🕺'),
('hako-language', 'hako', '하코가 구사할 수 있는 외국어는?', $j$["일본어","중국어","스페인어","독일어"]$j$::jsonb, 0, '일본어가 가능해서 일본 활동 때 빛나요 🇯🇵'),
('hako-likes', 'hako', '하코가 좋아한다고 자주 말하는 것은?', $j$["음식·운동·칭찬·게임","잠·휴식·산책","독서·영화·여행","공부·일"]$j$::jsonb, 0, '특히 칭찬을 좋아해서 자주 칭찬 요청을 해요 🥰'),
('hako-realname', 'hako', '하코의 본명은?', $j$["유하민","도은호","한노아","채봉구"]$j$::jsonb, 0, '본명 유하민, 본인은 "성 빼고 하민이라고 불러줘" 부탁 🐈‍⬛'),
('hako-zodiac', 'hako', '하코의 별자리는?', $j$["전갈자리","쌍둥이자리","처녀자리","게자리"]$j$::jsonb, 0, '11월 1일생 전갈자리, AB형 🦂'),
('hako-position', 'hako', 'PLCO에서 하코의 메인 포지션은?', $j$["메인 댄서 & 리드 래퍼","메인 보컬","리더","서브 보컬"]$j$::jsonb, 0, '댄스 라인 + 리드 래퍼, 막내인데 키도 가장 커요 💃'),
('hako-debut-order', 'hako', '하코는 PLCO의 몇 번째 멤버로 공개됐나?', $j$["다섯 번째 (막내, 마지막 공개)","첫 번째","세 번째","네 번째"]$j$::jsonb, 0, '2023년 1월 16일 마지막 멤버로 공개된 막내 🐈‍⬛'),
('hako-recruit-by', 'hako', '하코를 PLCO에 데려온 멤버는?', $j$["아코","예코","은코","밤코"]$j$::jsonb, 0, '노아(아코)가 마지막 다섯 번째 멤버로 하코를 데려왔어요 🤝'),
('hako-line', 'hako', '하코는 어느 라인 소속?', $j$["Ye-line (예준 라인)","No-line","Producer Line","Dance Line만"]$j$::jsonb, 0, '예준의 "Ye-line" 소속이자 댄스 라인 멤버 🌙'),
('hako-chicken', 'hako', '하코가 라면 다음으로 좋아하는 음식은?', $j$["치킨","피자","햄버거","회"]$j$::jsonb, 0, '라면 80% + 치킨이 하코의 음식 라인업 🍗'),
('hako-ramen2', 'hako', '하코가 스낵면 외에 좋아하는 라면은?', $j$["육개장 사발면·짜파게티","신라면 블랙","진라면 매운맛","오뚜기 컵누들"]$j$::jsonb, 0, '육개장 사발면도 짜파게티도 좋아해요 🍜'),
('hako-catchphrase', 'hako', '하코가 자주 하는 시그니처 말은?', $j$["논중화물","예로롱","바지락칼국수","핑쬬"]$j$::jsonb, 0, '논쟁의 중심·화제의 물음표 = 논중화물 🔥'),
('hako-belt', 'hako', '하코의 태권도 단증은?', $j$["검은띠 (블랙벨트)","갈색띠","파란띠","아무 단증 없음"]$j$::jsonb, 0, '진짜 검은띠 보유자, 댄스의 폭발력 비결 🥋'),
('hako-bowling', 'hako', '하코의 의외 취미가 아닌 것은?', $j$["스킨스쿠버","볼링","그림","축구"]$j$::jsonb, 0, '볼링·그리기·영상 시청·축구가 공식 취미 🎳'),
('hako-mosquito', 'hako', '하코의 천적은?', $j$["모기","벌","나비","거미"]$j$::jsonb, 0, '거짓말과 모기를 진심으로 싫어해요 🦟🚫'),
('hako-jp', 'hako', '하코가 일본 활동에서 빛나는 이유는?', $j$["일본어 가능","일본 만화 매니아","일식 전문가","일본인 친구 많음"]$j$::jsonb, 0, '일본어 구사 가능, 일본 무대에서 자주 활약 🇯🇵'),
('hako-blackbelt', 'hako', '하코가 가장 자주 요청하는 것은?', $j$["칭찬","간식","휴식","용돈"]$j$::jsonb, 0, '"칭찬받아야 더 잘해요"라는 말을 자주 해요 🥰'),
('hako-acrylic', 'hako', '하코의 그림이 전시된 곳은?', $j$["Asterum 433-10 카페","서울 미술관","학교 전시회","본인 SNS만"]$j$::jsonb, 0, '아크릴화 한 점이 PLCO 공식 카페에 전시까지 됐어요 🎨')

on conflict (id) do update set
  question = excluded.question,
  options = excluded.options,
  correct_index = excluded.correct_index,
  fact = excluded.fact,
  is_active = excluded.is_active,
  updated_at = now();

-- 5) RPC: 랜덤 N개 + 보기 셔플
create or replace function get_random_quiz_questions(
  p_character_id text,
  p_count int default 3
)
returns table(
  id text,
  character_id text,
  question text,
  options jsonb,
  correct_index int,
  fact text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  r          quiz_questions%rowtype;
  orig_opts  jsonb;
  correct    text;
  shuffled   jsonb;
  new_idx    int;
  i          int;
begin
  for r in
    select * from quiz_questions
    where is_active and quiz_questions.character_id = p_character_id
    order by random()
    limit greatest(1, p_count)
  loop
    orig_opts := r.options;
    correct := orig_opts ->> r.correct_index;

    -- 보기 셔플
    select jsonb_agg(value order by random())
      into shuffled
      from jsonb_array_elements_text(orig_opts) as value;

    -- 셔플 후 정답 인덱스 재계산
    new_idx := -1;
    for i in 0 .. jsonb_array_length(shuffled) - 1 loop
      if shuffled ->> i = correct then
        new_idx := i;
        exit;
      end if;
    end loop;

    id            := r.id;
    character_id  := r.character_id;
    question      := r.question;
    options       := shuffled;
    correct_index := new_idx;
    fact          := r.fact;
    return next;
  end loop;
end;
$$;

-- 6) 익명·인증 유저 모두 호출 허용
grant execute on function get_random_quiz_questions(text, int) to anon, authenticated;
