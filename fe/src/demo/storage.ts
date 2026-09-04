import { createSeedDemoData, type DemoData } from './data';

export const DEMO_STORAGE_KEY = 'almaengi:portfolio-demo:v1';

function clone(data: DemoData): DemoData {
  return JSON.parse(JSON.stringify(data)) as DemoData;
}

function mergeNewSeedContracts(data: DemoData): DemoData {
  const seed = createSeedDemoData();
  const existingContractIds = new Set(
    data.contracts.map((contract) => contract.contractId)
  );
  const missingContracts = seed.contracts.filter(
    (contract) => !existingContractIds.has(contract.contractId)
  );

  if (!missingContracts.length) return data;

  return {
    ...data,
    contracts: [...data.contracts, ...missingContracts],
    nextIds: {
      ...data.nextIds,
      contract: Math.max(data.nextIds.contract, seed.nextIds.contract),
    },
  };
}

export function readDemoData(): DemoData {
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      return mergeNewSeedContracts(clone(JSON.parse(stored) as DemoData));
    }
  } catch {
    // A malformed or unavailable browser store must not break the preview.
  }

  return clone(createSeedDemoData());
}

export function writeDemoData(data: DemoData): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // The worker can still serve the current request if storage is unavailable.
  }
}

export function resetDemoData(): void {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Ignore browser privacy-mode storage failures.
  }
}
