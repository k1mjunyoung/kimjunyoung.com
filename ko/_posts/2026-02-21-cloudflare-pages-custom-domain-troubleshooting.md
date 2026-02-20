---
layout: post
lang: ko
published: true
permalink: /ko/Cloudflare-Pages-커스텀-도메인-설정-트러블슈팅-www-리다이렉트와-403-에러-해결
commit_url:
date: 2026-02-21 02:34:00 +0900
link:
domain: cloudflare-pages-custom-domain-troubleshooting
title: "Cloudflare Pages 커스텀 도메인 설정 트러블슈팅: www 리다이렉트와 403 에러 해결"
description: 
categories: 
redirect_from: 
---

## 문제 상황

Cloudflare Pages로 배포한 사이트에 커스텀 도메인을 연결했는데, `www` 서브도메인이 계속 **Inactive (Error)** 상태였습니다. 몇 시간이 지나도 해결되지 않았고, 루트 도메인으로 접속하면 www로 리다이렉트는 되지만 아래와 같은 에러가 발생했습니다.

> **HTTP ERROR 403 — 이 페이지를 볼 수 있는 권한이 없습니다.**

---

## 원인 1: www 도메인 Inactive (Error) — DNS 소유권 충돌

### 왜 발생하는가

Cloudflare Pages에서 커스텀 도메인을 추가하면, Pages가 내부적으로 DNS CNAME 레코드를 **자동으로 생성하고 관리**하려 합니다. 그런데 DNS 레코드에 `www` CNAME이 이미 수동으로 존재하면, Pages는 해당 레코드를 자신이 통제하는 것으로 인식하지 못해 소유권 충돌이 발생합니다.

### 확인 방법

Cloudflare 대시보드 → Workers & Pages → 프로젝트 → **Custom domains** 탭에서 아래처럼 표시된다면 이 문제에 해당합니다.

```
example.com     ● Active    🔒 SSL enabled
www.example.com ● Inactive (Error)
```

### 해결 방법

1. `www.example.com` 옆 `...` → **Remove domain** 클릭
2. 삭제 후 **Set up a custom domain** → `www.example.com` 다시 입력
3. Cloudflare가 DNS 확인 화면을 보여주면 **Activate domain** 클릭

재추가하면 Pages가 직접 CNAME 레코드 소유권을 가져가면서 정상적으로 인식됩니다.

---

## 원인 2: HTTP 403 에러 — SSL/TLS 모드 충돌

### 왜 발생하는가

이것이 핵심 원인이었습니다. SSL/TLS 모드가 **Full**로 설정되어 있었는데, `Full` 모드는 Cloudflare가 오리진 서버에도 SSL로 연결을 시도합니다. Cloudflare Pages는 자체적인 인증서 관리 방식을 사용하기 때문에 이 방식과 충돌하여 **403 Access Denied**가 발생합니다.

### 확인 방법

Cloudflare 대시보드 → 도메인 선택 → 좌측 메뉴 **SSL/TLS** → **Overview**에서 현재 모드를 확인합니다.

```
Current encryption mode: Full  ← 문제 있음
```

### 해결 방법

**SSL/TLS → Overview → Configure** 에서 **Full (Strict)** 로 변경합니다.

| 모드 | 설명 | Pages 적합 여부 |
|---|---|---|
| Off | 암호화 없음 | ❌ |
| Flexible | 방문자↔Cloudflare만 암호화 | ⚠️ |
| Full | 오리진에도 SSL 연결 (인증서 미검증) | ❌ Pages와 충돌 |
| **Full (Strict)** | 오리진 SSL 연결 + 인증서 검증 | ✅ Pages 권장 |

저장하면 즉시 적용되며, 403 에러가 해결됩니다.

---

## 루트 도메인 → www 리다이렉트 설정

루트 도메인에서 www로 리다이렉트하려면 Cloudflare **Redirect Rules**를 사용합니다.

### 설정 방법

1. 도메인 선택 → 좌측 메뉴 **Rules** → **Overview**
2. 우측 상단 **Templates** 클릭
3. **"Redirect from root to WWW"** 템플릿 선택
4. 아래 설정이 자동으로 채워집니다:
   - **Request URL**: `https://example.com/*`
   - **Target URL**: `https://www.example.com/${1}`
   - **Status code**: 301 (영구 리다이렉트)
5. **Deploy** 클릭

### 주의사항: 루트 도메인 Custom domain을 삭제하면 안 됩니다

Redirect Rule을 설정해도 Pages Custom domains에서 루트 도메인(`example.com`)을 제거하면 안 됩니다. 루트 도메인 항목이 있어야 Cloudflare가 해당 트래픽을 인식하고 Redirect Rule을 적용할 수 있습니다.

```
example.com     ← 이걸 지우면 리다이렉트 Rule도 작동하지 않습니다
www.example.com ← 실제 사이트가 서빙되는 도메인
```

---

## 최종 동작 구조

```
사용자가 example.com 접속
    → Cloudflare Redirect Rule 작동
    → 301 리다이렉트
    → www.example.com
    → Cloudflare Pages 사이트 정상 서빙
```

---

## 요약

| 문제 | 원인 | 해결 |
|---|---|---|
| www 도메인 Inactive (Error) | DNS 소유권 충돌 | Custom domain 제거 후 재추가 |
| www 접속 시 403 에러 | SSL/TLS 모드가 Full | Full (Strict)로 변경 |
| 루트 도메인 → www 리다이렉트 | 설정 없음 | Redirect Rules 템플릿 사용 |

Cloudflare Pages를 커스텀 도메인과 함께 사용할 때 SSL/TLS 설정은 반드시 **Full (Strict)** 로 맞춰야 합니다. 이 설정 하나로 403 에러와 www 도메인 문제를 동시에 해결할 수 있습니다.
