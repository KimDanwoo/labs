import { GoogleGenerativeAI } from '@google/generative-ai'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  tools: [{ googleSearch: {} }]
})

async function generatePost() {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const dateKr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  console.log(`[${dateStr}] 테크 뉴스 수집 시작...`)

  const result = await model.generateContent(`
오늘(${dateKr}) 기준으로 개발자들이 관심을 가질 만한 테크 뉴스 5개를 찾아서 정리해줘.

조건:
- AI, 프론트엔드, 백엔드, 클라우드, 오픈소스, 보안 등 다양한 분야에서 선택
- 각 뉴스마다 원문 링크 포함 (실제 URL)
- 한국어로 요약 (3~5문장)
- 왜 개발자에게 중요한지 한 줄 코멘트 추가

아래 마크다운 형식으로만 작성해줘 (frontmatter 없이):

## 오늘의 테크 뉴스 TOP 5

### 1. [뉴스 제목](원문 URL)
> 💡 왜 중요한가: 한 줄 요약

**요약**
3~5문장 요약 내용

---

### 2. ...
(5개까지)

---
*이 포스트는 Gemini AI가 자동으로 수집·정리한 뉴스입니다.*
`)

  const content = result.response.text()

  const slug = `${dateStr}-tech-news`
  const dir = join(ROOT, 'contents/blog', slug)
  mkdirSync(dir, { recursive: true })

  const frontmatter = `---
title: "오늘의 테크 뉴스 TOP 5 (${dateKr})"
date: ${dateStr}
description: "오늘 개발자들이 주목해야 할 테크 뉴스 5가지를 AI가 정리했습니다."
category: "news"
isHidden: false
---

`

  const filePath = join(dir, 'index.md')
  writeFileSync(filePath, frontmatter + content, 'utf-8')

  console.log(`✅ 생성 완료: contents/blog/${slug}/index.md`)
}

generatePost().catch(err => {
  console.error('포스트 생성 실패:', err)
  process.exit(1)
})
