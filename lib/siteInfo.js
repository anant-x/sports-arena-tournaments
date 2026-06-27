import { organizer, platform } from "./tournament";

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function instagramHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
}

export function instagramProfileUrl(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }

  const handle = instagramHandle(rawValue);
  return handle ? `https://www.instagram.com/${handle}/` : "";
}

export function contactInfo() {
  const phone = process.env.NEXT_PUBLIC_ORGANIZER_PHONE || organizer.phone;
  const email = process.env.NEXT_PUBLIC_ORGANIZER_EMAIL || organizer.email || platform.supportEmail;
  const whatsappNumber = digits(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || phone);
  const instagramSource =
    process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ||
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
    organizer.instagramHandle ||
    organizer.instagramUrl ||
    organizer.social;
  const instagram = instagramHandle(instagramSource);
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || organizer.instagramUrl || instagramProfileUrl(instagram);

  return {
    name: process.env.NEXT_PUBLIC_ORGANIZER_NAME || organizer.name,
    phone,
    email,
    address: organizer.address,
    social: instagram ? `@${instagram}` : organizer.social,
    instagramHandle: instagram,
    whatsappNumber,
    whatsappUrl: whatsappNumber ? `https://wa.me/${whatsappNumber}` : "",
    instagramUrl,
    mapsUrl: mapSearchUrl(organizer.address)
  };
}

export function paymentInfo() {
  return {
    upiId: process.env.NEXT_PUBLIC_PAYMENT_UPI_ID || "",
    payeeName: process.env.NEXT_PUBLIC_PAYMENT_PAYEE_NAME || platform.name,
    upiQrImage: process.env.NEXT_PUBLIC_PAYMENT_QR_IMAGE || "/assets/phonepe-upi-qr.png",
    razorpayKeyConfigured: Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
  };
}

export function whatsappUrl(message) {
  const contact = contactInfo();
  if (!contact.whatsappNumber) {
    return "";
  }

  return `${contact.whatsappUrl}?text=${encodeURIComponent(message)}`;
}

export function mapSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || organizer.address)}`;
}

export function tournamentEssentials(tournament) {
  const defaultAgeLimit = {
    Cricket: "Open category, recommended 14+ with guardian consent for minors.",
    Badminton: "Open category, junior players allowed with guardian consent.",
    Tennis: "Open category, junior players allowed with guardian consent.",
    Football: "Open category, recommended 16+ for turf safety."
  };

  return {
    ageLimit: tournament.ageLimit || defaultAgeLimit[tournament.sport] || "Open category unless the organizer confirms a category restriction.",
    lastDate: tournament.registrationDeadline || tournament.startDate,
    refundPolicy:
      tournament.refundPolicy ||
      "Advance is refundable if the tournament is cancelled by the organizer. Player/team no-shows and late withdrawals are not refundable after fixtures are published.",
    squadSize: tournament.teamSize || tournament.category,
    venueMapUrl: tournament.mapUrl || mapSearchUrl(tournament.venue),
    supportWindow: tournament.supportWindow || "10:00 AM to 8:00 PM IST",
    reportingRule: tournament.reportingRule || "Report at least 30 minutes before your first match."
  };
}

export const trustStats = [
  ["6", "Active tournaments"],
  ["4", "Sports covered"],
  ["150+", "Expected players"],
  ["24h", "Registration support"]
];

export const testimonials = [
  {
    quote: "Fixtures were clear, payments were simple, and the organizer kept captains updated on WhatsApp.",
    name: "Aarav Mehta",
    role: "Cricket captain"
  },
  {
    quote: "The bracket format and court timings made it easy to plan the whole day.",
    name: "Riya Sharma",
    role: "Badminton player"
  },
  {
    quote: "Good turf, quick updates, and a clean registration process for our office team.",
    name: "Karan Malhotra",
    role: "Corporate team lead"
  }
];
