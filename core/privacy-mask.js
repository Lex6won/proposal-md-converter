function maskEmail(value) {
  const [local, domain] = value.split('@');
  if (!local || !domain) return value;
  const first = local[0] || '*';
  return `${first}${'*'.repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

function maskPersonalInfo(markdown) {
  if (!markdown) return markdown;

  return markdown
    // 주민등록번호
    .replace(/\b(\d{6})[-\s]?([1-4])\d{6}\b/g, '$1-*******')
    // 사업자등록번호
    .replace(/\b(\d{3})[-\s]?(\d{2})[-\s]?(\d{5})\b/g, '***-**-$3')
    // 법인등록번호
    .replace(/\b(\d{6})[-\s]?(\d{7})\b/g, '$1-*******')
    // 휴대폰 번호
    .replace(/\b(01[016789])[-.\s]?(\d{3,4})[-.\s]?(\d{4})\b/g, '$1-****-$3')
    // 지역번호/인터넷 전화번호
    .replace(/\b(0(?:2|[3-6][1-5]|70))[-.\s]?(\d{3,4})[-.\s]?(\d{4})\b/g, '$1-****-$3')
    // 이메일
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, (match) => maskEmail(match))
    // 카드번호
    .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, (match) => {
      const digits = match.replace(/\D/g, '');
      return `****-****-****-${digits.slice(-4)}`;
    })
    // 계좌 관련 키워드 주변 숫자열
    .replace(/((?:계좌번호|계좌|입금계좌|은행)\s*[:：]?\s*)([0-9][0-9-\s]{7,}[0-9])/g, (match, label, account) => {
      const digits = account.replace(/\D/g, '');
      if (digits.length < 8) return match;
      return `${label}${'*'.repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
    });
}

export { maskPersonalInfo };
