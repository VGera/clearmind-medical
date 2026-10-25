import type { Metadata, Viewport } from "next";
import { PRACTICE, PROVIDERS } from "@/lib/data";
import "./globals.css";

/**
 * Set NEXT_PUBLIC_SITE_URL to the real domain before this goes anywhere public.
 * Until then we canonicalise to the local origin and tell crawlers to stay out,
 * rather than self-canonicalising every page to a domain that doesn't exist.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8101";
const IS_PUBLIC = Boolean(process.env.NEXT_PUBLIC_SITE_URL);

const DESCRIPTION =
  "Online psychiatry for adults in Texas. Video visits for ADHD, anxiety, depression, bipolar disorder, PTSD and OCD — psychiatric evaluation and medication management, usually within three days. In-network with Blue Cross Blue Shield, UnitedHealthcare, Aetna, Cigna and Oscar Health.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Online Psychiatrist in Texas — ADHD, Anxiety, Depression | ClearMind Medical",
    template: "%s | ClearMind Medical",
  },
  description: DESCRIPTION,
  applicationName: PRACTICE.name,
  keywords: [
    "online psychiatrist Texas",
    "telepsychiatry Texas",
    "ADHD evaluation Texas",
    "ADHD medication online",
    "anxiety treatment online",
    "depression medication management",
    "bipolar disorder psychiatrist",
    "PTSD treatment Texas",
    "OCD psychiatrist online",
    "psychiatric evaluation online",
    "psychiatrist that takes Blue Cross Blue Shield",
    "same week psychiatry appointment",
  ],
  alternates: { canonical: "/" },
  robots: IS_PUBLIC ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: PRACTICE.name,
    title: "Online Psychiatrist in Texas — ClearMind Medical",
    description: DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    // No OG image yet; "summary" degrades honestly where large_image would not.
    card: "summary",
    title: "Online Psychiatrist in Texas — ClearMind Medical",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f5f1",
};

/**
 * MedicalClinic, not MedicalBusiness: it is the only type that inherits from
 * both LocalBusiness and MedicalOrganization, which is where medicalSpecialty,
 * availableService and isAcceptingNewPatients actually live. availableLanguage
 * has no valid placement on the practice node, so it sits on a ContactPoint.
 */
const SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalClinic",
      "@id": `${SITE}/#practice`,
      name: PRACTICE.name,
      description: DESCRIPTION,
      url: SITE,
      medicalSpecialty: "https://schema.org/Psychiatric",
      areaServed: { "@type": "State", name: "Texas" },
      isAcceptingNewPatients: true,
      priceRange: `$${PRACTICE.selfPay.followUp}–$${PRACTICE.selfPay.intake} self-pay`,
      telephone: "+1-512-555-0100",
      address: { "@type": "PostalAddress", addressRegion: "TX", addressCountry: "US" },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "new patients",
        telephone: "+1-512-555-0100",
        availableLanguage: ["English", "Spanish"],
      },
      availableService: [
        { "@type": "MedicalProcedure", name: "Psychiatric evaluation" },
        { "@type": "MedicalTherapy", name: "Medication management" },
        { "@type": "MedicalTherapy", name: "ADHD treatment" },
        { "@type": "MedicalTherapy", name: "Anxiety treatment" },
        { "@type": "MedicalTherapy", name: "Depression treatment" },
        { "@type": "MedicalTherapy", name: "Bipolar disorder treatment" },
        { "@type": "MedicalTherapy", name: "PTSD treatment" },
        { "@type": "MedicalTherapy", name: "OCD treatment" },
      ],
    },
    ...PROVIDERS.map((p) => ({
      "@type": "Physician",
      "@id": `${SITE}/#${p.id}`,
      name: `${p.credential === "MD" || p.credential === "DO" ? "Dr. " : ""}${p.name}, ${p.credential}`,
      medicalSpecialty: "https://schema.org/Psychiatric",
      areaServed: { "@type": "State", name: "Texas" },
      knowsLanguage: p.languages,
      worksFor: { "@id": `${SITE}/#practice` },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: p.rating,
        reviewCount: p.reviews,
        bestRating: 5,
      },
    })),
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          // Static, author-controlled object — no user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
        />
      </body>
    </html>
  );
}
