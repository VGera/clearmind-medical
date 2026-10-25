/**
 * Verified Inc. response shapes — https://docs.verified.inc/reference/data/outputs
 *
 * Field names are copied from the documented outputs so the mock below can be
 * replaced by the real SDK or API without touching any component.
 */

/* ---------------- shared ---------------- */

export interface VFullName {
  firstName?: string;
  middleName?: string;
  lastName?: string;
}

export interface VAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/* ---------------- 1-Click Verify ---------------- */

/** The documented waterfall: autofill -> silent -> SMS. */
export type VerifyChannel = "autofill" | "silent" | "sms";

export interface VerifyResult {
  /** E.164 */
  phone: string;
  deviceIp?: string;
  channel: VerifyChannel;
  verified: boolean;
}

/* ---------------- 1-Click Health ---------------- */

export interface VPayer {
  name: string;
  /** "V" + 6 digits */
  verifiedId: string;
  ids: string[];
  logoUrl?: string;
}

export type VVerificationMethod = "clearinghouse" | "self_attested" | null;
export type VCoverageType = "medical" | "dental" | "vision";

/** Insurance discovery / autofill. */
export interface HealthDiscovery {
  memberId: string;
  payer: VPayer;
  verificationMethod: VVerificationMethod;
  coverageTypes: VCoverageType[];
  serviceTypeCodes: string[];
  isMedicare: boolean;
}

export type VCoverageStatus = "active" | "indeterminate" | "inactive";
export type VBenefitType = "deductible" | "outOfPocket" | "copay" | "coinsurance" | "limitation";
export type VNetworkStatus = "IN_NETWORK" | "OUT_OF_NETWORK" | "INDETERMINATE";

export interface VBenefit {
  type: VBenefitType;
  amount: number;
  remaining?: number;
  /** Not in the documented shape; carried for display only. */
  label?: string;
}

/** Real-time eligibility check. */
export interface HealthEligibility {
  edi_271?: string;
  eligibility: {
    coverageStatus: VCoverageStatus;
    coverageType: VCoverageType[];
    payer: { name: string };
    member: {
      memberId: string;
      fullName: VFullName;
      birthDate: string;
      sex?: "Male" | "Female";
      address?: VAddress;
    };
    plan: {
      name: string;
      groupNumber?: string;
      groupName?: string;
      effectiveDate?: string;
      terminationDate?: string;
    };
    benefits: VBenefit[];
    contacts?: { phone?: string; email?: string }[];
  };
  network: {
    status: VNetworkStatus;
    rules?: { uuid: string; name: string; status: string; conditions?: unknown }[];
  };
}

/** What a discovery call can come back as. ~20% of adults aren't found. */
export type DiscoveryOutcome =
  | { status: "found"; results: HealthDiscovery[] }
  | { status: "not_found" }
  | { status: "error"; message: string };
