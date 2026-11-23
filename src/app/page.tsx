'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  RotateCcw, 
  RotateCw, 
  Layers, 
  AlertTriangle, 
  Gauge, 
  Thermometer, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileSpreadsheet, 
  Search,
  SlidersHorizontal,
  Box
} from 'lucide-react';
import { ABB_CATALOG } from '@/data/components';
import { Cabinet, ElectricalComponent, PlacedComponent, Phase } from '@/types/switchgear';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  cabinetAtom,
  viewModeAtom,
  searchQueryAtom,
  selectedRailIdAtom,
  selectedPhaseAtom,
  undoAtom,
  redoAtom,
  canUndoAtom,
  canRedoAtom,
  addComponentToRailAtom,
  removeComponentFromRailAtom,
  cabinetCalculationsAtom
} from '@/store/cabinet'
import { useCadShortcuts } from '@/hooks/useCadShortcuts';
import Cabinet3D from '@/components/Cabinet3D';


export default function VoltGridCADApp() {
  // 1. Активируем горячие клавиши (Ctrl+Z, Ctrl+Y, 1, 2)
  useCadShortcuts();

  // 2. Достаем состояние и экшены из Jotai
  const cabinet = useAtomValue(cabinetAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [selectedRailId, setSelectedRailId] = useAtom(selectedRailIdAtom);
  const [selectedPhase, setSelectedPhase] = useAtom(selectedPhaseAtom);

  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const addComponent = useSetAtom(addComponentToRailAtom);
  const removeComponent = useSetAtom(removeComponentFromRailAtom);

  // 3. Автоматические расчеты (уже посчитаны в атоме!)
  const {
    totalCurrentPhaseA: currentA,
    totalCurrentPhaseB: currentB,
    totalCurrentPhaseC: currentC,
    maxPhaseCurrent,
    isOverloaded,
    totalHeatWatts,
    totalPriceEUR,
    totalModulesCount: totalModulesUsed,
  } = useAtomValue(cabinetCalculationsAtom);

  // Фильтрация каталога по поисковой строке
  const filteredCatalog = ABB_CATALOG.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Обработчики добавления и удаления через Jotai
  const handleAddComponent = (component: ElectricalComponent) => {
    addComponent({
      railId: selectedRailId,
      component,
      phase: component.widthModules >= 3 ? '3P' : selectedPhase,
    });
  };

  const handleRemoveComponent = (railId: string, instanceId: string) => {
    removeComponent({ railId, instanceId });
  };
  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-800 font-sans select-none overflow-hidden">
      {/* 1. TOP HEADER (ABB BRANDED LIGHT CAD) */}
      <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tighter text-red-600">ABB</span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-sm text-slate-800 tracking-tight">VoltGrid Switchgear CAD</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
            System pro E power v2.4
          </span>
        </div>

        {/* Center Cabinet specs banner */}
        <div className="hidden md:flex items-center gap-4 px-3.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <span>Enclosure: <strong className="text-slate-900">{cabinet.widthMm} x {cabinet.heightMm} x {cabinet.depthMm} mm</strong></span>
          <span className="text-slate-300">|</span>
          <span>Main Incomer Limit: <strong className="text-red-600 font-mono font-bold">{cabinet.maxMainCurrentA}A</strong></span>
        </div>

               {/* Top actions */}
        <div className="flex items-center gap-2">
          {/* Переключатель режимов 2D / 3D */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-2">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === '2d' 
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              2D Layout (1)
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === '3d' 
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3D Enclosure (2)
            </button>
          </div>

          {/* Живые кнопки Undo / Redo */}
          <button 
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors shadow-xs ${
              canUndo 
                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer' 
                : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            onClick={() => undo()}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>
          <button 
            disabled={!canRedo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors shadow-xs ${
              canRedo 
                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer' 
                : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            onClick={() => redo()}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Redo</span>
          </button>
          <button 
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors ml-2"
            onClick={() => alert(`BOM Export: ${totalModulesUsed} modules, Total: €${totalPriceEUR}`)}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export BOM</span>
          </button>
        </div>
      </header>

      {/* 2. THREE-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: ABB COMPONENT CATALOG */}
        <aside className="w-84 border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-2">
              <Layers className="h-4 w-4 text-red-600" />
              <span>Components Catalog</span>
            </h2>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ABB part, model, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
              />
            </div>
            
            {/* Quick target rail & phase selector */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Mount on Rail:</span>
              <select 
                value={selectedRailId} 
                onChange={(e) => setSelectedRailId(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 text-xs rounded px-2 py-1 outline-none focus:border-red-500"
              >
                {cabinet.rails.map(r => (
                  <option key={r.id} value={r.id}>{r.name.split(':')[0]}</option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Assign Phase:</span>
              <div className="flex gap-1">
                {(['A', 'B', 'C'] as Phase[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedPhase(p)}
                    className={`h-6 w-6 rounded font-mono text-xs font-bold transition-all border ${
                      selectedPhase === p
                        ? p === 'A' ? 'bg-amber-100 border-amber-500 text-amber-900' : p === 'B' ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : 'bg-slate-200 border-slate-600 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Component list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-red-600 transition-colors">
                        {item.model}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                        {item.widthModules} DIN
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.id}</p>
                  </div>
                  <button
                    onClick={() => handleAddComponent(item)}
                    className="h-7 w-7 rounded bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-transparent flex items-center justify-center transition-all shrink-0 cursor-pointer"
                    title="Mount on active rail"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="font-bold text-slate-900">{item.ratedCurrent}A</span>
                  <span>{item.heatWatts}W</span>
                  <span className="font-semibold text-slate-700">€{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER PANEL: VISUAL SWITCHGEAR CABINET (RAL 7035 INDUSTRIAL ENCLOSURE) */}
        <main className="flex-1 bg-slate-100 p-6 overflow-y-auto flex flex-col items-center">
          {viewMode === '2d' ? (
            <div className="w-full max-w-4xl bg-white border border-slate-300 rounded-lg p-6 shadow-sm flex flex-col gap-6 relative">
            {/* Cabinet frame header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Bay 01: Low-Voltage Switchgear Section (RAL 7035 Gray)
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Standard 35mm Perforated DIN Rails (EN 50022)</span>
            </div>

            {/* DIN Rails rendering */}
            <div className="space-y-6">
              {cabinet.rails.map((rail) => {
                const totalUnits = rail.components.reduce((acc, c) => acc + c.component.widthModules, 0);
                const isSelected = rail.id === selectedRailId;

                return (
                  <div 
                    key={rail.id}
                    onClick={() => setSelectedRailId(rail.id)}
                    className={`p-4 rounded border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-red-500 bg-slate-50/80 shadow-xs' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Rail header info */}
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{rail.name}</span>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-200 font-mono font-semibold">
                            ACTIVE RAIL
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-500 text-[11px]">
                        Rail Fill: <strong>{totalUnits} / {rail.capacityModules}</strong> modules ({Math.round((totalUnits / rail.capacityModules) * 100)}%)
                      </span>
                    </div>

                    {/* Physical DIN Rail with Mounted Components */}
                    <div className="relative min-h-[105px] bg-slate-100 rounded border border-slate-300 p-2.5 flex items-center overflow-x-auto">
                      {/* Galvanized steel DIN rail bar running behind components */}
                      <div className="absolute left-0 right-0 h-4 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-400 border-y border-slate-400/60 pointer-events-none" />

                      {/* Mounted component blocks */}
                      <div className="flex items-center gap-1.5 z-10">
                        {rail.components.map((item) => {
                          const widthPx = Math.max(item.component.widthModules * 46, 54);
                          const phaseBorder = 
                            item.phase === '3P' ? 'border-t-4 border-t-red-600' :
                            item.phase === 'A' ? 'border-t-4 border-t-amber-500' :
                            item.phase === 'B' ? 'border-t-4 border-t-emerald-500' :
                            'border-t-4 border-t-slate-700';

                          return (
                            <div
                              key={item.instanceId}
                              style={{ width: `${widthPx}px` }}
                              className={`h-22 rounded bg-white border border-slate-300 shadow-sm p-1.5 flex flex-col justify-between shrink-0 relative group transition-transform hover:-translate-y-0.5 ${phaseBorder}`}
                            >
                              {/* Top row: model & phase badge */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-bold text-[10px] text-slate-900 truncate">
                                  {item.component.model.split(' ')[0]}
                                </span>
                                <span className="text-[9px] font-mono font-bold px-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {item.phase}
                                </span>
                              </div>

                              {/* Center: Miniature breaker toggle switch visual */}
                              <div className="flex flex-col items-center my-0.5">
                                <div className="w-2.5 h-4 bg-slate-800 rounded-xs mb-0.5" />
                                <span className="font-mono font-bold text-xs text-slate-900">
                                  {item.component.ratedCurrent}A
                                </span>
                              </div>

                              {/* Bottom: Modules tag & delete button on hover */}
                              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                                <span>{item.component.widthModules} DIN</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveComponent(rail.id, item.instanceId);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity cursor-pointer"
                                  title="Unmount component"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Empty placeholder slots preview */}
                        {rail.components.length === 0 && (
                          <div className="text-xs text-slate-400 font-mono py-6 w-full text-center">
                            Empty DIN Rail. Click &quot;+&quot; in catalog to mount ABB equipment.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          ) : (
            <div className="w-full h-full flex-1 min-h-[600px]">
              <Cabinet3D />
            </div>
          )}
        </main>

        {/* RIGHT PANEL: TELEMETRY & SPECIFICATIONS (REVIT PROPERTIES STYLE) */}
        <aside className="w-80 border-l border-slate-200 bg-white p-4 flex flex-col gap-5 overflow-y-auto shrink-0">
          {/* Overload Alert Banner */}
          {isOverloaded ? (
            <div className="p-3 rounded bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5 animate-bounce" />
              <div>
                <p className="font-bold">MAIN INCOMER OVERLOAD!</p>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Phase current ({maxPhaseCurrent}A) exceeds main rating ({cabinet.maxMainCurrentA}A).
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-xs">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">SYSTEM NORMAL & BALANCED</p>
                <p className="text-[11px] text-emerald-600">Loads within 250A operating safety limits.</p>
              </div>
            </div>
          )}

          {/* Phase Current Bars */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-slate-600" />
              <span>Three-Phase Load Balance</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {/* Phase A */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-amber-700 font-bold">Phase L1 (A)</span>
                  <span className="text-slate-600">{currentA}A / {cabinet.maxMainCurrentA}A</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-300" 
                    style={{ width: `${Math.min((currentA / cabinet.maxMainCurrentA) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              {/* Phase B */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-emerald-700 font-bold">Phase L2 (B)</span>
                  <span className="text-slate-600">{currentB}A / {cabinet.maxMainCurrentA}A</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300" 
                    style={{ width: `${Math.min((currentB / cabinet.maxMainCurrentA) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              {/* Phase C */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-700 font-bold">Phase L3 (C)</span>
                  <span className="text-slate-600">{currentC}A / {cabinet.maxMainCurrentA}A</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div 
                    className="h-full bg-slate-600 transition-all duration-300" 
                    style={{ width: `${Math.min((currentC / cabinet.maxMainCurrentA) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Thermal & Physical Capacity Telemetry */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-slate-600" />
              <span>Thermal & Space Telemetry</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] uppercase font-mono">Heat Output</span>
                <p className="font-mono font-bold text-base text-slate-900 mt-0.5">{totalHeatWatts.toFixed(1)} W</p>
                <span className="text-[10px] text-slate-400">Natural air flow</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] uppercase font-mono">Used Modules</span>
                <p className="font-mono font-bold text-base text-slate-900 mt-0.5">{totalModulesUsed} / 72</p>
                <span className="text-[10px] text-slate-400">DIN slots filled</span>
              </div>
            </div>
          </div>

          {/* BOM Summary Card */}
          <div className="pt-4 border-t border-slate-200 mt-auto">
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 text-xs">
              <div className="flex justify-between items-center text-slate-600 mb-2">
                <span>Total Mounted Units:</span>
                <strong className="text-slate-900 font-mono">
                  {cabinet.rails.reduce((acc, r) => acc + r.components.length, 0)} pcs
                </strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                <span className="text-slate-700 font-semibold">Bill of Materials:</span>
                <strong className="text-slate-900 font-mono text-base">€{totalPriceEUR}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}