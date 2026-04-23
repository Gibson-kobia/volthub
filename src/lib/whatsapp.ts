interface OrderItem {
  name: string;
  size?: string; // e.g., "50kg", "25kg"
  quantity: number; // in bales
  unitPrice: number;
  subtotal: number;
}

interface OrderDetails {
  items: OrderItem[];
  totalAmount: number;
  userName: string;
  userRole: string;
  institutionName: string;
  orderType: 'school_credit' | 'reseller_paid';
}

export function formatWhatsAppMessage(orderDetails: OrderDetails): string {
  const { items, totalAmount, userName, userRole, institutionName, orderType } = orderDetails;
  const timestamp = new Date().toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let message = `*CANVUS WHOLESALE ORDER*\n\n`;

  // Order type header
  if (orderType === 'school_credit') {
    message += `🏫 *School Credit Order*\n`;
    message += `LPO to be provided on delivery\n\n`;
  } else {
    message += `💼 *Reseller Order*\n`;
    message += `Payment Confirmed via M-Pesa\n\n`;
  }

  // Institution name (bolded)
  message += `*Institution:* ${institutionName}\n`;
  message += `*Representative:* ${userName} (${userRole})\n`;
  message += `*Order Date:* ${timestamp}\n\n`;

  // Order items
  message += `*ORDER DETAILS:*\n`;
  items.forEach((item, index) => {
    const sizeText = item.size ? ` (${item.size})` : '';
    message += `${index + 1}. ${item.name}${sizeText} - Qty: ${item.quantity} Bales\n`;
  });
  message += `\n`;

  // Total amount (bolded)
  message += `*TOTAL AMOUNT: KSh ${totalAmount.toLocaleString()}*\n\n`;

  // Footer
  message += `📍 *Delivery Location:* Meru County\n`;
  message += `📞 *Contact:* Please confirm delivery details\n\n`;
  message += `Thank you for choosing Canvus! 🌾`;

  return encodeURIComponent(message);
}

export function openWhatsAppWithMessage(message: string, phoneNumber: string = "+254712345678") {
  // Replace with actual Canvus WhatsApp number
  const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${message}`;
  window.open(whatsappUrl, '_blank');
}
