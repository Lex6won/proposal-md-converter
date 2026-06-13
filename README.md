# 제안서 MD 변환 도구

제안서, 발표자료, PDF 문서를 AI가 읽기 좋은 Markdown 파일로 변환하는 도구입니다.

브라우저에서 바로 쓰는 **웹판**과, PC에 내려받아 실행하는 **풀버전**을 제공합니다.

## 바로 사용하기

| 목적 | 추천 방식 | 주소 |
|---|---|---|
| PDF, 스캔 PDF, 이미지, TXT/MD를 빠르게 변환 | 웹판 | https://lex6won.github.io/proposal-md-converter/ |
| HWPX, HWP, PDF, PPTX까지 안정적으로 변환 | 풀버전 다운로드 | https://github.com/Lex6won/proposal-md-converter/releases/latest |
| 소스 코드 확인, 개선 제안, 재배포 | GitHub 저장소 | https://github.com/Lex6won/proposal-md-converter |

## 어떤 버전을 써야 하나요?

**웹판을 쓰면 좋은 경우**

- 설치 없이 URL로 바로 사용하고 싶을 때
- PDF, 스캔 PDF, 이미지 파일을 Markdown으로 바꾸고 싶을 때
- 간단한 TXT/MD 정리와 개인정보 마스킹이 필요할 때

**풀버전을 쓰면 좋은 경우**

- HWPX, HWP, PPTX 파일을 변환해야 할 때
- PPTX 안의 이미지 OCR까지 사용해야 할 때
- 대용량 문서를 더 안정적으로 처리해야 할 때
- 인터넷 환경에 의존하지 않고 로컬 PC에서 처리하고 싶을 때

> 구형 `.ppt` 파일은 직접 지원하지 않습니다. PowerPoint에서 `.pptx`로 저장한 뒤 변환해 주세요.

## 웹판 사용법

1. 웹판 주소로 접속합니다: https://lex6won.github.io/proposal-md-converter/
2. 파일을 끌어다 놓거나 `파일 선택`을 누릅니다.
3. 필요한 경우 `OCR`, `개인정보 마스킹` 옵션을 켭니다.
4. `변환`을 누릅니다.
5. 결과를 복사하거나 `.md` 파일로 다운로드합니다.

웹판 지원 형식:

- `.pdf`
- `.png`, `.jpg`, `.jpeg`, `.webp`
- `.txt`, `.md`

웹판에서 `.pptx`, `.ppt`, `.hwp`, `.hwpx`를 선택하면 풀버전 사용 안내가 표시됩니다.

## 풀버전 다운로드 및 실행

1. 풀버전 다운로드 페이지로 이동합니다: https://github.com/Lex6won/proposal-md-converter/releases/latest
2. `proposal-md-converter-full-windows-v1.0.0-lite.zip` 파일을 다운로드합니다.
3. ZIP 파일을 원하는 폴더에 압축 해제합니다.
4. 압축 해제한 폴더에서 `실행.bat`를 더블클릭합니다.
5. 브라우저가 `http://localhost:3000`으로 열리면 파일을 업로드합니다.
6. 변환된 Markdown을 다운로드하거나 복사합니다.

풀버전 지원 형식:

| 입력 | 지원 | 비고 |
|---|---|---|
| `.hwpx` | 지원 | 페이지/섹션 마커 포함 |
| `.hwp` | 지원 | HWP 타입으로 표시 |
| `.pdf` | 지원 | 텍스트 추출 실패 시 OCR fallback |
| `.pptx` | 지원 | 이미지 OCR 옵션 제공 |
| `.ppt` | 미지원 | `.pptx`로 저장 후 사용 |

## 보안과 개인정보

- 웹판은 브라우저 안에서 처리합니다.
- 풀버전은 내 PC에서 로컬 서버를 띄워 처리합니다.
- 기본 주소는 `http://localhost:3000`입니다.
- 업로드 임시 파일은 변환 후 삭제됩니다.
- 개인정보 자동 마스킹은 기본으로 켜져 있습니다.

마스킹 대상:

- 주민등록번호
- 휴대폰/전화번호
- 이메일
- 사업자등록번호
- 법인등록번호
- 카드번호
- `계좌`, `계좌번호`, `입금계좌`, `은행` 키워드 주변 계좌번호

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

## 문제 해결

**다운로드한 ZIP이 차단될 때**

Windows 보안 경고가 표시되면 파일 속성에서 차단 해제를 선택하거나, 압축 해제 후 `실행.bat`를 다시 실행해 주세요.

**브라우저가 열리지 않을 때**

주소창에 직접 입력해 보세요.

```text
http://localhost:3000
```

**PPT 파일에서 오류가 날 때**

구형 `.ppt`는 지원하지 않습니다. PowerPoint에서 `.pptx`로 저장한 뒤 다시 변환해 주세요.

**이미지 위주의 PDF에서 텍스트가 적을 때**

풀버전에서 `이미지 OCR 사용`을 켠 상태로 변환해 주세요.

## 개발자용 실행

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
converters/pdf.js       PDF 변환 + OCR fallback
converters/pptx.js      PPTX 변환 + 선택형 OCR
public/index.html       풀버전 로컬 UI
docs/                   GitHub Pages 웹판
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

## 라이선스

MIT License
