import { atom } from 'jotai';
import { Cabinet, ElectricalComponent, Phase, CabinetCalculations } from '@/types/switchgear';
import { ABB_CATALOG } from '@/data/components';

// Initial state: standard ABB industrial enclosure configuration
export const INITIAL_CABINET: Cabinet = {
    id: 'cab-001',
    name: 'System pro E power - Substation MDS-01',
    widthMm: 800,
    heightMm: 2000,
    depthMm: 600,
    maxMainCurrentA: 250,
    rails: [
        {
            id: 'rail-1',
            name: 'DIN Rail 1: Main Power Intake (Incomer Section)',
            capacityModules: 24,
            components: [
                {
                    instanceId: 'inst-1',
                    component: ABB_CATALOG[0], // Tmax XT2N 160A (4 modules)
                    phase: '3P',
                    slotPosition: 1,
                },
            ],
        },
        {
            id: 'rail-2',
            name: 'DIN Rail 2: Sub-Distribution (Lighting & Outlets)',
            capacityModules: 24,
            components: [
                {
                    instanceId: 'inst-2',
                    component: ABB_CATALOG[1], // S201 C16 (1 module)
                    phase: 'A',
                    slotPosition: 1,
                },
                {
                    instanceId: 'inst-3',
                    component: ABB_CATALOG[2], // S201 C25 (1 module)
                    phase: 'B',
                    slotPosition: 2,
                },
            ],
        },
        {
            id: 'rail-3',
            name: 'DIN Rail 3: Motor Control & Relays (Pumps)',
            capacityModules: 24,
            components: [
                {
                    instanceId: 'inst-4',
                    component: ABB_CATALOG[4], // AF09 Contactor (2 modules)
                    phase: '3P',
                    slotPosition: 1,
                },
                {
                    instanceId: 'inst-5',
                    component: ABB_CATALOG[5], // CM-PVS Relay (1 module)
                    phase: 'A',
                    slotPosition: 3,
                },
            ],
        },
    ],
};

// UI Atoms
export const viewModeAtom = atom<'2d' | '3d'>('2d');
export const searchQueryAtom = atom<string>('');
export const selectedRailIdAtom = atom<string>('rail-2');
export const selectedPhaseAtom = atom<Phase>('A');

// History Stack Atom (past, present, future)
interface HistoryState {
    past: Cabinet[];
    present: Cabinet;
    future: Cabinet[];
}

export const historyAtom = atom<HistoryState>({
    past: [],
    present: INITIAL_CABINET,
    future: [],
});

// Primary cabinet atom: reading returns current present, writing pushes to past
export const cabinetAtom = atom(
    (get) => get(historyAtom).present,
    (get, set, newCabinet: Cabinet) => {
        const current = get(historyAtom);
        set(historyAtom, {
            past: [...current.past, current.present],
            present: newCabinet,
            future: [], // Clear future on new mutation
        });
    }
);

// Undo / Redo action atoms
export const canUndoAtom = atom((get) => get(historyAtom).past.length > 0);
export const canRedoAtom = atom((get) => get(historyAtom).future.length > 0);

export const undoAtom = atom(null, (get, set) => {
    const current = get(historyAtom);
    if (current.past.length === 0) return;

    const previous = current.past[current.past.length - 1];
    const newPast = current.past.slice(0, -1);

    set(historyAtom, {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
    });
});

export const redoAtom = atom(null, (get, set) => {
    const current = get(historyAtom);
    if (current.future.length === 0) return;

    const next = current.future[0];
    const newFuture = current.future.slice(1);

    set(historyAtom, {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
    });
});

// Mutator action: Add Component to Rail
export const addComponentToRailAtom = atom(
    null,
    (
        get,
        set,
        payload: {
            railId: string;
            component: ElectricalComponent;
            phase: Phase;
        }
    ) => {
        const currentCabinet = get(cabinetAtom);
        const rail = currentCabinet.rails.find((r) => r.id === payload.railId);
        if (!rail) return;

        const usedModules = rail.components.reduce(
            (sum, item) => sum + item.component.widthModules,
            0
        );

        if (usedModules + payload.component.widthModules > rail.capacityModules) {
            alert(
                `DIN Rail capacity exceeded! Rail has ${rail.capacityModules - usedModules} slots left, component requires ${payload.component.widthModules}.`
            );
            return;
        }

        const updatedRails = currentCabinet.rails.map((r) => {
            if (r.id !== payload.railId) return r;
            return {
                ...r,
                components: [
                    ...r.components,
                    {
                        instanceId: `inst-${Date.now()}`,
                        component: payload.component,
                        phase: payload.phase,
                        slotPosition: usedModules + 1,
                    },
                ],
            };
        });

        set(cabinetAtom, {
            ...currentCabinet,
            rails: updatedRails,
        });
    }
);

// Mutator action: Remove Component from Rail
export const removeComponentFromRailAtom = atom(
    null,
    (get, set, payload: { railId: string; instanceId: string }) => {
        const currentCabinet = get(cabinetAtom);
        const updatedRails = currentCabinet.rails.map((r) => {
            if (r.id !== payload.railId) return r;
            return {
                ...r,
                components: r.components.filter(
                    (c) => c.instanceId !== payload.instanceId
                ),
            };
        });

        set(cabinetAtom, {
            ...currentCabinet,
            rails: updatedRails,
        });
    }
);

// Derived calculations atom: real-time phase balance, heat loss, costs
export const cabinetCalculationsAtom = atom<CabinetCalculations>((get) => {
    const cabinet = get(cabinetAtom);

    let currentA = 0;
    let currentB = 0;
    let currentC = 0;
    let totalHeatWatts = 0;
    let totalPriceEUR = 0;
    let totalModulesCount = 0;

    cabinet.rails.forEach((rail) => {
        rail.components.forEach((item) => {
            const { component, phase } = item;
            totalHeatWatts += component.heatWatts;
            totalPriceEUR += component.price;
            totalModulesCount += component.widthModules;

            if (phase === 'A') currentA += component.ratedCurrent;
            else if (phase === 'B') currentB += component.ratedCurrent;
            else if (phase === 'C') currentC += component.ratedCurrent;
            else if (phase === '3P') {
                currentA += component.ratedCurrent;
                currentB += component.ratedCurrent;
                currentC += component.ratedCurrent;
            }
        });
    });

    const maxPhaseCurrent = Math.max(currentA, currentB, currentC);
    const isOverloaded = maxPhaseCurrent > cabinet.maxMainCurrentA;

    return {
        totalCurrentPhaseA: currentA,
        totalCurrentPhaseB: currentB,
        totalCurrentPhaseC: currentC,
        maxPhaseCurrent,
        isOverloaded,
        totalPriceEUR,
        totalHeatWatts,
        totalModulesCount,
    };
});