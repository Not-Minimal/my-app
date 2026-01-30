"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Trash2,
  Calculator,
  Info,
  Loader2,
  Layers,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import type { VolcanitaCalculation } from "@/app/db/schema";
import {
  createVolcanitaCalculation,
  updateVolcanitaCalculation,
  deleteVolcanitaCalculation,
} from "@/app/actions/volcanita";
import { roomsConfig } from "@/app/data/project-data";

const VOLCANITA_TYPES = [
  {
    id: "ST_CIELO",
    name: "ST (Cielo)",
    thickness: "8mm / 10mm",
    color: "bg-blue-400",
    usage: "Cielo",
    precioM2: 5000,
  },
  {
    id: "ST_TABIQUE",
    name: "ST (Tabique)",
    thickness: "15mm",
    color: "bg-blue-900",
    usage: "Tabique",
    precioM2: 6500,
  },
  {
    id: "RH",
    name: "RH (Humedad)",
    thickness: "12.5mm",
    color: "bg-emerald-800",
    usage: "Baño y Cocina",
    precioM2: 7500,
  },
  {
    id: "RF",
    name: "RF (Fuego)",
    thickness: "12.5mm",
    color: "bg-red-700",
    usage: "Muro Cortafuego",
    precioM2: 8500,
  },
  {
    id: "ACU",
    name: "ACU (Acústica)",
    thickness: "10mm",
    color: "bg-purple-800",
    usage: "Reducción de Ruido",
    precioM2: 9000,
  },
];

const BOARD_AREA = 1.2 * 2.4; // 2.88 m²

interface VolcanitaTabProps {
  initialCalculations: VolcanitaCalculation[];
}

export default function VolcanitaTab({
  initialCalculations,
}: VolcanitaTabProps) {
  const [calculations, setCalculations] =
    useState<VolcanitaCalculation[]>(initialCalculations);
  const [isPending, startTransition] = useTransition();
  const [copiedSimple, setCopiedSimple] = useState(false);
  const [copiedDetailed, setCopiedDetailed] = useState(false);

  // Estados para precios editables
  const [prices, setPrices] = useState({
    ST_CIELO: 5000,
    ST_TABIQUE: 6500,
    RH: 7500,
    RF: 8500,
    ACU: 9000,
  });

  const calculateArea = (row: VolcanitaCalculation) => {
    const wallArea = row.ancho * row.alto;
    const windowArea = row.anchoVentana * row.altoVentana;
    return Math.max(0, wallArea - windowArea);
  };

  // Calcular totales por piso
  const floorTotals = useMemo(() => {
    const floor1 = calculations.filter((c) => c.floor === 1);
    const floor2 = calculations.filter((c) => c.floor === 2);

    const calcFloorTotal = (rows: VolcanitaCalculation[]) => {
      return rows.reduce(
        (acc, row) => {
          const area = calculateArea(row);
          acc.area += area;
          acc.boards += Math.ceil(area / BOARD_AREA);
          return acc;
        },
        { area: 0, boards: 0 },
      );
    };

    return {
      floor1: calcFloorTotal(floor1),
      floor2: calcFloorTotal(floor2),
      total: calcFloorTotal(calculations),
    };
  }, [calculations]);

  // Calcular totales por tipo de volcanita
  const typeTotals = useMemo(() => {
    const totals: Record<
      string,
      { area: number; boards: number; floor1: number; floor2: number }
    > = {};

    VOLCANITA_TYPES.forEach((type) => {
      totals[type.id] = { area: 0, boards: 0, floor1: 0, floor2: 0 };
    });

    calculations.forEach((row) => {
      const area = calculateArea(row);
      const boards = Math.ceil(area / BOARD_AREA);
      if (totals[row.tipoVolcanita]) {
        totals[row.tipoVolcanita].area += area;
        totals[row.tipoVolcanita].boards += boards;
        if (row.floor === 1) {
          totals[row.tipoVolcanita].floor1 += boards;
        } else if (row.floor === 2) {
          totals[row.tipoVolcanita].floor2 += boards;
        }
      }
    });

    return totals;
  }, [calculations]);

  const addRow = () => {
    startTransition(async () => {
      const newRow = await createVolcanitaCalculation({
        habitacion: "general",
        floor: 1,
        tipoSuperficie: "Pared",
        orientacion: "Norte",
        ancho: 0,
        alto: 2.4,
        anchoVentana: 0,
        altoVentana: 0,
        tipoVolcanita: "ST_TABIQUE",
      });
      setCalculations([...calculations, newRow]);
    });
  };

  const removeRow = (id: number) => {
    startTransition(async () => {
      await deleteVolcanitaCalculation(id);
      setCalculations(calculations.filter((row) => row.id !== id));
    });
  };

  const updateRow = (id: number, field: string, value: string | number) => {
    // Update UI optimistically
    const updatedCalcs = calculations.map((row) =>
      row.id === id ? { ...row, [field]: value } : row,
    );
    setCalculations(updatedCalcs);

    // Update DB
    startTransition(async () => {
      const updateData: Record<string, string | number> = { [field]: value };
      await updateVolcanitaCalculation(id, updateData);
    });
  };

  // Función para copiar resumen simple
  const copySimpleSummary = async () => {
    const types = VOLCANITA_TYPES.filter(
      (type) => typeTotals[type.id].boards > 0,
    );

    let text = "📋 PEDIDO DE VOLCANITA\n";
    text += "━━━━━━━━━━━━━━━━━━━━━━\n\n";

    let totalGeneral = 0;

    types.forEach((type) => {
      const total = typeTotals[type.id];
      const precio = prices[type.id as keyof typeof prices];
      const precioTotal = Math.round(total.area * precio);
      totalGeneral += precioTotal;

      text += `${type.name} (${type.thickness})\n`;
      text += `  → ${total.boards} planchas (${total.area.toFixed(2)} m²)\n`;
      text += `  → $${precio.toLocaleString("es-CL")}/m²\n`;
      text += `  → Subtotal: $${precioTotal.toLocaleString("es-CL")}\n\n`;
    });

    text += "━━━━━━━━━━━━━━━━━━━━━━\n";
    text += `TOTAL: ${floorTotals.total.boards} planchas\n`;
    text += `ÁREA TOTAL: ${floorTotals.total.area.toFixed(2)} m²\n`;
    text += `PRECIO TOTAL: $${totalGeneral.toLocaleString("es-CL")}`;

    await navigator.clipboard.writeText(text);
    setCopiedSimple(true);
    setTimeout(() => setCopiedSimple(false), 2000);
  };

  // Función para copiar resumen detallado
  const copyDetailedSummary = async () => {
    const types = VOLCANITA_TYPES.filter(
      (type) => typeTotals[type.id].boards > 0,
    );

    let text = "📋 PEDIDO DE VOLCANITA - DETALLADO\n";
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    text += "📊 RESUMEN POR PISO:\n";
    text += `  • Primer Piso: ${floorTotals.floor1.boards} planchas (${floorTotals.floor1.area.toFixed(2)} m²)\n`;
    text += `  • Segundo Piso: ${floorTotals.floor2.boards} planchas (${floorTotals.floor2.area.toFixed(2)} m²)\n\n`;

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    text += "📦 DETALLE POR TIPO:\n\n";

    let totalGeneral = 0;

    types.forEach((type) => {
      const total = typeTotals[type.id];
      const precio = prices[type.id as keyof typeof prices];
      const precioTotal = Math.round(total.area * precio);
      totalGeneral += precioTotal;

      text += `${type.name}\n`;
      text += `  Grosor: ${type.thickness}\n`;
      text += `  Uso: ${type.usage}\n`;
      text += `  Total: ${total.boards} planchas (${total.area.toFixed(2)} m²)\n`;
      text += `  Precio: $${precio.toLocaleString("es-CL")}/m²\n`;
      text += `  Subtotal: $${precioTotal.toLocaleString("es-CL")}\n`;
      text += `    - Piso 1: ${total.floor1} planchas\n`;
      text += `    - Piso 2: ${total.floor2} planchas\n\n`;
    });

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    text += "📍 RESUMEN DE ÁREAS:\n";

    calculations.forEach((calc) => {
      const area = calculateArea(calc);
      const boards = Math.ceil(area / BOARD_AREA);
      const type = VOLCANITA_TYPES.find((t) => t.id === calc.tipoVolcanita);
      text += `  • ${calc.habitacion || "Sin nombre"} (Piso ${calc.floor})\n`;
      text += `    ${calc.tipoSuperficie} ${calc.orientacion} - ${type?.name}\n`;
      text += `    ${calc.ancho}m × ${calc.alto}m = ${area.toFixed(2)} m² → ${boards} planchas\n\n`;
    });

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    text += "💰 RESUMEN FINANCIERO:\n";
    text += `  TOTAL: ${floorTotals.total.boards} planchas\n`;
    text += `  Área total: ${floorTotals.total.area.toFixed(2)} m²\n`;
    text += `  PRECIO TOTAL: $${totalGeneral.toLocaleString("es-CL")}\n`;
    text += `  Planchas de 1.2m × 2.4m (${BOARD_AREA} m² c/u)`;

    await navigator.clipboard.writeText(text);
    setCopiedDetailed(true);
    setTimeout(() => setCopiedDetailed(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Configuración de Precios */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          💰 Configuración de Precios por m²
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ST Cielo (8mm/10mm)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <input
                type="number"
                value={prices.ST_CIELO}
                onChange={(e) =>
                  setPrices({
                    ...prices,
                    ST_CIELO: Number(e.target.value),
                  })
                }
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ST Tabique (15mm)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <input
                type="number"
                value={prices.ST_TABIQUE}
                onChange={(e) =>
                  setPrices({
                    ...prices,
                    ST_TABIQUE: Number(e.target.value),
                  })
                }
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              RH Humedad (12.5mm)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <input
                type="number"
                value={prices.RH}
                onChange={(e) =>
                  setPrices({
                    ...prices,
                    RH: Number(e.target.value),
                  })
                }
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              RF Fuego (12.5mm)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <input
                type="number"
                value={prices.RF}
                onChange={(e) =>
                  setPrices({
                    ...prices,
                    RF: Number(e.target.value),
                  })
                }
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ACU Acústica (10mm)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <input
                type="number"
                value={prices.ACU}
                onChange={(e) =>
                  setPrices({
                    ...prices,
                    ACU: Number(e.target.value),
                  })
                }
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:border-purple-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Header con totales generales */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="text-blue-600" />
                Cubicación de Volcanita
              </h2>
              <p className="text-slate-500 text-sm">
                Cálculo de materiales basado en planchas de 1.2m x 2.4m (2.88
                m²)
              </p>
            </div>

            {/* Botones de copiar */}
            <div className="flex gap-2">
              <button
                onClick={copySimpleSummary}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
              >
                {copiedSimple ? (
                  <>
                    <Check size={16} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copiar Resumen
                  </>
                )}
              </button>
              <button
                onClick={copyDetailedSummary}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
              >
                {copiedDetailed ? (
                  <>
                    <Check size={16} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    Copiar Detallado
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Totales por piso */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Piso 1 */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-blue-900 uppercase">
                  Primer Piso
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-blue-600">Área</p>
                  <p className="text-lg font-bold text-blue-900">
                    {floorTotals.floor1.area.toFixed(2)} m²
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Planchas</p>
                  <p className="text-lg font-bold text-blue-900">
                    {floorTotals.floor1.boards} un.
                  </p>
                </div>
              </div>
            </div>

            {/* Piso 2 */}
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={18} className="text-purple-600" />
                <h3 className="text-sm font-bold text-purple-900 uppercase">
                  Segundo Piso
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-purple-600">Área</p>
                  <p className="text-lg font-bold text-purple-900">
                    {floorTotals.floor2.area.toFixed(2)} m²
                  </p>
                </div>
                <div>
                  <p className="text-xs text-purple-600">Planchas</p>
                  <p className="text-lg font-bold text-purple-900">
                    {floorTotals.floor2.boards} un.
                  </p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="bg-slate-100 p-4 rounded-lg border-2 border-slate-300">
              <div className="flex items-center gap-2 mb-2">
                <Calculator size={18} className="text-slate-700" />
                <h3 className="text-sm font-bold text-slate-800 uppercase">
                  Total General
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-600">Área</p>
                  <p className="text-lg font-bold text-slate-900">
                    {floorTotals.total.area.toFixed(2)} m²
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Planchas</p>
                  <p className="text-lg font-bold text-slate-900">
                    {floorTotals.total.boards} un.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Totales por tipo de volcanita */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Resumen por Tipo de Volcanita
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {VOLCANITA_TYPES.map((type) => {
            const total = typeTotals[type.id];
            const precio = prices[type.id as keyof typeof prices];
            const precioTotal = Math.round(total.area * precio);

            return (
              <div
                key={type.id}
                className={`${type.color} text-white p-4 rounded-lg shadow-sm`}
              >
                <p className="font-bold text-sm mb-1">{type.name}</p>
                <p className="text-xs opacity-80 mb-3">{type.thickness}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between pb-1 border-b border-white/20">
                    <span className="opacity-80">Total:</span>
                    <span className="font-bold">{total.boards} un.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Área:</span>
                    <span className="font-medium">
                      {total.area.toFixed(2)} m²
                    </span>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-white/20">
                    <span className="opacity-80">Precio:</span>
                    <span className="font-bold">
                      ${precioTotal.toLocaleString("es-CL")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Piso 1:</span>
                    <span className="font-medium">{total.floor1} un.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Piso 2:</span>
                    <span className="font-medium">{total.floor2} un.</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen General Total */}
        <div className="mt-6 bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-lg shadow-lg">
          <h4 className="text-lg font-bold mb-4">💰 Resumen General</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {VOLCANITA_TYPES.map((type) => {
              const total = typeTotals[type.id];
              const precio = prices[type.id as keyof typeof prices];
              const precioTotal = Math.round(total.area * precio);

              if (total.boards === 0) return null;

              return (
                <div
                  key={type.id}
                  className="bg-white/10 rounded-lg p-4 backdrop-blur-sm"
                >
                  <p className="text-sm opacity-90 mb-1">{type.name}</p>
                  <p className="text-xs opacity-75 mb-2">({type.thickness})</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="opacity-80">Planchas:</span>
                      <span className="font-semibold">{total.boards} un.</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="opacity-80">Área:</span>
                      <span className="font-semibold">
                        {total.area.toFixed(2)} m²
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="opacity-80">Precio/m²:</span>
                      <span className="font-semibold">
                        ${precio.toLocaleString("es-CL")}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/20">
                      <span className="font-semibold text-xs">Subtotal:</span>
                      <span className="font-bold text-sm">
                        ${precioTotal.toLocaleString("es-CL")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total General */}
          <div className="mt-6 pt-4 border-t-2 border-white/30">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold">TOTAL GENERAL</p>
                <p className="text-sm opacity-80">
                  Planchas: {floorTotals.total.boards} un. | Área total:{" "}
                  {floorTotals.total.area.toFixed(2)} m²
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  $
                  {Math.round(
                    VOLCANITA_TYPES.reduce((sum, type) => {
                      return (
                        sum +
                        typeTotals[type.id].area *
                          prices[type.id as keyof typeof prices]
                      );
                    }, 0),
                  ).toLocaleString("es-CL")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de cálculos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-700">Piso</th>
                <th className="p-4 border-b border-slate-700">Habitación</th>
                <th className="p-4 border-b border-slate-700">Superficie</th>
                <th className="p-4 border-b border-slate-700">Orientación</th>
                <th className="p-4 border-b border-slate-700 text-center">
                  Ancho / Largo (m)
                </th>
                <th className="p-4 border-b border-slate-700 text-center">
                  Alto / Ancho (m)
                </th>
                <th className="p-4 border-b border-slate-700 text-center text-blue-300">
                  Ancho Vent.
                </th>
                <th className="p-4 border-b border-slate-700 text-center text-blue-300">
                  Alto Vent.
                </th>
                <th className="p-4 border-b border-slate-700">
                  Tipo Volcanita
                </th>
                <th className="p-4 border-b border-slate-700 text-right">
                  Área Neto
                </th>
                <th className="p-4 border-b border-slate-700 text-right">
                  Planchas
                </th>
                <th className="p-4 border-b border-slate-700 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {calculations.map((row) => {
                const netArea = calculateArea(row);
                const boardsNeeded = netArea / BOARD_AREA;
                const selectedType = VOLCANITA_TYPES.find(
                  (t) => t.id === row.tipoVolcanita,
                );

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      row.floor === 1 ? "bg-blue-50/30" : "bg-purple-50/30"
                    }`}
                  >
                    <td className="p-3">
                      <select
                        className={`outline-none cursor-pointer font-medium px-2 py-1 rounded ${
                          row.floor === 1
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                        value={row.floor}
                        onChange={(e) =>
                          updateRow(row.id, "floor", parseInt(e.target.value))
                        }
                      >
                        <option value={1}>Piso 1</option>
                        <option value={2}>Piso 2</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none p-1 text-sm"
                        value={row.habitacion}
                        onChange={(e) =>
                          updateRow(row.id, "habitacion", e.target.value)
                        }
                      >
                        {Object.entries(roomsConfig).map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        className="bg-transparent outline-none cursor-pointer"
                        value={row.tipoSuperficie}
                        onChange={(e) =>
                          updateRow(row.id, "tipoSuperficie", e.target.value)
                        }
                      >
                        <option value="Pared">Pared</option>
                        <option value="Cielo">Cielo</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        className="bg-transparent outline-none cursor-pointer"
                        value={row.orientacion}
                        onChange={(e) =>
                          updateRow(row.id, "orientacion", e.target.value)
                        }
                      >
                        <option value="Norte">Norte</option>
                        <option value="Sur">Sur</option>
                        <option value="Este">Este</option>
                        <option value="Oeste">Oeste</option>
                        <option value="Horizontal">Cielo (Horiz.)</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        className="w-20 text-center border rounded p-1"
                        value={row.ancho}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "ancho",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        className={`w-20 text-center border rounded p-1 ${
                          row.tipoSuperficie === "Pared"
                            ? "bg-slate-50"
                            : "bg-white"
                        }`}
                        value={row.alto}
                        onChange={(e) =>
                          row.tipoSuperficie === "Cielo" &&
                          updateRow(
                            row.id,
                            "alto",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        readOnly={row.tipoSuperficie === "Pared"}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        className="w-16 text-center border rounded p-1 border-blue-100"
                        value={row.anchoVentana}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "anchoVentana",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        disabled={row.tipoSuperficie === "Cielo"}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        className="w-16 text-center border rounded p-1 border-blue-100"
                        value={row.altoVentana}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "altoVentana",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        disabled={row.tipoSuperficie === "Cielo"}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <select
                          className="bg-transparent text-sm font-medium outline-none"
                          value={row.tipoVolcanita}
                          onChange={(e) =>
                            updateRow(row.id, "tipoVolcanita", e.target.value)
                          }
                        >
                          {VOLCANITA_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-500 px-1 rounded bg-slate-100 w-fit">
                          {selectedType?.thickness}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {netArea.toFixed(2)} m²
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-blue-600 font-bold">
                          {Math.ceil(boardsNeeded)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({boardsNeeded.toFixed(2)})
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-slate-400 hover:text-red-500 p-1 disabled:opacity-50"
                        disabled={isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={addRow}
            disabled={isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            Añadir Pared o Cielo
          </button>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Info size={14} />
            Las filas de Cielo permiten editar ambas dimensiones. Las de Pared
            fijan el alto en 2.4m.
          </div>
        </div>
      </div>
    </div>
  );
}
