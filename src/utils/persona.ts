export const toneOptions = ['Direct', 'Executive Brief', 'Academic', 'Sarcastic', 'Supportive'] as const;
export type Tone = (typeof toneOptions)[number];

export interface PersonaConfig {
  /** 0 = Junior Intern, 100 = NASA Quantum Physicist with 28 years research. */
  authority: number;
  /** 0 = ELI5 / Plain English, 100 = High-Technical Specialist. */
  jargonDensity: number;
  tone: Tone;
  domain: string;
}

export function authorityLabel(value: number): string {
  if (value < 20) return 'Junior Intern';
  if (value < 40) return 'Working Professional';
  if (value < 60) return 'Senior Specialist';
  if (value < 80) return 'Principal Expert (15+ years)';
  return 'World-Renowned Authority (28+ years research)';
}

export function jargonLabel(value: number): string {
  if (value < 20) return 'ELI5 / Plain English';
  if (value < 50) return 'Accessible with light terminology';
  if (value < 80) return 'Professional technical register';
  return 'High-technical specialist vocabulary';
}

const toneDirective: Record<Tone, string> = {
  Direct: 'Be blunt and concise. Lead with the answer.',
  'Executive Brief': 'Write for a time-poor executive: headline first, then 3 supporting points.',
  Academic: 'Use rigorous, citation-aware, formal academic prose.',
  Sarcastic: 'Use dry, sharp wit while still being genuinely useful.',
  Supportive: 'Be encouraging and patient while remaining accurate.',
};

export function buildPersonaBlock(config: PersonaConfig): string {
  const domain = config.domain.trim() || 'the relevant domain';
  return [
    '<persona>',
    `- Authority: act as a ${authorityLabel(config.authority)} in ${domain}.`,
    `- Tone: ${config.tone}. ${toneDirective[config.tone]}`,
    `- Jargon density: ${jargonLabel(config.jargonDensity)}.`,
    '</persona>',
  ].join('\n');
}
