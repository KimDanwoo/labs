#!/usr/bin/env node

/**
 * 질문 후보 생성 CLI 스크립트
 *
 * 두 가지 모드:
 * 1. 웹 트렌드 기반 — 질문 수가 적은 카테고리를 타겟으로 자동 생성
 * 2. 주제 직접 입력 — 사용자가 지정한 키워드로 생성
 *
 * 사용법: node scripts/suggest-questions.mjs
 * 환경 변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

// ── .env.local 자동 로드 ────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env.local 없으면 기존 환경 변수 사용
}

// ── 환경 변수 확인 ──────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  process.exit(1);
}
if (!GEMINI_KEY) {
  console.error('❌ GEMINI_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ── readline 유틸 ───────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });

/** @param {string} q */
function ask(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

// ── Supabase 쿼리 ──────────────────────────────────────────────

async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, title, order_num, icon, description, questions(count)')
    .order('order_num');
  if (error) throw error;
  return data.map((c) => ({
    ...c,
    question_count: c.questions?.[0]?.count ?? 0,
  }));
}

async function fetchQuestionsByCategory(categoryId) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question, sub_category, difficulty, tags')
    .eq('category_id', categoryId);
  if (error) throw error;
  return data ?? [];
}

async function getNextOrderNum(categoryId) {
  const { data } = await supabase
    .from('questions')
    .select('order_num')
    .eq('category_id', categoryId)
    .order('order_num', { ascending: false })
    .limit(1)
    .single();
  return (data?.order_num ?? 0) + 1;
}

async function insertQuestion(q) {
  const { data, error } = await supabase.from('questions').insert(q).select('id').single();
  if (error) throw error;
  return data.id;
}

// ── Gemini API ─────────────────────────────────────────────────

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API 오류 (${res.status}): ${body}`);
  }

  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── 프롬프트 생성 ──────────────────────────────────────────────

function buildPrompt(category, existingQuestions, topic) {
  const existingList = existingQuestions.map((q) => `- ${q.question}`).join('\n');

  const topicClause = topic
    ? `특히 "${topic}" 주제에 집중하여`
    : '프론트엔드 면접에서 최근 자주 나오는 트렌드를 반영하여';

  return `
당신은 프론트엔드 면접 질문 전문가입니다.
"${category.title}" 카테고리에 대해 ${topicClause} 면접 질문 5개를 생성해주세요.

## 기존 질문 (중복 금지)
${existingList || '(없음)'}

## 출력 형식
JSON 배열로만 출력하세요. 다른 텍스트는 포함하지 마세요.
\`\`\`json
[
  {
    "question": "질문 텍스트",
    "answer": "마크다운 형식의 상세한 답변 (코드 예시 포함, 최소 200자)",
    "sub_category": "소분류명",
    "difficulty": "easy|medium|hard",
    "tags": ["태그1", "태그2"]
  }
]
\`\`\`

## 규칙
- 기존 질문과 의미적으로 겹치지 않아야 합니다.
- 답변은 마크다운 형식으로, 코드 블록과 설명을 포함합니다.
- difficulty 분포를 다양하게 해주세요.
- JSON만 출력하세요.
`.trim();
}

// ── 메인 플로우 ────────────────────────────────────────────────

async function main() {
  console.log('\n📚 질문 후보 생성 CLI (Gemini)\n');

  const categories = await fetchCategories();

  console.log('[1] 웹 트렌드 기반 자동 생성');
  console.log('[2] 주제 직접 입력\n');
  const mode = await ask('선택: ');

  let topic = null;
  if (mode.trim() === '2') {
    topic = await ask('주제/키워드 입력: ');
  }

  // 카테고리 선택
  console.log('\n📂 카테고리 목록:');
  const sorted = [...categories].sort((a, b) => a.question_count - b.question_count);
  sorted.forEach((c, i) => {
    console.log(`  [${i + 1}] ${c.icon} ${c.title} (${c.question_count}개)`);
  });

  const catInput = await ask('\n카테고리 번호 선택: ');
  const catIndex = parseInt(catInput, 10) - 1;
  if (catIndex < 0 || catIndex >= sorted.length) {
    console.error('잘못된 번호입니다.');
    rl.close();
    return;
  }
  const selectedCategory = sorted[catIndex];

  console.log(`\n📝 "${selectedCategory.title}" 카테고리 질문 후보 생성 중...\n`);

  const existing = await fetchQuestionsByCategory(selectedCategory.id);
  const prompt = buildPrompt(selectedCategory, existing, topic);

  let candidates;
  try {
    const raw = await callGemini(prompt);
    // JSON 블록 추출
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');
    candidates = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('❌ 질문 생성 실패:', err.message);
    rl.close();
    return;
  }

  console.log(`\n${candidates.length}개 후보가 생성되었습니다.\n`);

  let addedCount = 0;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    console.log(`[후보 ${i + 1}] ${c.difficulty} | ${c.question}`);
    console.log(`  소분류: ${c.sub_category} | 태그: ${c.tags.join(', ')}`);

    const choice = await ask('  승인? (y/n/e=편집): ');

    if (choice.trim().toLowerCase() === 'y') {
      const orderNum = await getNextOrderNum(selectedCategory.id);
      const id = await insertQuestion({
        category_id: selectedCategory.id,
        question: c.question,
        answer: c.answer,
        sub_category: c.sub_category,
        difficulty: c.difficulty,
        tags: c.tags,
        order_num: orderNum,
      });
      console.log(`  ✅ 추가 완료 (${id})\n`);
      addedCount++;
    } else if (choice.trim().toLowerCase() === 'e') {
      const newQ = await ask('  질문 수정: ');
      const newDiff = await ask('  난이도 (easy/medium/hard): ');
      const orderNum = await getNextOrderNum(selectedCategory.id);
      const id = await insertQuestion({
        category_id: selectedCategory.id,
        question: newQ || c.question,
        answer: c.answer,
        sub_category: c.sub_category,
        difficulty: newDiff || c.difficulty,
        tags: c.tags,
        order_num: orderNum,
      });
      console.log(`  ✅ 수정 후 추가 완료 (${id})\n`);
      addedCount++;
    } else {
      console.log('  ⏭️  건너뜀\n');
    }
  }

  console.log(`\n🎉 총 ${addedCount}건 추가 완료\n`);
  rl.close();
}

main().catch((err) => {
  console.error('❌ 오류 발생:', err);
  rl.close();
  process.exit(1);
});
