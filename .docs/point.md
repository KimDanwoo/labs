# Awesome Sudoku - 포인트 시스템

## 1. 개요

### 1.1 설계 원칙
- **시간 반영**: 빠르게 풀수록 더 높은 포인트
- **난이도 차등**: 난이도가 높을수록 더 많은 포인트 범위
- **킬러 감점**: 킬러 모드는 클래식보다 쉬우므로 -1점
- **누적 구조**: 게임을 많이 할수록 포인트가 쌓임
- **실수 제한**: 5회 오답 시 게임 종료 (점수 미획득)

---

## 2. 포인트 계산

### 2.1 난이도별 포인트 범위

| 난이도 | 클래식 | 킬러(-1) | 최고점 시간 | 최저점 시간 |
|--------|--------|----------|------------|------------|
| 쉬움 (Easy) | 1~3점 | 1~2점 | ≤3분 | ≥15분 |
| 중간 (Medium) | 3~6점 | 3~5점 | ≤5분 | ≥20분 |
| 어려움 (Hard) | 6~9점 | 6~8점 | ≤10분 | ≥30분 |
| 전문가 (Expert) | 9~12점 | 9~11점 | ≤15분 | ≥45분 |

### 2.2 계산 공식

```typescript
const { min, max } = POINT_RANGES[difficulty];
const { fast, slow } = TIME_THRESHOLDS[difficulty];

// 시간을 fast~slow 범위로 클램핑
const clamped = Math.max(fast, Math.min(slow, completionTime));

// 선형 보간: 빠를수록 1에 가까움, 느릴수록 0에 가까움
const ratio = (slow - clamped) / (slow - fast);

// 난이도 범위 내에서 포인트 계산 (소수점 1자리)
const basePoint = Math.round((min + ratio * (max - min)) * 10) / 10;

// 킬러 모드 감점 적용 (최소 min 보장)
const totalPoint = Math.max(min, basePoint - killerDeduction);
```

### 2.3 실수 제한

- 최대 실수 허용: 5회
- 5회 오답 시 즉시 게임 종료 (isSuccess = false)
- 게임 종료 시 포인트 미획득
- 실수는 점수에 영향 없음 (감점 아님, 게임오버 조건)

---

## 3. 누적 시스템

### 3.1 포인트 누적
- 게임 성공 시마다 획득 포인트가 누적
- Firestore GameRecord에 `point` 필드로 기록

### 3.2 프로필 표시

```
누적 포인트: 128점
완료 게임: 20회
최고 단일: 12점 (전문가 클래식)
```

---

## 4. 랭킹 시스템

### 4.1 최고 기록 랭킹
- 유저당 최고 포인트 기록 1개만 표시
- 난이도/모드 필터 지원
- 포인트가 높을수록 상위 (난이도 높고 + 시간 빠르면 자연히 1등)

### 4.2 누적 포인트 랭킹
- userId별 전체 포인트 합산
- 많이 플레이할수록 유리
- 게임 수도 함께 표시

### 4.3 유저 중복 제거
- 같은 유저는 리더보드에 1번만 표시
- 클라이언트에서 userId 기준 중복 제거

---

## 5. 상수 정의

```typescript
export const POINT_RANGES: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 1, max: 3 },
  medium: { min: 3, max: 6 },
  hard: { min: 6, max: 9 },
  expert: { min: 9, max: 12 },
};

export const TIME_THRESHOLDS: Record<Difficulty, { fast: number; slow: number }> = {
  easy: { fast: 180, slow: 900 },
  medium: { fast: 300, slow: 1200 },
  hard: { fast: 600, slow: 1800 },
  expert: { fast: 900, slow: 2700 },
};

export const KILLER_MODE_DEDUCTION = 1;
export const MAX_MISTAKES = 5;
```

---

## 6. 변경 요약 (v1 → v2)

| 항목 | v1 (고정) | v2 (시간 반영) |
|------|----------|---------------|
| 점수 범위 | 3~10점 (고정) | 1~12점 (시간 따라 변동) |
| 시간 반영 | 없음 | 빠를수록 높은 점수 |
| 난이도 차이 | 기본 포인트 차등 | 포인트 범위 차등 |
| 킬러 감점 | -1점 | -1점 (동일) |
| 실수 처리 | 5회 = 게임오버 | 5회 = 게임오버 (동일) |
| 누적 | 총 포인트 누적 | 총 포인트 누적 (동일) |
| 리더보드 | 유저당 1개 | 유저당 1개 (동일) |
