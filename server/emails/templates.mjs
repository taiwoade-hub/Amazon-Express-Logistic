function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function layout({ title, preview, bodyHtml }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f6f7fb;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preview || '')}</div>
    <div style="max-width:620px;margin:0 auto;padding:28px 16px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
        <div style="padding:20px 22px;border-bottom:1px solid #eef1f6;">
          <div style="font-weight:900;letter-spacing:-0.02em;font-size:16px;color:#0f172a;">AmazonLogisics</div>
          <div style="margin-top:4px;color:#475569;font-weight:700;font-size:12px;">Shipping updates and receipts</div>
        </div>
        <div style="padding:22px 22px 18px;">
          ${bodyHtml}
        </div>
        <div style="padding:14px 22px 20px;color:#64748b;font-size:12px;font-weight:700;">
          <div>Need help? Reply to this email.</div>
          <div style="margin-top:6px;">© ${new Date().getFullYear()} AmazonLogisics</div>
        </div>
      </div>
    </div>
  </body>
</html>`
}

function cta(href, label) {
  return `<a href="${href}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:12px;font-weight:900;font-size:13px;">${escapeHtml(label)}</a>`
}

function keyRow(label, value) {
  return `<div style="display:flex;gap:10px;margin-top:10px;">
    <div style="width:140px;color:#64748b;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(label)}</div>
    <div style="flex:1;color:#0f172a;font-weight:900;font-size:13px;">${escapeHtml(value)}</div>
  </div>`
}

export function packageCreatedTemplate({ trackingId, trackingUrl, imageUrl }) {
  const title = 'Your package has been created'
  const imageBlock = imageUrl
    ? `<div style="margin:14px 0 18px;">
        <img alt="Package" src="${imageUrl}" style="width:100%;max-height:260px;object-fit:cover;border-radius:14px;border:1px solid #eef1f6;" />
      </div>`
    : ''

  const bodyHtml = `
    <div style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">${escapeHtml(title)}</div>
    <div style="margin-top:8px;color:#334155;font-weight:700;line-height:1.55;">
      Your shipment has been registered and is now visible in tracking.
    </div>
    ${imageBlock}
    <div style="margin-top:14px;padding:14px 14px;border-radius:14px;border:1px solid #eef1f6;background:#fafbff;">
      ${keyRow('Tracking ID', trackingId)}
    </div>
    <div style="margin-top:18px;">
      ${cta(trackingUrl, 'Track your package')}
    </div>
    <div style="margin-top:14px;color:#64748b;font-weight:700;font-size:12px;">
      Tracking link: <a href="${trackingUrl}" style="color:#0f172a;font-weight:900;">${escapeHtml(trackingUrl)}</a>
    </div>
  `

  return {
    subject: title,
    html: layout({ title, preview: `Tracking ID ${trackingId}`, bodyHtml })
  }
}

export function packageApprovedTemplate({ trackingId, trackingUrl }) {
  const title = 'Your package is approved and in processing'
  const bodyHtml = `
    <div style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">Package approved</div>
    <div style="margin-top:8px;color:#334155;font-weight:700;line-height:1.55;">
      An administrator has approved your shipment and it is moving through the courier workflow.
    </div>
    <div style="margin-top:14px;padding:14px 14px;border-radius:14px;border:1px solid #eef1f6;background:#fafbff;">
      ${keyRow('Tracking ID', trackingId)}
    </div>
    <div style="margin-top:18px;">
      ${cta(trackingUrl, 'View tracking')}
    </div>
  `
  return {
    subject: 'Package approved',
    html: layout({ title, preview: `Approved: ${trackingId}`, bodyHtml })
  }
}

export function packageDeliveredTemplate({ trackingId, trackingUrl, receiptUrl }) {
  const title = 'Your package has been delivered'
  const bodyHtml = `
    <div style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">Delivery confirmed</div>
    <div style="margin-top:8px;color:#334155;font-weight:700;line-height:1.55;">
      Your package has been delivered successfully.
    </div>
    <div style="margin-top:14px;padding:14px 14px;border-radius:14px;border:1px solid #eef1f6;background:#fafbff;">
      ${keyRow('Tracking ID', trackingId)}
    </div>
    <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
      ${cta(trackingUrl, 'View tracking')}
      ${receiptUrl ? cta(receiptUrl, 'Download receipt (PDF)') : ''}
    </div>
  `
  return {
    subject: title,
    html: layout({ title, preview: `Delivered: ${trackingId}`, bodyHtml })
  }
}

export function packageCancelledTemplate({ trackingId, trackingUrl }) {
  const title = 'Your package has been cancelled'
  const bodyHtml = `
    <div style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">Shipment cancelled</div>
    <div style="margin-top:8px;color:#334155;font-weight:700;line-height:1.55;">
      This shipping request has been cancelled. If this looks incorrect, reply to this email and we’ll help.
    </div>
    <div style="margin-top:14px;padding:14px 14px;border-radius:14px;border:1px solid #eef1f6;background:#fafbff;">
      ${keyRow('Tracking ID', trackingId)}
    </div>
    <div style="margin-top:18px;">
      ${cta(trackingUrl, 'View tracking')}
    </div>
  `
  return {
    subject: title,
    html: layout({ title, preview: `Cancelled: ${trackingId}`, bodyHtml })
  }
}

export function receiptTemplate({ trackingId, receiptUrl }) {
  const title = 'Your receipt is ready'
  const bodyHtml = `
    <div style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">Receipt attached</div>
    <div style="margin-top:8px;color:#334155;font-weight:700;line-height:1.55;">
      Your PDF receipt is attached to this email.
    </div>
    <div style="margin-top:14px;padding:14px 14px;border-radius:14px;border:1px solid #eef1f6;background:#fafbff;">
      ${keyRow('Tracking ID', trackingId)}
    </div>
    ${receiptUrl ? `<div style="margin-top:18px;">${cta(receiptUrl, 'Download receipt (PDF)')}</div>` : ''}
  `
  return {
    subject: 'Receipt (PDF)',
    html: layout({ title, preview: `Receipt: ${trackingId}`, bodyHtml })
  }
}

export function welcomeTemplate({ name }) {
  const title = 'Welcome to AmazonLogisics'
  const bodyHtml = `
    <div style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">Welcome${name ? `, ${escapeHtml(name)}` : ''}</div>
    <div style="margin-top:8px;color:#334155;font-weight:700;line-height:1.55;">
      Your account is ready. You can create shipments, track packages, and download receipts anytime.
    </div>
  `
  return {
    subject: title,
    html: layout({ title, preview: 'Your account is ready', bodyHtml })
  }
}

export function adminAlertTemplate({ title, lines }) {
  const bodyLines = (lines || []).map((line) => `<div style="margin-top:8px;color:#0f172a;font-weight:900;font-size:13px;">${escapeHtml(line)}</div>`).join('')
  const bodyHtml = `
    <div style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">${escapeHtml(title)}</div>
    <div style="margin-top:8px;color:#334155;font-weight:700;line-height:1.55;">
      Admin notification
    </div>
    <div style="margin-top:12px;padding:14px 14px;border-radius:14px;border:1px solid #eef1f6;background:#fafbff;">
      ${bodyLines}
    </div>
  `
  return {
    subject: title,
    html: layout({ title, preview: title, bodyHtml })
  }
}

