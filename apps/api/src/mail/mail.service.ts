import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { neutralizeControl, safeHtml } from '../common/escape.util';

export interface PedidoLinea {
  empleado: string;
  plato: string;
  acompanamiento: string | null;
}

export interface ProviderEmail {
  proveedorNombre: string;
  correoDestino: string;
  fecha: string; // YYYY-MM-DD
  adicional: boolean;
  pedidos: PedidoLinea[];
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      requireTLS: process.env.SMTP_REQUIRE_TLS !== 'false',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  /** Construye el correo con escape/neutralización en TODOS los campos (FR-021, FR-034). */
  buildEmail(data: ProviderEmail): BuiltEmail {
    const prefix = data.adicional ? 'PEDIDO ADICIONAL — ' : '';
    // Subject: solo neutralizar CR/LF (no HTML)
    const subject = neutralizeControl(
      `${prefix}Pedidos ${data.proveedorNombre} — ${data.fecha}`,
    );

    const rows = data.pedidos
      .map((p) => {
        const acomp = p.acompanamiento ? ` (${safeHtml(p.acompanamiento)})` : '';
        return `<li>${safeHtml(p.empleado)}: ${safeHtml(p.plato)}${acomp}</li>`;
      })
      .join('');
    const html = `<h2>${safeHtml(prefix + data.proveedorNombre)} — ${data.fecha}</h2><ul>${rows}</ul>`;

    const text =
      neutralizeControl(`${prefix}${data.proveedorNombre} — ${data.fecha}`) +
      '\n' +
      data.pedidos
        .map((p) => {
          const acomp = p.acompanamiento ? ` (${neutralizeControl(p.acompanamiento)})` : '';
          return `- ${neutralizeControl(p.empleado)}: ${neutralizeControl(p.plato)}${acomp}`;
        })
        .join('\n');

    return { subject, html, text };
  }

  async send(data: ProviderEmail): Promise<void> {
    const { subject, html, text } = this.buildEmail(data);
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: data.correoDestino,
      subject,
      html,
      text,
    });
    this.logger.log(`Correo enviado a ${data.proveedorNombre} (${data.pedidos.length} pedidos)`);
  }
}
