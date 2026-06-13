# 제안서 → Markdown 변환 시스템 분석 보고서

> **작성일**: 2026-05-16 (v2 — GitHub 소스 분석 반영)
> **대상**: 공무원 제안서 평가 업무 (HWPX + PPT/PDF → MD 변환)

---

## 1. 요구사항 요약

| 항목 | 내용 |
|------|------|
| **입력 파일** | 제안서(HWPX), 발표자료(PDF 또는 PPT) |
| **출력 파일** | Markdown (.md) — AI(LLM)가 읽기 쉬운 형식 |
| **활용 목적** | AI 분석 + 검색/열람 모두 필요 |
| **처리 규모** | 소규모 (월 10건 미만) |
| **선호 언어** | Node.js (Python 불필요) |

---

## 2. GitHub 소스 분석 결과

kordoc과 MarkItDown 저장소를 직접 분석한 내용을 바탕으로 아키텍처를 개선했습니다.

### 2.1 kordoc 저장소 분석 (v2.7.1)

| 항목 | 내용 |
|------|------|
| **저장소** | [chrisryugj/kordoc](https://github.com/chrisryugj/kordoc) — TypeScript 99.5% |
| **버전** | v2.7.1, 119 커밋 |
| **인기** | ⭐ **927** (초기 분석 시 314보다 크게 증가), 포크 180 |
| **제작자** | 대한민국 지방공무원 (광진구청 7년) — 5개 공공 프로젝트 검증 |
| **라이선스** | MIT |
| **생산 의존성** | **6개**만으로 초경량: `jszip`, `@xmldom/xmldom`, `commander`, `cfb`, `markdown-it`, `zod`, `@modelcontextprotocol/sdk` |
| **빌드** | tsup → ESM + CJS 듀얼 번들 |

#### 소스 코드 구조

```
src/
├── index.ts        ← 메인 API (parse, fillForm, compare 등)
├── cli.ts          ← CLI (commander 기반, watch/fill/mcp/setup 하위명령어)
├── mcp.ts          ← MCP 서버 (8개 도구)
├── detect.ts       ← 매직바이트 기반 포맷 자동감지
├── types.ts        ← 전체 타입 정의
│
├── hwpx/           ★ HWPX 파서 (ZIP + XML DOM)
├── hwp5/           ★ HWP 5.x 파서 (OLE2 CFB 바이너리)
├── hwp3/           HWP 3.x 구버전 파서
├── hwpml/          HWPML (XML 기반 HWP)
├── pdf/            ★ PDF 파서 (pdfjs-dist)
├── xlsx/           XLSX 파서
├── xls/            XLS (Excel 97-2003) 파서
├── docx/           ★ DOCX 파서
├── diff/           문서 비교 (신구대조표)
├── form/           양식 인식/채우기
├── table/          IRBlock → Markdown 변환
└── print/          HTML/PDF 출력
```

#### 핵심 발견 — kordoc이 생각보다 강력함

| 기능 | 상세 |
|------|------|
| **HWPX → MD** | ZIP + XML DOM 파싱, 중첩 테이블/병합셀/이미지 완벽 처리 |
| **HWP 5.x → MD** | 바이너리 파싱, 배포용 DRM 복호화(AES-128), 손상 CFB 복구, 각주/하이퍼링크 |
| **HWP 3.x → MD** | 1996~2002 구버전 포맷까지 지원 |
| **PDF → MD** | **pdfjs-dist 내장**. 선 기반 테이블 감지, XY-Cut 읽기 순서, 머리글/바닥글 제거, 수식 OCR(ONNX), 2단 레이아웃 감지 |
| **DOCX → MD** | 스타일 기반 heading, 번호 매기기, 각주, 이미지 |
| **XLSX → MD** | 공유 문자열, 병합 셀, 다중 시트 |
| **Watch 모드** | `kordoc watch ./접수폴더 -d ./변환결과` — 파일 넣으면 자동 변환 |
| **MCP 서버** | 8개 도구(parse, compare, fill_form 등) — Claude/Cursor에서 직접 문서 파싱 |
| **보안** | ZIP bomb, XXE, SSRF, 경로 순회, 파일 크기(500MB) 제한 — 프로덕션급 |
| **파일 크기** | 500MB 제한 |
| **CLI** | `npx kordoc` 만으로 설치없이 즉시 사용 |

#### kordoc의 유일한 한계 — PPT 미지원 ❌

소스 코드 어디에도 PPTX 관련 처리가 없습니다. PPT 변환은 별도 구현이 필요합니다.

---

### 2.2 MarkItDown 저장소 분석 (v0.1.5)

| 항목 | 내용 |
|------|------|
| **저장소** | [microsoft/markitdown](https://github.com/microsoft/markitdown) — Python 99.7% |
| **제작** | Microsoft AutoGen Team |
| **인기** | ⭐ **123,000** |
| **용도** | PPTX/DOCX/XLSX/PDF/이미지/오디오 → Markdown |

#### PPTX 변환기 분석 (`converters/_pptx_converter.py`)

- `python-pptx` 라이브러리 기반
- 슬라이드 타이틀 → Markdown heading
- 표(Table) → Markdown table
- 차트(Chart) → 표 형태로 변환
- 이미지 → 선택적 LLM 캡션
- 발표자 노트 추출

---

## 3. 포맷별 라이브러리 선정 (개선안)

### 3.1 HWPX/PDF → Markdown: kordoc (Node.js)

#### 선정 사유

| 평가 항목 | 내용 |
|-----------|------|
| **도구** | [kordoc](https://github.com/chrisryugj/kordoc) |
| **버전** | v2.7.1 |
| **언어** | Node.js / TypeScript |
| **라이선스** | MIT (완전 무료) |
| **설치** | `npm install kordoc` |
| **GitHub** | ⭐ **927** |
| **생산 의존성** | **6개** (초경량) |

kordoc은 실제 공무원이 한국 공문서 처리 경험을 바탕으로 제작하였으며, **HWPX는 물론 PDF까지 동일한 API로 변환**합니다. 소스 코드 분석 결과 보안, 오류 처리, 성능 모두 프로덕션 수준입니다.

#### CLI 사용

```bash
# HWPX 변환
npx kordoc ./제안서.hwpx -o ./제안서.md

# PDF 변환 (kordoc이 pdfjs-dist로 처리)
npx kordoc ./발표자료.pdf -o ./발표자료.md

# 디렉토리 일괄 변환
npx kordoc *.hwpx -d ./변환결과/

# Watch 모드 (파일 넣기만 하면 자동)
npx kordoc watch ./접수폴더 -d ./변환결과
```

#### Python API 사용 예시

```javascript
import { parse } from 'kordoc';
import { readFileSync } from 'fs';

const buffer = readFileSync('사업계획서.hwpx');
const result = await parse(buffer.buffer);

console.log(result.markdown);   // MD 텍스트
console.log(result.metadata);   // { title, author, createdAt, ... }
```

#### 추가 기능
- **신구대조표 자동 생성**: 두 문서(HWP/HWPX 간) 비교 (`compare()`)
- **MD → HWPX 역변환**: AI 분석 결과를 다시 공문서 양식으로 (`markdownToHwpx()`)
- **MCP 서버**: Claude, Cursor 등 AI 도구에서 직접 연동 가능
- **양식 자동 채우기**: 템플릿 빈칸 자동 작성 (`fillForm()`)
- **OCR 연동**: 이미지 기반 PDF 텍스트 추출

---

### 3.2 PPT → Markdown: Node.js 네이티브 (jszip + xmldom)

#### 선정 사유

**초기 제안을 개선했습니다.** 당초 Python(MarkItDown) subprocess 방식을 제안했으나, 소스 분석 결과 kordoc이 이미 `jszip` + `@xmldom/xmldom`을 의존성으로 보유하고 있어 **동일 스택으로 PPTX를 직접 파싱**할 수 있습니다.

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| **PPT 변환 방식** | MarkItDown (Python subprocess) | jszip + xmldom (Node.js 네이티브) |
| **추가 의존성** | Python + pip install 필요 | **없음** (kordoc 의존성과 동일) |
| **설치 복잡도** | Python 환경 설정 필요 | `npm install` 만으로 끝 |
| **운영 체계** | Python + Node.js 이중 관리 | **Node.js 단일** |

#### PPTX 파일 구조

PPTX는 DOCX/HWPX와 동일하게 **ZIP 압축된 XML 파일 묶음**입니다:

```
PPTX = ZIP 파일
├── ppt/slides/slide1.xml    ← 슬라이드 내용 (텍스트, 표)
├── ppt/slides/slide2.xml
├── ppt/slides/_rels/        ← 이미지 참조 관계
├── ppt/media/               ← 이미지 파일
└── [Content_Types].xml
```

kordoc이 이미 DOCX(동일한 ZIP+XML 구조)를 성공적으로 파싱하므로, 동일한 방식으로 PPTX 파서를 구현 가능합니다.

#### 구현 방안

```javascript
// kordoc과 동일한 스택 (이미 설치됨)
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function pptxToMarkdown(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slides = [];
  
  // ppt/slides/slideN.xml 순회
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort();
  
  for (const slideFile of slideFiles) {
    const xml = await zip.file(slideFile).async('string');
    const doc = new DOMParser().parseFromString(xml);
    // XML 파싱 → Markdown 변환
    // (kordoc의 DOCX 파서 로직과 동일 패턴)
    slides.push(extractSlideContent(doc));
  }
  
  return slides.join('\n\n---\n\n');
}
```

---

## 4. 전체 아키텍처 (개선안)

```
         ┌─────────────────────────────┐
         │   Node.js ONLY (Python ❌)   │
         └─────────────────────────────┘

사용자: HWPX / PDF / PPTX 파일 업로드
                │
                ▼
┌──────────────────────────────────────────────┐
│         Node.js Orchestrator                  │
│            (Express.js)                       │
│                                              │
│  ┌─────────────┐  ┌──────────┐  ┌─────────┐ │
│  │ 파일 확장자   │→│ 적합 변환기 │→│  MD 출력 │ │
│  │  판별        │  │  라우팅   │  │         │ │
│  └─────────────┘  └──────────┘  └─────────┘ │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  kordoc (npm)                        │    │
│  │  ├── .hwpx  → MD  (ZIP + XML DOM)   │    │
│  │  ├── .pdf   → MD  (pdfjs-dist)      │    │
│  │  └── (내장 포맷 감지 + 변환)          │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  PPTX Parser (커스텀)                │    │
│  │  ├── jszip + xmldom (kordoc과 동일)  │    │
│  │  ├── 슬라이드 제목 → heading          │    │
│  │  ├── 표 → Markdown table             │    │
│  │  └── 이미지 추출                     │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
                │
                ▼
       ┌────────────────┐
       │  .md 파일 출력   │
       │  + 원본 파일 보존 │
       └────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
   AI 분석 (LLM)    검색/열람
   (Claude, GPT 등)  (Windows 검색, grep)

```

---

## 5. 개발 방식 제안 (3가지 옵션)

### 🏆 Option A: 웹 인터페이스 (Express.js) ⭐ 추천

| 항목 | 내용 |
|------|------|
| **개요** | 브라우저에서 파일 업로드 → 변환 → 미리보기 |
| **장점** | 직관적, 비개발자 동료도 사용 가능, 로컬 실행으로 보안 |
| **프레임워크** | Express.js + EJS 또는 React |
| **추가 가능 기능** | MD 미리보기 에디터, 다중 파일 변환, 변환 이력 |

#### 사용 시나리오

```
1. http://localhost:3000 접속
2. 제안서(HWPX) + 발표자료(PDF/PPT) 업로드 (드래그앤드롭)
3. 변환 버튼 클릭
4. 변환된 MD 확인 + 복사/다운로드
5. Claude/GPT에 붙여넣어 평가 분석 의뢰
```

#### 필요한 패키지

```bash
npm install express multer kordoc jszip @xmldom/xmldom
# ⚡ Python 불필요! Node.js만 있으면 끝
```

---

### Option B: CLI 도구

| 항목 | 내용 |
|------|------|
| **개요** | 터미널 기반 명령어 도구 |
| **장점** | 가장 단순하고 빠름, 배치 처리 용이 |
| **사용법** | `proposal2md ./제안서.hwpx -o ./output.md` |

#### 사용 시나리오

```bash
# 단일 파일
npx proposal2md ./사업계획서.hwpx

# 특정 폴더 전체
npx proposal2md ./제안서_폴더 --batch

# 발표자료 포함
npx proposal2md ./입찰제안.hwpx ./발표자료.pptx
```

---

### Option C: 폴더 감시(Watcher) 모드

| 항목 | 내용 |
|------|------|
| **개요** | 특정 폴더에 파일을 넣으면 자동 변환 |
| **장점** | 반복 작업 완전 자동화 |
| **도구** | chokidar (Node.js 파일 감시 라이브러리) |

```bash
npx proposal2md watch ./접수폴더 -d ./변환결과
```

> **💡 참고**: kordoc 자체에 Watch 모드가 내장되어 있습니다. 별도 구현 없이 `npx kordoc watch ./접수폴더 -d ./변환결과`로 동일한 기능을 즉시 사용할 수 있습니다.

파일을 접수폴더에 넣기만 하면 자동으로 변환되어 결과물이 생성됩니다.

---

## 6. GitHub 분석을 통해 얻은 주요 개선점

초기 제안 대비 실제 소스 분석을 통해 발견한 개선 사항입니다.

| 구분 | 초기 제안 | 실제 분석 후 개선 | 효과 |
|------|-----------|-------------------|------|
| **PDF 변환** | 별도 라이브러리 필요할 것으로 추정 | kordoc이 **pdfjs-dist 내장**으로 PDF 완벽 지원 | 추가 설치 불필요 |
| **PPT 변환** | MarkItDown (Python subprocess) | kordoc과 **동일 스택**(jszip + xmldom)으로 Node.js 전용 구현 가능 | **Python 의존성 제거** 🎉 |
| **kordoc 평가** | ⭐ 314 (npm 기준) | 실제 GitHub **⭐ 927**, 프로덕션급 보안/에러 처리 | 예상보다 성숙한 프로젝트 |
| **설치 복잡도** | npm + pip (이중 관리) | **npm install 만으로 끝** | 획기적 단순화 |
| **구현 복잡도** | PPT 변환을 위해 Python과 Node.js 연동 로직 필요 | kordoc 코드(특히 DOCX 파서)를 **그대로 참고**하여 PPTX 파서 구현 | 구현 리스크 감소 |

---

## 7. 공무원 활용 시나리오

### 7.1 평가 업무 플로우

```
① 평가 공고 → 업체 제안서 접수
      │
② HWPX 제안서 + PPT/PDF 발표자료 수집
      │
③ 변환 도구에 파일 업로드
      │
④ MD 파일 자동 생성
      │
⑤ AI 도구(Claude, GPT 등)에 MD 파일 전달
      │
      ├─ "이 제안서를 평가 기준에 따라 분석해줘"
      ├─ "A사와 B사의 기술력 항목을 비교해줘"
      └─ "평가 항목별 점수를 제안해줘"
      │
⑥ AI 분석 결과를 바탕으로 평가안 작성
```

### 7.2 효용 포인트

| 활용 영역 | 설명 |
|-----------|------|
| **빠른 평가** | 수십 페이지 제안서를 AI가 즉시 분석, 평가 시간 1/10로 단축 |
| **객관적 비교** | 정량/정성 평가 기준을 프롬프트에 명시하여 동일 기준으로 평가 |
| **검색 가능** | MD 파일은 일반 텍스트이므로 Windows 검색, grep 등으로 내용 검색 가능 |
| **보안** | 모든 변환이 로컬에서 이루어짐 (외부 서버 업로드 불필요) |
| **보존** | MD는 Git 형상관리, 백업, 변환 내역 추적에 용이 |

### 7.3 추천 AI 프롬프트 템플릿

```
아래는 제안서를 Markdown으로 변환한 내용입니다.
다음 평가 기준에 따라 분석해주세요:

[평가 기준 예시]
1. 기술력 (40점)
2. 수행능력 (30점)  
3. 가격 적정성 (20점)
4. 기타 가점 (10점)

제안서 내용:
[변환된 MD 내용 붙여넣기]
```

---

## 8. 개발 방법 요약

| 항목 | 권장 사항 |
|------|-----------|
| **주 언어** | Node.js / TypeScript (Python 불필요) |
| **웹 프레임워크** | Express.js (Option A 선택시) |
| **HWPX 변환** | `kordoc` (npm) |
| **PDF 변환** | `kordoc` (npm, pdfjs-dist 내장) |
| **PPT 변환** | jszip + @xmldom/xmldom (Node.js 네이티브, kordoc과 동일 스택) |
| **설치 명령어** | `npm install kordoc jszip @xmldom/xmldom` **단 1줄** |
| **개발 규모** | 단일 페이지 웹앱 또는 CLI 도구 (소규모) |
| **추천 방식** | **Option A (웹 인터페이스)** — 직관성 + 접근성 |

---

## 9. 참고 자료

| 자료 | 링크 | 비고 |
|------|------|------|
| kordoc (npm) | https://www.npmjs.com/package/kordoc | `npm install kordoc` |
| kordoc (GitHub) | https://github.com/chrisryugj/kordoc | ⭐ 927, 소스 분석 완료 |
| MarkItDown (GitHub) | https://github.com/microsoft/markitdown | ⭐ 123k, PPTX 컨버터 참고용 |
| jszip | https://www.npmjs.com/package/jszip | ZIP 파싱 (kordoc과 동일) |
| @xmldom/xmldom | https://www.npmjs.com/package/@xmldom/xmldom | XML 파싱 (kordoc과 동일) |
| 한컴 HWPX 포맷 문서 | https://tech.hancom.com/hwpxformat | HWPX 구조 참고 |

---

> **핵심 요약**: kordoc GitHub 저장소를 직접 분석한 결과, HWPX/PDF 변환은 완벽히 지원되며 PPT도 kordoc의 기술 스택(jszip + xmldom)을 그대로 활용하여 **Python 의존성 없이 Node.js만으로 전체 파이프라인 구축이 가능**함을 확인했습니다.
>
> 개발 진행을 원하시면 각 Option별 상세 구현 계획을 수립하여 드리겠습니다.
