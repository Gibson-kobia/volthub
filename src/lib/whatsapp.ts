export function formatWholesaleWhatsappMessage({
  userName,
  userRole,
  institution,
  items,
  totalKes,
  note,
}: {
  userName: string;
  userRole?: string | null;
  institution?: string | null;
  items: Array<{ name: string; brand?: string; quantity_bales: number; line_total_kes: number }>;
  totalKes: number;
  note?: string;
}) {
  const header = `${userName}${userRole ? ` - ${userRole}` : ''}${institution ? ` | ${institution}` : ''}`;

  const lines = items.map((it, idx) => `${idx + 1}. ${it.name} (${it.brand || ''}) — ${it.quantity_bales} bales — KES ${it.line_total_kes.toLocaleString()}`);

  const body = [
    'Canvus Wholesale Order',
    header,
    '',
    ...lines,
    '',
    `Total: KES ${totalKes.toLocaleString()}`,
  ];

  if (note) body.push('', note);

  return encodeURIComponent(body.join('\n'));
}

export function openWhatsappMessage(encodedMessage: string, phone?: string) {
  // If phone is provided, use wa.me/<phone>?text=, otherwise generic share URL
  const url = phone
    ? `https://wa.me/${phone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  // open in new tab
  if (typeof window !== 'undefined') window.open(url, '_blank');
}
