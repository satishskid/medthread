import { useState, useEffect } from 'react';

export interface LicenseConfig {
  aiName: string;
  department: string;
  hospital: string;
  location: string;
  visitTypes: string[];
  demographics: string[];
  boundaries: {
    doNotDiagnose: string[];
    escalateToHuman: string[];
  };
  language: string;
  tone: {
    patientEducation: string;
    clinical: string;
  };
  guidelines: string[];
  textbooks: string[];
  journals: string[];
  tools: string[];
  multimodal: {
    canRead: string[];
  };
  formulary: string[];
}

export const useLicenseConfig = () => {
  const [config, setConfig] = useState<LicenseConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = () => {
      try {
        const storedConfig = localStorage.getItem('licenseConfig');
        if (storedConfig) {
          const parsedConfig = JSON.parse(storedConfig);
          setConfig(parsedConfig);
        } else {
          setError('No license configuration found');
        }
      } catch (err) {
        setError('Failed to parse license configuration');
        console.error('License config error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const updateConfig = (newConfig: Partial<LicenseConfig>) => {
    if (config) {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);
      localStorage.setItem('licenseConfig', JSON.stringify(updatedConfig));
    }
  };

  const resetConfig = () => {
    localStorage.removeItem('licenseConfig');
    setConfig(null);
    setError('Configuration reset');
  };

  return {
    config,
    isLoading,
    error,
    updateConfig,
    resetConfig
  };
};

// Default configurations for different specialties
export const getDefaultConfig = (specialty: string): LicenseConfig => {
  const baseConfig = {
    hospital: 'General Hospital',
    location: 'United States',
    language: 'English',
    tone: {
      patientEducation: 'Simple, empathetic, reassuring',
      clinical: 'Professional, evidence-based, concise'
    }
  };

  switch (specialty.toLowerCase()) {
    case 'fertility':
      return {
        ...baseConfig,
        aiName: 'FertiScribe AI',
        department: 'Reproductive Endocrinology & Infertility',
        visitTypes: ['IVF Consultation', 'Embryo Transfer', 'Monitoring', 'OHSS Assessment'],
        demographics: ['Age 25-45', 'Infertility patients', 'IVF candidates'],
        boundaries: {
          doNotDiagnose: ['Genetic disorders', 'Complex endocrine conditions'],
          escalateToHuman: ['OHSS Grade 3+', 'Ectopic pregnancy', 'Severe complications']
        },
        guidelines: ['ASRM 2023', 'ESHRE Guidelines', 'NICE Fertility Guidelines'],
        textbooks: ['Reproductive Endocrinology', 'IVF Laboratory Manual'],
        journals: ['Fertility & Sterility', 'Human Reproduction'],
        tools: ['Embryo grading', 'OHSS risk calculator', 'Ovarian reserve assessment'],
        multimodal: {
          canRead: ['Sperm analysis PDFs', 'Embryo images', 'Ultrasound reports']
        },
        formulary: ['Gonal-F', 'Cetrotide', 'Ovidrel', 'Progesterone', 'Estradiol']
      };

    case 'pediatrics':
      return {
        ...baseConfig,
        aiName: 'PediaGuide AI',
        department: 'Pediatrics',
        visitTypes: ['Well-child visit', 'Sick visit', 'Vaccination', 'Development assessment'],
        demographics: ['Infants', 'Children', 'Adolescents', 'Ages 0-18'],
        boundaries: {
          doNotDiagnose: ['Child abuse', 'Complex genetic syndromes', 'Psychiatric conditions'],
          escalateToHuman: ['Sepsis signs', 'Respiratory distress', 'Dehydration', 'Fever in infants <3mo']
        },
        guidelines: ['AAP Guidelines', 'CDC Vaccination Schedule', 'Bright Futures'],
        textbooks: ['Nelson Textbook of Pediatrics', 'AAP Red Book'],
        journals: ['Pediatrics', 'Journal of Pediatrics'],
        tools: ['Growth charts', 'Developmental milestones', 'Vaccination tracker'],
        multimodal: {
          canRead: ['Rash photos', 'Growth charts', 'Vaccination records']
        },
        formulary: ['Amoxicillin', 'Ibuprofen', 'Acetaminophen', 'Albuterol', 'Vaccines']
      };

    case 'radiology':
      return {
        ...baseConfig,
        aiName: 'RadAssist AI',
        department: 'Radiology',
        visitTypes: ['CT interpretation', 'X-ray reading', 'MRI review', 'Ultrasound'],
        demographics: ['All ages', 'Inpatient', 'Outpatient', 'Emergency'],
        boundaries: {
          doNotDiagnose: ['Definitive cancer staging', 'Complex interventional procedures'],
          escalateToHuman: ['Critical findings', 'Discrepant readings', 'Complex cases']
        },
        guidelines: ['ACR Appropriateness Criteria', 'Fleischner Society', 'BI-RADS'],
        textbooks: ['Fundamentals of Radiology', 'Learning Radiology'],
        journals: ['Radiology', 'AJR', 'Journal of Digital Imaging'],
        tools: ['PACS integration', 'Measurement tools', 'Reporting templates'],
        multimodal: {
          canRead: ['DICOM images', 'CT scans', 'X-rays', 'MRI', 'Ultrasound']
        },
        formulary: ['Contrast agents', 'Gadolinium', 'Iodinated contrast']
      };

    default:
      return {
        ...baseConfig,
        aiName: 'ClinicPartner AI',
        department: 'Primary Care',
        visitTypes: ['Annual physical', 'Sick visit', 'Chronic care', 'Preventive care'],
        demographics: ['Adults', 'All ages', 'Chronic conditions'],
        boundaries: {
          doNotDiagnose: ['Complex psychiatric conditions', 'Rare diseases'],
          escalateToHuman: ['Chest pain', 'Severe symptoms', 'Mental health crisis']
        },
        guidelines: ['USPSTF', 'AHA/ACC Guidelines', 'ADA Standards'],
        textbooks: ['Harrison\'s Internal Medicine', 'UpToDate'],
        journals: ['NEJM', 'JAMA', 'Annals of Internal Medicine'],
        tools: ['Risk calculators', 'Screening tools', 'Chronic care protocols'],
        multimodal: {
          canRead: ['Lab reports', 'ECGs', 'Basic imaging']
        },
        formulary: ['Common medications', 'Antibiotics', 'Antihypertensives', 'Statins']
      };
  }
};