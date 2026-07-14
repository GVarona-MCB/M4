import { MailService } from './mail.service';

describe('MailService.buildEmail (contenido y escape, FR-021/FR-034)', () => {
  const service = new MailService();

  it('incluye empleado, plato y acompañamiento', () => {
    const { html } = service.buildEmail({
      proveedorNombre: 'La Tablita',
      correoDestino: 'x@y.z',
      fecha: '2026-07-14',
      adicional: false,
      pedidos: [{ empleado: 'Ana', plato: 'Milanesa', acompanamiento: 'puré' }],
    });
    expect(html).toContain('Ana');
    expect(html).toContain('Milanesa');
    expect(html).toContain('puré');
  });

  it('escapa HTML del texto libre (anti-XSS)', () => {
    const { html } = service.buildEmail({
      proveedorNombre: 'Prov',
      correoDestino: 'x@y.z',
      fecha: '2026-07-14',
      adicional: false,
      pedidos: [{ empleado: 'Eve', plato: 'Tarta', acompanamiento: '<script>alert(1)</script>' }],
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('neutraliza CR/LF en el asunto y en el nombre del empleado (anti header injection)', () => {
    const { subject, html } = service.buildEmail({
      proveedorNombre: 'Prov\r\nBcc: attacker@evil.com',
      correoDestino: 'x@y.z',
      fecha: '2026-07-14',
      adicional: false,
      pedidos: [{ empleado: 'Mal\r\nlory', plato: 'X', acompanamiento: null }],
    });
    expect(subject).not.toMatch(/[\r\n]/);
    expect(html).not.toMatch(/Mal\r?\nlory/);
  });

  it('marca "PEDIDO ADICIONAL" en el asunto cuando es adicional (FR-026)', () => {
    const { subject } = service.buildEmail({
      proveedorNombre: 'Prov',
      correoDestino: 'x@y.z',
      fecha: '2026-07-14',
      adicional: true,
      pedidos: [{ empleado: 'Ana', plato: 'X', acompanamiento: null }],
    });
    expect(subject).toContain('PEDIDO ADICIONAL');
  });
});
