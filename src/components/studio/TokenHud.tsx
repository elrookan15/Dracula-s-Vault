import { Coins } from 'lucide-react';
import { useMemo } from 'react';
import type { ModelTag } from '../../types';
import { estimateCost, estimateTokens, formatCost, formatTokens, modelProfiles } from '../../utils/tokenizer';

interface TokenHudProps {
  text: string;
  model: ModelTag;
  onModelChange: (model: ModelTag) => void;
}

export function TokenHud({ text, model, onModelChange }: TokenHudProps) {
  const tokens = useMemo(() => estimateTokens(text), [text]);
  const estimate = useMemo(() => estimateCost(tokens, model), [tokens, model]);
  const usedPercent = Math.round(estimate.contextUsedRatio * 100);

  const meterColor =
    estimate.contextUsedRatio < 0.6 ? 'bg-vault-lime' : estimate.contextUsedRatio < 0.85 ? 'bg-vault-orange' : 'bg-red-500';

  return (
    <div className="flex flex-col gap-3 border-b border-vault-border bg-vault-base/60 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-vault-orange" aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Token HUD</span>
        </div>
        <div className="text-sm">
          <span className="font-black text-white">{formatTokens(tokens)}</span>
          <span className="text-slate-500"> tokens (est.)</span>
        </div>
        <div className="text-sm">
          <span className="font-black text-vault-lime">{formatCost(estimate.totalCost)}</span>
          <span className="text-slate-500"> / call est.</span>
        </div>
        <select
          value={model}
          onChange={(event) => onModelChange(event.target.value as ModelTag)}
          className="rounded-lg border border-vault-border bg-vault-surface px-2 py-1 text-xs font-bold text-slate-100 focus:border-vault-orange"
        >
          {(Object.keys(modelProfiles) as ModelTag[]).map((option) => (
            <option key={option} value={option}>
              {modelProfiles[option].label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 w-40 overflow-hidden rounded-full bg-vault-border">
          <div className={`h-full rounded-full ${meterColor}`} style={{ width: `${usedPercent}%` }} />
        </div>
        <span className="text-xs font-bold text-slate-400">
          {usedPercent}% of {formatTokens(estimate.contextWindow)}
        </span>
      </div>
    </div>
  );
}
