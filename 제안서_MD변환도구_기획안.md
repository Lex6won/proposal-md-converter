---
title: 제안서 평가용 MD 변환 도구 기획안
author: 경기도 원준석
date: 2026-05-16
revision: v2 (KorDoc 채택 반영)
status: 사양 확정 (개발 착수 전)
---

# 제안서 평가용 MD 변환 도구 기획안

> **개정 이력**
> - v1 (2026-05-16): 초안. pyhwpx + pymupdf4llm + python-pptx
> - v2 (2026-05-16): KorDoc 분석 후 HWPX·PDF를 KorDoc으로 교체

## 1. 배경 및 목적

공무원이 다수의 제안서 평가를 수행할 때, 제출 자료(한글파일 HWPX + 발표자료 PDF/PPT)를 AI가 읽기 좋은 Markdown으로 변환하여 평가위원들이 AI 도구로 정리·평가하기 쉽게 만드는 사내 도구.

## 2. 확정 사양

| 항목 | 내용 |
|---|---|
| 입력 포맷 | HWPX(한글), PDF, PPT |
| 미지원 | 구버전 HWP |
| 출력 | AI 친화 Markdown |
| 운영 환경 | 망분리 내부망(폐쇄망). Node.js LTS 반입은 보안 승인 후 가능 |
| 사용자 | 팀 내 평가위원 5~10명 |
| 배포 방식 | 부서 공용 PC에 Streamlit 앱 설치, 내부망 브라우저로 접속 |
| 범위 | 변환만 (AI 요약·비교는 추후 단계) |

## 3. 포맷별 라이브러리 비교 및 선정

### 3.1 HWPX (한글)

| 라이브러리 | 장점 | 단점 |
|---|---|---|
| `pyhwpx` | 한컴 COM 자동화, 정확 | 한글 오피스 설치 필수 |
| `hwpxlib` (한컴 공식) | 오픈소스 | Java 런타임 필요 |
| 직접 XML 파싱 | 의존성 최소 | 표·각주 직접 구현 부담 |
| **`KorDoc`** ✅ 선정 | 한컴 미설치 OK, 공공기관 5곳 검증, 병합 셀·한국 공문서 패턴 자동 감지 | Node.js 런타임 필요 |

**선정 사유**: 광진구청 지방공무원이 만든 공공기관 특화 라이브러리. 한컴오피스 의존을 제거하고, 병합 셀·중첩 테이블·선 없는 표(`구분/항목/종류` 등) 자동 감지로 제안서 표 변환 품질이 압도적 우위.

### 3.2 PDF (발표자료)

| 라이브러리 | 특징 |
|---|---|
| `marker-pdf` | 표·수식 우수, ML 모델 다운로드 필요 |
| `Docling` (IBM) | 구조 인식 강력, ML 모델 필요 |
| `MarkItDown` (Microsoft) | 가볍지만 "고충실도 아님"으로 명시 |
| `pymupdf4llm` | 빠르고 ML 모델 불필요, 일반 PDF 적합 |
| **`KorDoc`** ✅ 선정 | 한국어 어절 끊김 복원, 다단 레이아웃, 머리글/바닥글 필터, 선 기반 테이블 감지, ML 모델 불필요 |

**선정 사유**: 한국 공문서 PDF에 특화된 처리(어절 복원, 공문서 표 패턴 인식). HWPX와 동일한 엔진을 쓰므로 출력 일관성 확보.

### 3.3 PPT (발표자료)

| 라이브러리 | 특징 |
|---|---|
| `MarkItDown` | PPT→MD 직접 변환, 슬라이드 노트 포함하나 "고충실도 아님" |
| `Docling` | 구조 인식 우수, ML 모델 필요 |
| **`python-pptx`** ✅ 선정 | 저수준 직접 제어, 슬라이드 노트·도형 텍스트 추출, 순수 Python |

**선정 사유**: KorDoc이 PPT 미지원이므로 별도 채택. 순수 Python·외부 의존 없음으로 망분리 적합.

### 3.4 검토했지만 채택하지 않은 라이브러리

**MarkItDown (Microsoft)**
- 메인 변환기로 부적합: HWPX 미지원, 공식 문서가 "텍스트 분석용·고충실도 아님"으로 명시
- 향후 폴백/보조용으로는 검토 가치 있음

### 3.5 최종 라이브러리 스택

| 포맷 | 라이브러리 | 런타임 |
|---|---|---|
| HWPX | **KorDoc** | Node.js 18+ |
| PDF | **KorDoc** | Node.js 18+ |
| PPT | `python-pptx` | Python |
| UI | `streamlit` | Python |
| 패키징 | `pyinstaller` | Python |
| 통합 | Python `subprocess` → `npx kordoc` | - |

## 4. 공무원 활용 시나리오

### 4.1 평가 전 단계 (변환·정리)
- 제출된 한글 제안서 + 발표 PDF/PPT를 폴더에 드롭 → 자동 MD 변환
- 업체별 폴더 구조: `업체명/제안서.md`, `업체명/발표.md`
- 평가표 항목(사업이해도, 추진방안, 전문성 등)에 해당하는 부분을 AI가 추출·요약

### 4.2 평가 중 단계 (AI 보조, 추후 확장)
- 평가 항목별 업체 간 횡단 비교표 자동 생성
- 제안서 본문과 발표자료 간 불일치 점검 (금액·인력·일정 차이 플래깅)
- 정량 지표(투입 인력, 단가, 기간 등) 표 추출

### 4.3 평가 후 단계 (기록·근거, 추후 확장)
- 점수 부여 시 AI가 본문 인용 위치(페이지) 제시 → 평가 근거 문서화
- 회의록·총평 초안 자동 생성

## 5. 개발 방식 비교

| 방식 | 장점 | 단점 | 적합도 |
|---|---|---|---|
| CLI 스크립트 | 가장 단순, 빠르게 구축 | 비개발자 진입장벽 | 본인 전용 |
| 로컬 데스크톱 앱 (.exe) | 직원이 쉽게 사용, 망분리 OK | 배포·업데이트 번거로움 | 10명 내외 |
| **내부 웹앱 (Streamlit)** ✅ 선정 | 모두가 브라우저로 사용, 업데이트 한 곳 | 공용 PC 필요 | 부서 5~10명 |
| Electron/내부 정식 웹 | 본격적 UI | 개발·검토 부담 큼 | 부서 전체 |

**선정 사유**: 부서 공용 PC 1대에 띄우고 5~10명이 내부망 브라우저로 접속하는 형태가 배포·유지보수 부담이 가장 적음.

## 6. 시스템 아키텍처

```
┌─────────────────┐         ┌──────────────────────────────┐
│ 부서원 PC 5~10대  │ ─내부망─→ │ 부서 공용 PC                    │
│ (웹 브라우저)      │ HTTP    │ ┌──────────────────────────┐ │
└─────────────────┘         │ │ Streamlit 앱 (Python)     │ │
                            │ │  - UI / 업로드·다운로드      │ │
                            │ │  - python-pptx (PPT 변환)  │ │
                            │ │  - subprocess 호출 ────────┼─┼──┐
                            │ └──────────────────────────┘ │  │
                            │ ┌──────────────────────────┐ │  │
                            │ │ KorDoc CLI (Node.js) ◀───┼─┼──┘
                            │ │  - HWPX → MD             │ │
                            │ │  - PDF → MD              │ │
                            │ └──────────────────────────┘ │
                            │ - 변환 이력 누적 저장          │
                            └──────────────────────────────┘
```

- 부서원이 브라우저로 `http://공용PC_IP:8501` 접속
- HWPX/PDF/PPT 업로드 → Streamlit이 포맷별로 라우팅
  - HWPX/PDF → KorDoc CLI 호출
  - PPT → python-pptx 처리
- 변환된 MD를 다운로드 또는 공용 폴더에 저장

## 7. 프로젝트 구조

```
proposal-md-converter/
├─ app.py                  # Streamlit UI (드래그&드롭, 진행률, 다운로드)
├─ converters/
│  ├─ kordoc_runner.py     # subprocess로 npx kordoc 호출 (HWPX·PDF)
│  └─ pptx_converter.py    # python-pptx → MD
├─ core/
│  ├─ md_postprocess.py    # 출력 표준 통일 (frontmatter·페이지 마커 부착)
│  ├─ router.py            # 확장자별 변환기 라우팅
│  └─ batch.py             # 업체 폴더 일괄 처리
├─ vendor/
│  └─ kordoc/              # 오프라인 npm 설치된 KorDoc + 의존성
├─ requirements.txt        # Python 의존성
├─ package.json            # Node.js 의존성 (kordoc, pdfjs-dist)
└─ build.bat               # PyInstaller 빌드 스크립트
```

## 8. MD 출력 표준 (AI 친화)

- 파일 시작에 YAML frontmatter
  - 원본파일명
  - 변환일시
  - 페이지/슬라이드 수
  - 변환기(`kordoc` / `python-pptx`)
- 페이지/슬라이드 경계: `---` 구분자 + `<!-- page: N -->` 마커
  - AI가 인용 시 위치 표시 가능
- 표는 가능하면 Markdown 표로, 복잡하면 HTML `<table>` 폴백
- KorDoc·python-pptx의 원본 출력을 `md_postprocess`가 표준 형식으로 통일

**출력 예시**

```markdown
---
source: ㈜에이아이컨_제안서.hwpx
converted_at: 2026-05-16T14:30:00
pages: 42
converter: kordoc
---

<!-- page: 1 -->
# 사업 제안서

...본문...

---

<!-- page: 2 -->
## 1. 사업 개요

...
```

## 9. 망분리 운영 대비

**사내망 반입 항목**
- Node.js LTS 18+ 설치 패키지(Windows MSI) — 보안 승인 후 반입
- npm 패키지(오프라인): `kordoc`, `pdfjs-dist` 및 의존성
  - 인터넷 PC에서 `npm pack` 또는 `npm install --omit=optional` 후 `node_modules` 통째 반입
  - 또는 `verdaccio` 등 사설 레지스트리로 운영
- pip 패키지(오프라인): `streamlit`, `python-pptx`, `pyinstaller` + 의존성
  - 인터넷 PC에서 `pip download`로 한 번에 묶기

**환경 확인 사항**
- 공용 PC에 Python 3.10+ 설치 가능 여부
- Node.js 18+ 설치 보안 승인 절차 및 소요 시간
- 한컴오피스 설치 여부는 더 이상 필수 아님 (KorDoc로 대체)

**보안 고려**
- KorDoc 자체에 ZIP bomb 방지, XXE 방어, 경로 순회 차단, 파일 크기 제한(500MB) 내장
- Streamlit 업로드 사이즈·확장자 화이트리스트 추가 설정

## 10. 개발 단계 (착수 시)

1. **환경 구축 및 사전 검증**
   - 보안담당자와 Node.js LTS 반입 절차 협의 및 진행
   - 인터넷 PC에서 pip·npm 패키지 묶음 준비 → 사내망 반입
   - 공용 PC에 Python·Node.js 설치 및 `npx kordoc --help` 동작 확인
   - 샘플 HWPX/PDF/PPT 3종으로 CLI 단위 변환 사전 검증
2. **변환기 모듈 구현·테스트**
   - `kordoc_runner.py`: subprocess 래퍼 + 오류 처리 + 타임아웃
   - `pptx_converter.py`: 슬라이드 노트 포함 변환
   - `md_postprocess.py`: 출력 표준 통일 (frontmatter·페이지 마커)
3. **Streamlit UI 통합**
   - 단일 파일 모드 / 폴더 일괄 모드 두 가지 제공
   - 진행률·오류 표시
4. **PyInstaller 빌드 및 공용 PC 배포**
   - 빌드 시 `vendor/kordoc` 경로를 함께 묶거나, Node.js 외부 실행 경로 설정
   - 운영 가이드 작성
   - 부서원 사용 매뉴얼 1페이지 작성

## 11. 향후 확장 로드맵

| 단계 | 기능 | 시점 |
|---|---|---|
| 1단계 | 변환 도구 (현 기획안) | 우선 개발 |
| 2단계 | KorDoc MCP 서버 활용, 평가 항목별 자동 요약·추출 | 변환 도구 안정화 후 |
| 3단계 | 업체 간 비교표 자동 생성 | 2단계 검증 후 |
| 4단계 | 평가 근거 인용·총평 초안, MD → HWPX 역변환(KorDoc 기능)으로 평가서 자동 생성 | 부서 합의 후 |

## 12. 참고 자료

- KorDoc 저장소: https://github.com/chrisryugj/kordoc
- KorDoc MCP 서버: `npx -y kordoc setup` (Claude Desktop·Cursor·VS Code 자동 셋업)
- MarkItDown 저장소(참고): https://github.com/microsoft/markitdown