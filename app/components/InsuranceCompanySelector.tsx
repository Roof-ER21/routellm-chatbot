'use client';

/**
 * InsuranceCompanySelector Component
 * Simple wrapper around InsuranceCompanyModal for compatibility
 */

import InsuranceCompanyModal from './InsuranceCompanyModal';

export interface InsuranceCompany {
  id: string;
  name: string;
  contact_email: string;
  phone?: string;
  fax?: string;
  address?: string;
  notes?: string;
  email?: string;
  phone_instructions?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (company: InsuranceCompany) => void;
  repId?: number;
}

export default function InsuranceCompanySelector({ isOpen, onClose, onSelect, repId }: Props) {
  return (
    <InsuranceCompanyModal
      isOpen={isOpen}
      onClose={onClose}
      onSelected={(company: InsuranceCompany) => {
        // Map the fields for compatibility
        const mappedCompany: InsuranceCompany = {
          ...company,
          email: company.contact_email,
        };
        onSelect(mappedCompany);
      }}
    />
  );
}
