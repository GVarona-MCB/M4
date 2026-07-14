import { escapeHtml, neutralizeControl, safeHtml } from './escape.util';

describe('escape.util (FR-034)', () => {
  it('escapa caracteres HTML', () => {
    expect(escapeHtml('<b>&"\'')).toBe('&lt;b&gt;&amp;&quot;&#39;');
  });

  it('neutraliza CR/LF y colapsa espacios', () => {
    expect(neutralizeControl('Bcc: mal\r\nBcc: evil')).toBe('Bcc: mal Bcc: evil');
    expect(neutralizeControl('a\r\nb')).toBe('a b');
  });

  it('safeHtml combina neutralización + escape (anti-XSS/inyección)', () => {
    const out = safeHtml('<script>\nalert(1)</script>');
    expect(out).not.toContain('<script>');
    expect(out).not.toMatch(/[\r\n]/);
  });
});
