# 제안서 MD 변환 도구

HWPX, HWP, PDF, PPTX 파일을 AI가 읽기 좋은 Markdown으로 변환하는 로컬 도구입니다.

- HWPX/HWP/PDF: `kordoc`
- PDF: `kordoc` + 텍스트 추출 실패 시 Tesseract OCR fallback
- PPTX: `officeparser` + 선택형 Tesseract OCR
- 서버: Express.js, 기본 포트 3000
- 처리 방식: 로컬 처리, 외부 전송 없음
- 개인정보 마스킹: 기본 켜짐

## 지원 형식

| 입력 | 변환기 | 비고 |
|---|---|---|
| `.hwpx` | kordoc | 페이지/섹션 마커 포함 |
| `.hwp` | kordoc | HWP 타입으로 별도 표시 |
| `.pdf` | kordoc + OCR fallback | 텍스트 추출이 어렵거나 스캔 PDF이면 OCR 자동 시도 |
| `.pptx` | officeparser | 이미지 OCR 옵션 제공 |

구버전 `.ppt`는 현재 지원하지 않습니다.

## 출력 형식

```yaml
---
source: "원본파일명.pdf"
converted_at: "2026-05-31T20:30:00+09:00"
pages: 3
converter: "kordoc v2.7.1"
---
```

PDF OCR fallback이 사용되면 `ocr_pages`가 추가됩니다.

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

## 사용법

1. `실행.bat`를 실행합니다.
2. 브라우저가 `http://localhost:3000`으로 열립니다.
3. 파일을 드래그하거나 클릭해서 선택합니다.
4. PDF/PPTX는 `이미지 OCR 사용` 옵션을 필요에 따라 켜거나 끕니다.
5. `개인정보 자동 마스킹`은 기본으로 켜져 있습니다.
6. 변환 후 Markdown을 다운로드하거나 복사합니다.

## 공개 URL과 풀버전

- 웹판: https://lex6won.github.io/proposal-md-converter/
- 풀버전 다운로드: https://github.com/Lex6won/proposal-md-converter/releases/latest

GitHub Pages 웹판은 브라우저에서 바로 실행되므로 PDF, 스캔 PDF, 이미지, TXT/MD 중심으로 제공합니다.
HWPX/HWP/PDF/PPTX 전체 변환과 PPTX 이미지 OCR은 풀버전 ZIP을 다운로드한 뒤 `실행.bat`로 실행하는 방식이 성능과 안정성이 가장 좋습니다.
구형 `.ppt` 파일은 먼저 PowerPoint에서 `.pptx`로 저장한 뒤 변환하세요.

## 개발 실행

```powershell
npm start
```

다른 포트로 실행하려면:

```powershell
$env:PORT=3010
node app.js
```

## 폴더 구조

```text
app.js                  Express 서버
core/router.js          확장자별 변환 라우팅
core/postprocess.js     frontmatter 생성
core/page-markers.js    HWPX/HWP/PDF 페이지 마커 공통 렌더링
core/privacy-mask.js    정규식 기반 개인정보 마스킹
converters/hwpx.js      HWPX/HWP 변환
converters/pdf.js       PDF 변환
converters/pptx.js      PPTX 변환 + 선택형 OCR
public/index.html       드래그앤드롭 UI
docs/                   GitHub Pages용 정적 웹 버전
tessdata/               OCR 학습 데이터
runtime/                배포용 Node.js 런타임
uploads/                임시 업로드 파일, 변환 후 삭제
output/                 변환 결과 MD, 기본 최근 50개 유지
```

## 환경 변수

| 이름 | 기본값 | 설명 |
|---|---:|---|
| `PORT` | `3000` | 서버 포트 |
| `OUTPUT_MAX_FILES` | `50` | `output/`에 유지할 최근 Markdown 파일 수 |

## GitHub Pages 웹 버전

`docs/` 폴더는 서버 없이 브라우저에서 실행되는 정적 버전입니다.

- 지원: PDF 텍스트 추출, 스캔 PDF OCR, 이미지 OCR, TXT/MD 정리
- 미지원: HWP/HWPX/PPTX 고품질 변환
- 배포: GitHub Pages 설정에서 배포 소스를 `main` 브랜치의 `/docs` 폴더로 지정

전체 포맷 변환이 필요하면 기존 로컬 서버판(`npm start` 또는 `실행.bat`)을 사용하세요.

## 개인정보 마스킹 대상

- 주민등록번호
- 휴대폰/전화번호
- 이메일
- 사업자등록번호
- 법인등록번호
- 카드번호
- `계좌`, `계좌번호`, `입금계좌`, `은행` 키워드 주변 계좌번호
