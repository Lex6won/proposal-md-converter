<div align="center">

# 제안서 MD 변환 도구

### 제안서, PDF, 발표자료를 AI가 읽기 좋은 Markdown으로 변환하세요.

HWPX, HWP, PDF, PPTX 문서를 Markdown으로 바꾸고, 스캔 PDF와 이미지 텍스트는 OCR로 보완하며, 주민등록번호·전화번호·이메일 같은 개인정보는 자동 마스킹할 수 있는 문서 변환 도구입니다.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)
![OCR](https://img.shields.io/badge/OCR-kor%2Beng-orange.svg)
![Pages](https://img.shields.io/badge/GitHub_Pages-web_version-informational.svg)
![Windows](https://img.shields.io/badge/Full_version-Windows-lightgrey.svg)

</div>

---

## 핵심 링크

| 목적 | 링크 |
|---|---|
| 설치 없이 바로 사용 | https://lex6won.github.io/proposal-md-converter/ |
| 풀버전 ZIP 다운로드 | https://github.com/Lex6won/proposal-md-converter/releases/latest |
| 풀버전 ZIP 바로 받기 | https://github.com/Lex6won/proposal-md-converter/releases/latest/download/proposal-md-converter-full-windows-v1.0.0-lite.zip |
| 소스 코드 보기 | https://github.com/Lex6won/proposal-md-converter |

> **중요:** 풀버전은 ZIP을 받은 뒤 `실행.bat`를 먼저 실행해야 사용할 수 있습니다. `실행.bat`를 실행하기 전에는 `http://localhost:3000`에 접속해도 열리지 않습니다.

---

## 목차

- [60초 시작 가이드](#60초-시작-가이드)
- [웹판과 풀버전 차이](#웹판과-풀버전-차이)
- [누구에게 필요한가](#누구에게-필요한가)
- [무엇을 할 수 있나요](#무엇을-할-수-있나요)
- [사용 가이드](#사용-가이드)
- [지원 형식](#지원-형식)
- [보안과 개인정보](#보안과-개인정보)
- [문제 해결](#문제-해결)
- [개발자용 실행](#개발자용-실행)
- [라이선스](#라이선스)

---

## 60초 시작 가이드

### 가장 빠른 방법: 웹판

PDF나 이미지 파일을 빠르게 Markdown으로 바꾸려면 웹판을 사용하세요.

1. https://lex6won.github.io/proposal-md-converter/ 에 접속합니다.
2. PDF, 이미지, TXT/MD 파일을 끌어다 놓습니다.
3. 필요한 경우 `OCR`, `개인정보 마스킹` 옵션을 켭니다.
4. `변환`을 누릅니다.
5. 결과를 복사하거나 `.md` 파일로 다운로드합니다.

### 가장 안정적인 방법: 풀버전

HWPX, HWP, PPTX까지 변환하려면 풀버전을 사용하세요.

1. https://github.com/Lex6won/proposal-md-converter/releases/latest 에서 ZIP 파일을 다운로드합니다.
2. `proposal-md-converter-full-windows-v1.0.0-lite.zip`을 압축 해제합니다.
3. 압축 해제한 폴더에서 `실행.bat`를 더블클릭합니다.
4. 브라우저가 `http://localhost:3000`으로 열리면 파일을 업로드합니다.
5. 변환 결과를 다운로드하거나 복사합니다.

> `실행.bat`가 로컬 변환 서버를 켜는 시작 버튼입니다. ZIP을 받거나 압축을 푼 것만으로는 서버가 실행되지 않습니다.

---

## 웹판과 풀버전 차이

| 구분 | 웹판 | 풀버전 |
|---|---|---|
| 실행 방식 | URL 접속 | ZIP 다운로드 후 `실행.bat` |
| 설치 필요 | 없음 | 압축 해제만 필요 |
| 주요 대상 | PDF, 스캔 PDF, 이미지, TXT/MD | HWPX, HWP, PDF, PPTX |
| OCR | 브라우저 OCR | 로컬 Tesseract OCR |
| PPTX 변환 | 미지원 | 지원 |
| HWP/HWPX 변환 | 미지원 | 지원 |
| 대용량 문서 | 제한적 | 더 안정적 |
| 추천 사용자 | 빠르게 체험할 사용자 | 실제 업무 문서 변환 사용자 |

정리하면, **간단한 PDF 변환은 웹판**, **업무용 문서 변환은 풀버전**을 권장합니다.

> 구형 `.ppt` 파일은 직접 지원하지 않습니다. PowerPoint에서 `.pptx`로 저장한 뒤 변환해 주세요.

---

## 누구에게 필요한가

- 제안서, 사업계획서, 발표자료를 AI에게 입력하기 좋은 Markdown으로 바꾸고 싶은 분
- PDF나 스캔 PDF의 텍스트를 추출해야 하는 공공기관·기업 실무자
- HWPX, HWP, PPTX 자료를 한 번에 Markdown으로 정리하고 싶은 분
- 개인정보가 포함된 문서를 변환하기 전에 기본 마스킹을 적용하고 싶은 분
- ChatGPT, Claude, Gemini, Copilot 등에 넣을 문서 원문을 정리하고 싶은 분

---

## 무엇을 할 수 있나요

| 기능 | 설명 |
|---|---|
| 문서 Markdown 변환 | HWPX, HWP, PDF, PPTX를 Markdown으로 변환 |
| 스캔 PDF OCR | 텍스트 추출이 어려운 PDF는 OCR fallback으로 보완 |
| PPTX 이미지 OCR | 발표자료 안 이미지의 텍스트를 OCR로 추출 |
| 페이지/슬라이드 마커 | `<!-- page: 1 -->`, `<!-- slide: 1 -->` 형태로 위치 표시 |
| 개인정보 마스킹 | 주민번호, 전화번호, 이메일, 계좌번호 등 기본 마스킹 |
| 결과 다운로드 | 변환 결과를 `.md` 파일로 저장 |
| 로컬 처리 | 풀버전은 내 PC에서 로컬 서버로 처리 |

---

## 사용 가이드

### 웹판: PDF와 이미지를 바로 변환

웹판 주소:

```text
https://lex6won.github.io/proposal-md-converter/
```

지원 파일:

- `.pdf`
- `.png`, `.jpg`, `.jpeg`, `.webp`
- `.txt`, `.md`

웹판에서 `.pptx`, `.ppt`, `.hwp`, `.hwpx`를 선택하면 풀버전 사용 안내가 표시됩니다.

### 풀버전: HWPX/HWP/PPTX까지 변환

풀버전 다운로드:

```text
https://github.com/Lex6won/proposal-md-converter/releases/latest/download/proposal-md-converter-full-windows-v1.0.0-lite.zip
```

실행 순서:

1. ZIP 파일을 다운로드합니다.
2. 압축을 해제합니다.
3. 압축 해제한 폴더 안에서 `실행.bat`를 더블클릭합니다.
4. 브라우저가 자동으로 열리지 않으면 주소창에 아래 주소를 입력합니다.

```text
http://localhost:3000
```

5. 단, 위 주소는 `실행.bat` 실행 후에만 열립니다.
6. 파일을 끌어다 놓거나 클릭해서 선택합니다.
7. PDF/PPTX는 `이미지 OCR 사용` 옵션을 필요에 따라 켭니다.
8. `개인정보 자동 마스킹` 옵션을 확인합니다.
9. 변환 후 Markdown을 다운로드하거나 복사합니다.

---

## 지원 형식

| 입력 | 웹판 | 풀버전 | 비고 |
|---|---:|---:|---|
| `.pdf` | 지원 | 지원 | 스캔 PDF는 OCR 가능 |
| `.png`, `.jpg`, `.jpeg`, `.webp` | 지원 | 제한적 | 웹판 OCR 권장 |
| `.txt`, `.md` | 지원 | 제한적 | 웹판에서 바로 정리 가능 |
| `.hwpx` | 미지원 | 지원 | 풀버전 권장 |
| `.hwp` | 미지원 | 지원 | 풀버전 권장 |
| `.pptx` | 미지원 | 지원 | 풀버전 권장 |
| `.ppt` | 미지원 | 미지원 | `.pptx`로 저장 후 사용 |

---

## 변환 결과 예시

PDF 결과:

```yaml
---
source: "원본파일명.pdf"
converted_at: "2026-05-31T20:30:00+09:00"
pages: 3
converter: "kordoc v2.7.1"
---
```

스캔 PDF에서 OCR이 사용되면 `ocr_pages`가 추가됩니다.

```yaml
---
source: "스캔문서.pdf"
converted_at: "2026-05-31T20:30:00+09:00"
pages: 3
ocr_pages: 3
converter: "kordoc v2.7.1 + OCR(eng+kor)"
---
```

PPTX는 `pages` 대신 `slides`를 사용하고, OCR 결과가 있으면 `ocr_images`가 추가됩니다.

```yaml
---
source: "발표자료.pptx"
converted_at: "2026-05-31T20:30:00+09:00"
slides: 12
ocr_images: 3
converter: "officeparser v7.0.3 + OCR(eng+kor)"
---
```

본문에는 문서 경계 마커가 들어갑니다.

```markdown
<!-- page: 1 -->

<!-- slide: 1 -->
```

---

## 보안과 개인정보

### 웹판

- 사용자가 선택한 파일을 별도 서버로 업로드하지 않습니다.
- 브라우저 안에서 변환합니다.
- 단, 웹판은 `pdfjs-dist`, `tesseract.js` 같은 공개 JavaScript 라이브러리를 CDN에서 불러옵니다.

### 풀버전

- 내 PC에서 `http://localhost:3000` 로컬 서버를 실행합니다.
- 업로드 임시 파일은 변환 후 삭제됩니다.
- 변환 결과는 `output/` 폴더에 저장되며 기본적으로 최근 50개만 유지합니다.
- 외부 서버로 문서를 전송하지 않습니다.

### 개인정보 마스킹 대상

- 주민등록번호
- 휴대폰/전화번호
- 이메일
- 사업자등록번호
- 법인등록번호
- 카드번호
- `계좌`, `계좌번호`, `입금계좌`, `은행` 키워드 주변 계좌번호

> 자동 마스킹은 보조 기능입니다. 민감 문서를 외부에 공유하기 전에는 반드시 사람이 한 번 더 확인해 주세요.

---

## 문제 해결

### ZIP을 다운로드했는데 실행이 안 됩니다

Windows 보안 경고가 표시될 수 있습니다. ZIP 파일을 압축 해제한 뒤 `실행.bat`를 다시 실행해 보세요.

### 브라우저가 자동으로 열리지 않습니다

먼저 `실행.bat`가 실행 중인지 확인한 뒤, 주소창에 직접 입력하세요.

```text
http://localhost:3000
```

`실행.bat`를 실행하지 않은 상태에서는 이 주소가 열리지 않습니다.

### PPT 파일에서 오류가 납니다

구형 `.ppt`는 지원하지 않습니다. PowerPoint에서 `.pptx`로 저장한 뒤 다시 변환해 주세요.

### PPTX가 웹판에서 변환되지 않습니다

정상입니다. GitHub Pages 웹판은 정적 웹앱이라 PPTX/HWPX 변환에 필요한 Node.js 기반 파서를 실행할 수 없습니다. 풀버전을 사용해 주세요.

### 이미지 위주의 PDF에서 텍스트가 적게 나옵니다

풀버전에서 `이미지 OCR 사용`을 켠 상태로 변환해 주세요. 문서 품질이 낮거나 해상도가 낮은 스캔본은 OCR 정확도가 떨어질 수 있습니다.

### 포트 3000을 이미 사용 중이라고 나옵니다

다른 프로그램이 `3000` 포트를 사용 중일 수 있습니다. 개발자 실행 환경에서는 `PORT` 값을 바꿔 실행할 수 있습니다.

```powershell
$env:PORT=3010
node app.js
```

---

## 개발자용 실행

Node.js가 설치되어 있다면 소스에서 직접 실행할 수 있습니다.

```powershell
npm install
npm start
```

다른 포트로 실행하려면:

```powershell
$env:PORT=3010
node app.js
```

---

## 폴더 구조

```text
app.js                  Express 서버
core/router.js          확장자별 변환 라우팅
core/postprocess.js     frontmatter 생성
core/page-markers.js    HWPX/HWP/PDF 페이지 마커 공통 렌더링
core/privacy-mask.js    정규식 기반 개인정보 마스킹
converters/hwpx.js      HWPX/HWP 변환
converters/pdf.js       PDF 변환 + OCR fallback
converters/pptx.js      PPTX 변환 + 선택형 OCR
public/index.html       풀버전 로컬 UI
docs/                   GitHub Pages 웹판
tessdata/               OCR 학습 데이터
runtime/                배포용 Node.js 런타임
uploads/                임시 업로드 파일, 변환 후 삭제
output/                 변환 결과 MD, 기본 최근 50개 유지
```

---

## 환경 변수

| 이름 | 기본값 | 설명 |
|---|---:|---|
| `PORT` | `3000` | 서버 포트 |
| `OUTPUT_MAX_FILES` | `50` | `output/`에 유지할 최근 Markdown 파일 수 |

---

## 한계

- 웹판은 HWPX/HWP/PPTX 고품질 변환을 지원하지 않습니다.
- 구형 `.ppt` 파일은 지원하지 않습니다.
- OCR 결과는 원본 해상도, 글자 크기, 스캔 품질에 따라 달라집니다.
- 표, 도형, 복잡한 레이아웃은 Markdown 변환 과정에서 원본과 완전히 같게 보존되지 않을 수 있습니다.

---

## 라이선스

MIT License. 자유롭게 사용, 수정, 배포할 수 있습니다.
