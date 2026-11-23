export type Phase = 'A' | 'B' | 'C' | '3P';
export type ComponentCatergory =
    | 'main_breaker'
    | 'circuit_breaker'
    | 'contactor'
    | 'relay'
    | 'meter';

export interface ElectricalComponent {
    id: string;
    brand: 'ABB' | 'Schneider Electric' | 'Siemens';
    model: string;
    name: string;
    category: ComponentCatergory;
    ratedCurrent: number;
    widthModules: number;
    price: number;
    heatWatts: number;
}
export interface PlacedComponent {
    instanceId: string;
    component: ElectricalComponent;
    phase: Phase;
    slotPosition: number;
}
export interface DINRail {
    id: string;
    name: string;
    capacityModules: number;
    components: PlacedComponent[];
}
export interface Cabinet {
    id: string;
    name: string;
    widthMm: number;
    heightMm: number;
    depthMm: number;
    maxMainCurrentA: number;
    rails: DINRail[];
}
export interface CabinetCalculations {
    totalCurrentPhaseA: number;
    totalCurrentPhaseB: number;
    totalCurrentPhaseC: number;
    maxPhaseCurrent: number;
    isOverloaded: boolean;
    totalPriceEUR: number;
    totalHeatWatts: number;
    totalModulesCount: number;
}