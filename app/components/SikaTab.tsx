"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Trash2,
  Calculator,
  Save,
  RefreshCw,
  Droplet,
} from "lucide-react";
import type { SikaCalculation, SikaConfig } from "@/app/db/schema";
import {
  createSikaCalculation,
  updateSikaCalculation,
  deleteSikaCalculation,
  updateSikaConfig,
} from "@/app/actions/sika";

interface SikaTabProps {
  initialCalculations: SikaCalculation[];
  initialRadierConfig: SikaConfig;
  initialZapataConfig: SikaConfig;
}

export default function SikaTab({
  initialCalculations,
  initialRadierConfig,
  initialZapataConfig,
}: SikaTabProps) {
  const [calculations, setCalculations] =
    useState<SikaCalculation[]>(initialCalculations);
  const [isPending, startTransition] = useTransition();

  const [radierConfig, setRadierConfig] = useState(initialRadierConfig);
  const [zapataConfig, setZapataConfig] = useState(initialZapataConfig);

  // Filtrar por tipo
  const radierItems = useMemo(
    () => calculations.filter((c) => c.tipo === "radier"),
    [calculations],
  );
  const zapataItems = useMemo(
    () => calculations.filter((c) => c.tipo === "zapata"),
    [calculations],
  );

  // Calcular totales
  const calculateTotals = (items: SikaCalculation[]) => {
    let vol = 0;
    let area = 0;
    items.forEach((item) => {
      vol += item.volume;
      area += item.area;
    });
    return { vol, area };
  };

  const radierTotals = useMemo(
    () => calculateTotals(radierItems),
    [radierItems],
  );
  const zapataTotals = useMemo(
    () => calculateTotals(zapataItems),
    [zapataItems],
  );

  // SIKA CALC
  const sikaRadierKg =
    radierTotals.area *
    radierConfig.sikaDosage *
    (1 + radierConfig.waste / 100);
  const sikaZapataKg =
    zapataTotals.area *
    zapataConfig.sikaDosage *
    (1 + zapataConfig.waste / 100);
  const totalSikaKg = sikaRadierKg + sikaZapataKg;
  const totalSikaBidones = Math.ceil(totalSikaKg / radierConfig.sikaContainer);

  // Handlers para items
  const handleAddItem = (tipo: "radier" | "zapata") => {
    startTransition(async () => {
      const newCalc = await createSikaCalculation({
        tipo,
        name: "Nuevo",
        qty: 1,
        length: 0,
        width: 0,
        height: 0,
      });
      setCalculations([...calculations, newCalc]);
    });
  };

  const handleRemoveItem = (id: number) => {
    startTransition(async () => {
      await deleteSikaCalculation(id);
      setCalculations(calculations.filter((c) => c.id !== id));
    });
  };

  const handleUpdateItem = (
    id: number,
    field: string,
    value: string | number,
  ) => {
    const updatedCalcs = calculations.map((c) =>
      c.id === id
        ? {
            ...c,
            [field]:
              field === "name" ? value : parseFloat(value as string) || 0,
          }
        : c,
    );
    setCalculations(updatedCalcs);

    startTransition(async () => {
      const updateData: Record<string, string | number> = {
        [field]: field === "name" ? value : parseFloat(value as string) || 0,
      };
      await updateSikaCalculation(id, updateData);
    });
  };

  // Handlers para configuración
  const handleUpdateRadierConfig = (field: keyof SikaConfig, value: number) => {
    const updated = { ...radierConfig, [field]: value };
    setRadierConfig(updated);

    startTransition(async () => {
      await updateSikaConfig("radier", { [field]: value });
    });
  };

  const handleUpdateZapataConfig = (field: keyof SikaConfig, value: number) => {
    const updated = { ...zapataConfig, [field]: value };
    setZapataConfig(updated);

    startTransition(async () => {
      await updateSikaConfig("zapata", { [field]: value });
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="text-blue-600" />
              Cubicación Separada: Radier vs Zapatas
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Cálculo independiente para materiales de construcción
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= COLUMNA RADIER ================= */}
        <div className="space-y-6">
          <SectionHeader
            title="1. Radier / Losa"
            totalVol={radierTotals.vol}
            color="blue"
          />

          {/* Inputs Radier */}
          <InputTable
            items={radierItems}
            onUpdate={handleUpdateItem}
            onRemove={handleRemoveItem}
            onAdd={() => handleAddItem("radier")}
            isPending={isPending}
          />

          {/* Config Radier */}
          <ConfigPanel
            title="Dosificación Radier (por m³)"
            config={radierConfig}
            onUpdate={handleUpdateRadierConfig}
            color="blue"
            isPending={isPending}
          />

          {/* Resultados Radier */}
          <ResultsCard
            title="Materiales Radier"
            vol={radierTotals.vol}
            config={radierConfig}
            color="blue"
          />
        </div>

        {/* ================= COLUMNA ZAPATAS ================= */}
        <div className="space-y-6">
          <SectionHeader
            title="2. Zapatas"
            totalVol={zapataTotals.vol}
            color="indigo"
          />

          {/* Inputs Zapatas */}
          <InputTable
            items={zapataItems}
            onUpdate={handleUpdateItem}
            onRemove={handleRemoveItem}
            onAdd={() => handleAddItem("zapata")}
            isPending={isPending}
          />

          {/* Config Zapatas */}
          <ConfigPanel
            title="Dosificación Zapatas (por m³)"
            config={zapataConfig}
            onUpdate={handleUpdateZapataConfig}
            color="indigo"
            isPending={isPending}
          />

          {/* Resultados Zapatas */}
          <ResultsCard
            title="Materiales Zapatas"
            vol={zapataTotals.vol}
            config={zapataConfig}
            color="indigo"
          />
        </div>
      </div>

      {/* ================= SECCIÓN SIKA GLOBAL ================= */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Droplet className="text-teal-500" /> Impermeabilizante (Sika 1)
          </h2>
          <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
            Formato Bidón:{" "}
            <strong>{radierConfig.sikaContainer} Litros/Kg</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Área Radier:</span>
              <span className="font-bold">
                {radierTotals.area.toFixed(2)} m²
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Dosis:</span>
              <span>{radierConfig.sikaDosage} kg/m²</span>
            </div>
            <div className="text-right font-mono text-teal-600 font-bold">
              = {sikaRadierKg.toFixed(1)} kg
            </div>
          </div>

          <div className="space-y-1 md:border-l pl-0 md:pl-6">
            <div className="flex justify-between text-sm">
              <span>Área Zapatas:</span>
              <span className="font-bold">
                {zapataTotals.area.toFixed(2)} m²
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Dosis:</span>
              <span>{zapataConfig.sikaDosage} kg/m²</span>
            </div>
            <div className="text-right font-mono text-teal-600 font-bold">
              = {sikaZapataKg.toFixed(1)} kg
            </div>
          </div>

          <div className="md:col-span-2 bg-teal-50 rounded-xl p-4 flex justify-between items-center border border-teal-100">
            <div>
              <p className="text-sm text-teal-800 font-medium">
                Total Requerido
              </p>
              <p className="text-2xl font-bold text-teal-900">
                {totalSikaKg.toFixed(1)} kg
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-teal-800 font-medium mb-1">
                A comprar
              </p>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-teal-200 inline-block">
                <span className="text-3xl font-bold text-teal-700">
                  {totalSikaBidones}
                </span>
                <span className="text-xs text-teal-600 ml-1">
                  Bidones ({radierConfig.sikaContainer}L)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- SUBCOMPONENTES ---

interface SectionHeaderProps {
  title: string;
  totalVol: number;
  color: string;
}

const SectionHeader = ({ title, totalVol, color }: SectionHeaderProps) => (
  <div
    className={`flex justify-between items-center border-l-4 border-${color}-500 pl-3`}
  >
    <h2 className={`text-xl font-bold text-${color}-900`}>{title}</h2>
    <div className="text-right">
      <span className="text-xs text-slate-500 block uppercase">
        Volumen Total
      </span>
      <span className={`text-xl font-bold text-${color}-600`}>
        {totalVol.toFixed(2)} m³
      </span>
    </div>
  </div>
);

interface InputTableProps {
  items: SikaCalculation[];
  onUpdate: (id: number, field: string, value: string | number) => void;
  onRemove: (id: number) => void;
  onAdd: () => void;
  isPending: boolean;
}

const InputTable = ({
  items,
  onUpdate,
  onRemove,
  onAdd,
  isPending,
}: InputTableProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
        <tr>
          <th className="px-3 py-2 text-left">Elemento</th>
          <th className="px-2 py-2 text-center">Cant</th>
          <th className="px-2 py-2 text-center">L (m)</th>
          <th className="px-2 py-2 text-center">A (m)</th>
          <th className="px-2 py-2 text-center">H (m)</th>
          <th className="px-2 py-2 w-8"></th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center py-8 text-slate-400">
              No hay elementos. Haz clic en &quot;Agregar Fila&quot; para
              comenzar.
            </td>
          </tr>
        ) : (
          items.map((item) => (
            <tr
              key={item.id}
              className="border-b last:border-0 hover:bg-slate-50"
            >
              <td className="p-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => onUpdate(item.id, "name", e.target.value)}
                  className="w-full bg-transparent focus:outline-none font-medium"
                  disabled={isPending}
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => onUpdate(item.id, "qty", e.target.value)}
                  className="w-12 text-center bg-slate-100 rounded"
                  disabled={isPending}
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={item.length}
                  onChange={(e) => onUpdate(item.id, "length", e.target.value)}
                  className="w-14 text-center bg-slate-100 rounded"
                  disabled={isPending}
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={item.width}
                  onChange={(e) => onUpdate(item.id, "width", e.target.value)}
                  className="w-14 text-center bg-slate-100 rounded"
                  disabled={isPending}
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.01"
                  value={item.height}
                  onChange={(e) => onUpdate(item.id, "height", e.target.value)}
                  className="w-14 text-center bg-slate-100 rounded"
                  disabled={isPending}
                />
              </td>
              <td className="p-2 text-center">
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-red-400 hover:text-red-600 disabled:opacity-50"
                  disabled={isPending}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
    <button
      onClick={onAdd}
      disabled={isPending}
      className="w-full py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 border-t flex justify-center items-center gap-1 disabled:opacity-50"
    >
      <Plus size={14} /> Agregar Fila
    </button>
  </div>
);

interface ConfigPanelProps {
  title: string;
  config: SikaConfig;
  onUpdate: (field: keyof SikaConfig, value: number) => void;
  color: string;
  isPending: boolean;
}

const ConfigPanel = ({
  title,
  config,
  onUpdate,
  color,
  isPending,
}: ConfigPanelProps) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200">
    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
      <RefreshCw size={12} /> {title}
    </h3>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <label className="block text-slate-500 text-xs mb-1">
          Cemento (Sacos/m³)
        </label>
        <input
          type="number"
          step="0.1"
          value={config.cement}
          onChange={(e) => onUpdate("cement", parseFloat(e.target.value))}
          className={`w-full border rounded p-1 text-${color}-700 font-bold text-right`}
          disabled={isPending}
        />
      </div>
      <div>
        <label className="block text-slate-500 text-xs mb-1">
          Arena (Unidades/m³)
        </label>
        <input
          type="number"
          step="1"
          value={config.sand}
          onChange={(e) => onUpdate("sand", parseFloat(e.target.value))}
          className="w-full border rounded p-1 text-slate-700 text-right"
          disabled={isPending}
        />
      </div>
      <div>
        <label className="block text-slate-500 text-xs mb-1">
          Grava (Unidades/m³)
        </label>
        <input
          type="number"
          step="1"
          value={config.gravel}
          onChange={(e) => onUpdate("gravel", parseFloat(e.target.value))}
          className="w-full border rounded p-1 text-slate-700 text-right"
          disabled={isPending}
        />
      </div>
      <div>
        <label className="block text-slate-500 text-xs mb-1">
          Agua (Litros/m³)
        </label>
        <input
          type="number"
          step="1"
          value={config.water}
          onChange={(e) => onUpdate("water", parseFloat(e.target.value))}
          className="w-full border rounded p-1 text-slate-700 text-right"
          disabled={isPending}
        />
      </div>
      <div>
        <label className="block text-slate-500 text-xs mb-1">
          Desperdicio (%)
        </label>
        <input
          type="number"
          step="1"
          value={config.waste}
          onChange={(e) => onUpdate("waste", parseFloat(e.target.value))}
          className="w-full border rounded p-1 text-yellow-700 font-bold text-right"
          disabled={isPending}
        />
      </div>
      <div>
        <label className="block text-slate-500 text-xs mb-1">
          Sika (kg/m²)
        </label>
        <input
          type="number"
          step="0.1"
          value={config.sikaDosage}
          onChange={(e) => onUpdate("sikaDosage", parseFloat(e.target.value))}
          className="w-full border rounded p-1 text-teal-700 font-bold text-right"
          disabled={isPending}
        />
      </div>
    </div>
  </div>
);

interface ResultsCardProps {
  title: string;
  vol: number;
  config: SikaConfig;
  color: string;
}

const ResultsCard = ({ title, vol, config, color }: ResultsCardProps) => {
  const wasteMult = 1 + config.waste / 100;
  // Cálculos finales
  const cement = Math.ceil(vol * config.cement * wasteMult);
  const sand = Math.ceil(vol * config.sand * wasteMult);
  const gravel = Math.ceil(vol * config.gravel * wasteMult);
  const water = (vol * config.water * wasteMult).toFixed(1);

  return (
    <div className={`bg-${color}-600 text-white p-5 rounded-xl shadow-lg`}>
      <h3 className="font-bold border-b border-white/20 pb-2 mb-3 flex justify-between">
        {title} <Save size={18} />
      </h3>
      <div className="space-y-3">
        <ResultRow label="Cemento (25kg)" val={cement} unit="sacos" />
        <ResultRow label="Arena Gruesa" val={sand} unit="unidades" />
        <ResultRow label="Grava" val={gravel} unit="unidades" />
        <div className="pt-2 border-t border-white/20 flex justify-between items-center">
          <span className="text-white/70 text-sm">Agua Potable</span>
          <span className="font-medium">
            {water} <span className="text-xs opacity-70">aprox</span>
          </span>
        </div>
      </div>
    </div>
  );
};

interface ResultRowProps {
  label: string;
  val: number;
  unit: string;
}

const ResultRow = ({ label, val, unit }: ResultRowProps) => (
  <div className="flex justify-between items-center">
    <span className="text-white/90 text-sm">{label}</span>
    <span className="font-bold text-lg">
      {val} <span className="text-xs font-normal opacity-70">{unit}</span>
    </span>
  </div>
);
