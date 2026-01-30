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
  Thermometer,
  ChefHat,
  Sofa,
  UtensilsCrossed,
  Bath,
  BedDouble,
  Bed,
  DoorOpen,
  Move,
  Home,
} from "lucide-react";
import type { InsulationCalculation } from "@/app/db/schema";
import {
  createInsulationCalculation,
  updateInsulationCalculation,
  deleteInsulationCalculation,
} from "@/app/actions/insulation";
import { type Room, roomsConfig } from "@/app/data/project-data";

const INSULATION_TYPES = [
  {
    id: "muro_exterior",
    name: "Muro Exterior",
    espesorMinimo: "70mm",
    valor1: "177",
    valor2: "R100",
    color: "bg-red-600",
    description: "Aislación para muros exteriores",
  },
  {
    id: "cielo_techumbre",
    name: "Cielo - Techumbre",
    espesorMinimo: "140mm",
    valor1: "329",
    valor2: "R100",
    color: "bg-blue-600",
    description: "Aislación para cielos y techumbres",
  },
  {
    id: "tabique_interior",
    name: "Tabique Interior",
    espesorMinimo: "40mm",
    valor1: "94",
    valor2: "R100",
    color: "bg-green-600",
    description: "Aislación para tabiques interiores",
  },
];

// Mapeo de iconos para los ambientes
const roomIcons: Record<string, React.ReactNode> = {
  cocina: <ChefHat size={16} />,
  living: <Sofa size={16} />,
  comedor: <UtensilsCrossed size={16} />,
  bano: <Bath size={16} />,
  "pieza-grande": <BedDouble size={16} />,
  "pieza-mediana": <Bed size={16} />,
  "pieza-pequena": <DoorOpen size={16} />,
  pasillo: <Move size={16} />,
  general: <Home size={16} />,
};

interface InsulationTabProps {
  initialCalculations: InsulationCalculation[];
}

export default function InsulationTab({
  initialCalculations,
}: InsulationTabProps) {
  const [calculations, setCalculations] =
    useState<InsulationCalculation[]>(initialCalculations);
  const [isPending, startTransition] = useTransition();
  const [copiedSimple, setCopiedSimple] = useState(false);
  const [copiedDetailed, setCopiedDetailed] = useState(false);

  const calculateArea = (row: InsulationCalculation) => {
    const isCeiling = row.tipoSuperficie.toLowerCase() === "cielo";

    if (isCeiling) {
      return row.ancho * row.largo;
    }

    const wallArea = row.ancho * row.alto;
    const doorArea = row.anchoPuerta * row.altoPuerta;
    const windowArea = row.anchoVentana * row.altoVentana;
    return Math.max(0, wallArea - doorArea - windowArea);
  };

  // Calcular totales por piso
  const floorTotals = useMemo(() => {
    const floor1 = calculations.filter((c) => c.floor === 1);
    const floor2 = calculations.filter((c) => c.floor === 2);

    const calcFloorTotal = (rows: InsulationCalculation[]) => {
      return rows.reduce(
        (acc, row) => {
          const area = calculateArea(row);
          acc.area += area;
          return acc;
        },
        { area: 0 },
      );
    };

    return {
      floor1: calcFloorTotal(floor1),
      floor2: calcFloorTotal(floor2),
      total: calcFloorTotal(calculations),
    };
  }, [calculations]);

  // Calcular totales por tipo de aislación
  const typeTotals = useMemo(() => {
    const totals: Record<
      string,
      {
        area: number;
        floor1Area: number;
        floor2Area: number;
      }
    > = {};

    INSULATION_TYPES.forEach((type) => {
      totals[type.id] = {
        area: 0,
        floor1Area: 0,
        floor2Area: 0,
      };
    });

    calculations.forEach((row) => {
      const area = calculateArea(row);

      if (totals[row.tipoEstructura]) {
        totals[row.tipoEstructura].area += area;

        if (row.floor === 1) {
          totals[row.tipoEstructura].floor1Area += area;
        } else if (row.floor === 2) {
          totals[row.tipoEstructura].floor2Area += area;
        }
      }
    });

    return totals;
  }, [calculations]);

  const addRow = () => {
    startTransition(async () => {
      const newRow = await createInsulationCalculation({
        room: "general",
        tipoEstructura: "muro_exterior",
        tipoSuperficie: "Pared",
        orientacion: "Norte",
        floor: 1,
        ancho: 0,
        alto: 2.4,
        largo: 0,
        anchoPuerta: 0,
        altoPuerta: 0,
        anchoVentana: 0,
        altoVentana: 0,
      });
      setCalculations([...calculations, newRow]);
    });
  };

  const removeRow = (id: number) => {
    startTransition(async () => {
      await deleteInsulationCalculation(id);
      setCalculations(calculations.filter((row) => row.id !== id));
    });
  };

  const updateRow = (id: number, field: string, value: string | number) => {
    const updatedCalcs = calculations.map((row) =>
      row.id === id ? { ...row, [field]: value } : row,
    );
    setCalculations(updatedCalcs);

    startTransition(async () => {
      const updateData: Record<string, string | number> = { [field]: value };
      await updateInsulationCalculation(id, updateData);
    });
  };

  const copySimpleSummary = async () => {
    const types = INSULATION_TYPES.filter(
      (type) => typeTotals[type.id].area > 0,
    );

    let text = "🧊 PEDIDO DE AISLACIÓN - LANA DE VIDRIO\n";
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    types.forEach((type) => {
      const total = typeTotals[type.id];
      text += `${type.name} (${type.espesorMinimo})\n`;
      text += `  → ${total.area.toFixed(2)} m²\n\n`;
    });

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    text += `TOTAL: ${floorTotals.total.area.toFixed(2)} m²`;

    await navigator.clipboard.writeText(text);
    setCopiedSimple(true);
    setTimeout(() => setCopiedSimple(false), 2000);
  };

  const copyDetailedSummary = async () => {
    const types = INSULATION_TYPES.filter(
      (type) => typeTotals[type.id].area > 0,
    );

    let text = "🧊 PEDIDO DE AISLACIÓN - LANA DE VIDRIO - DETALLADO\n";
    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    text += "📊 RESUMEN POR PISO:\n";
    text += `  • Primer Piso: ${floorTotals.floor1.area.toFixed(2)} m²\n`;
    text += `  • Segundo Piso: ${floorTotals.floor2.area.toFixed(2)} m²\n\n`;

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    text += "📦 DETALLE POR TIPO:\n\n";

    types.forEach((type) => {
      const total = typeTotals[type.id];
      text += `${type.name}\n`;
      text += `  Espesor: ${type.espesorMinimo}\n`;
      text += `  Valores técnicos: ${type.valor1} / ${type.valor2}\n`;
      text += `  Total: ${total.area.toFixed(2)} m²\n`;
      text += `    - Piso 1: ${total.floor1Area.toFixed(2)} m²\n`;
      text += `    - Piso 2: ${total.floor2Area.toFixed(2)} m²\n\n`;
    });

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    text += "📍 DETALLE POR ZONA:\n";

    calculations.forEach((calc) => {
      const area = calculateArea(calc);
      const type = INSULATION_TYPES.find((t) => t.id === calc.tipoEstructura);
      const isCeiling = calc.tipoSuperficie.toLowerCase() === "cielo";
      const roomName = roomsConfig[calc.room as Room]?.name || calc.room;

      text += `  • ${roomName} - ${calc.orientacion} (Piso ${calc.floor})\n`;
      text += `    ${calc.tipoSuperficie} - ${type?.name}\n`;

      if (isCeiling) {
        text += `    ${calc.ancho}m × ${calc.largo}m = ${area.toFixed(2)} m²\n`;
      } else {
        text += `    ${calc.ancho}m × ${calc.alto}m`;
        if (calc.anchoPuerta > 0 || calc.anchoVentana > 0) {
          text += ` (descuentos: `;
          if (calc.anchoPuerta > 0)
            text += `puerta ${calc.anchoPuerta}×${calc.altoPuerta}m`;
          if (calc.anchoVentana > 0) {
            if (calc.anchoPuerta > 0) text += `, `;
            text += `ventana ${calc.anchoVentana}×${calc.altoVentana}m`;
          }
          text += `)`;
        }
        text += ` = ${area.toFixed(2)} m²\n`;
      }
      text += "\n";
    });

    text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    text += `TOTAL GENERAL: ${floorTotals.total.area.toFixed(2)} m²`;

    await navigator.clipboard.writeText(text);
    setCopiedDetailed(true);
    setTimeout(() => setCopiedDetailed(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header con totales generales */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Thermometer className="text-blue-600" />
                Cubicación de Aislación - Lana de Vidrio
              </h2>
              <p className="text-slate-500 text-sm">
                Cálculo de materiales para aislación térmica
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
              <div className="text-center">
                <p className="text-xs text-blue-600">Área Total</p>
                <p className="text-2xl font-bold text-blue-900">
                  {floorTotals.floor1.area.toFixed(2)} m²
                </p>
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
              <div className="text-center">
                <p className="text-xs text-purple-600">Área Total</p>
                <p className="text-2xl font-bold text-purple-900">
                  {floorTotals.floor2.area.toFixed(2)} m²
                </p>
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
              <div className="text-center">
                <p className="text-xs text-slate-600">Área Total</p>
                <p className="text-2xl font-bold text-slate-900">
                  {floorTotals.total.area.toFixed(2)} m²
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Totales por tipo de aislación */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Resumen por Tipo de Aislación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INSULATION_TYPES.map((type) => {
            const total = typeTotals[type.id];
            return (
              <div
                key={type.id}
                className={`${type.color} text-white p-5 rounded-lg shadow-sm`}
              >
                <div className="mb-3">
                  <p className="font-bold text-base mb-1">{type.name}</p>
                  <p className="text-xs opacity-90">
                    {type.espesorMinimo} • {type.valor1} / {type.valor2}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <span className="opacity-90">Total:</span>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {total.area.toFixed(2)} m²
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Piso 1:</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {total.floor1Area.toFixed(2)} m²
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Piso 2:</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {total.floor2Area.toFixed(2)} m²
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla de cálculos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-700">Piso</th>
                <th className="p-4 border-b border-slate-700">Ambiente</th>
                <th className="p-4 border-b border-slate-700">
                  Tipo Estructura
                </th>
                <th className="p-4 border-b border-slate-700">Superficie</th>
                <th className="p-4 border-b border-slate-700">Orientación</th>
                <th className="p-4 border-b border-slate-700 text-center">
                  Ancho (m)
                </th>
                <th className="p-4 border-b border-slate-700 text-center">
                  Alto/Largo (m)
                </th>
                <th className="p-4 border-b border-slate-700 text-center text-orange-300">
                  Puerta A×H
                </th>
                <th className="p-4 border-b border-slate-700 text-center text-blue-300">
                  Ventana A×H
                </th>
                <th className="p-4 border-b border-slate-700 text-right">
                  Área Neta
                </th>
                <th className="p-4 border-b border-slate-700 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {calculations.map((row) => {
                const netArea = calculateArea(row);
                const selectedType = INSULATION_TYPES.find(
                  (t) => t.id === row.tipoEstructura,
                );
                const isCeiling = row.tipoSuperficie.toLowerCase() === "cielo";

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
                        value={row.room}
                        onChange={(e) =>
                          updateRow(row.id, "room", e.target.value)
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
                      <div className="flex flex-col gap-1">
                        <select
                          className="bg-transparent text-sm font-medium outline-none"
                          value={row.tipoEstructura}
                          onChange={(e) =>
                            updateRow(row.id, "tipoEstructura", e.target.value)
                          }
                        >
                          {INSULATION_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-500 px-1 rounded bg-slate-100 w-fit">
                          {selectedType?.espesorMinimo}
                        </span>
                      </div>
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
                        className="bg-transparent outline-none cursor-pointer text-sm"
                        value={row.orientacion}
                        onChange={(e) =>
                          updateRow(row.id, "orientacion", e.target.value)
                        }
                      >
                        <option value="Norte">Norte</option>
                        <option value="Sur">Sur</option>
                        <option value="Este">Este</option>
                        <option value="Oeste">Oeste</option>
                        <option value="Cielo">Cielo (Horiz.)</option>
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
                      {isCeiling ? (
                        <input
                          type="number"
                          step="0.1"
                          className="w-20 text-center border rounded p-1"
                          value={row.largo}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "largo",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="Largo"
                        />
                      ) : (
                        <input
                          type="number"
                          step="0.1"
                          className="w-20 text-center border rounded p-1 bg-slate-50"
                          value={row.alto}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "alto",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 items-center justify-center">
                        <input
                          type="number"
                          step="0.1"
                          className="w-14 text-center border rounded p-1 border-orange-100"
                          value={row.anchoPuerta}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "anchoPuerta",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          disabled={isCeiling}
                          placeholder="A"
                        />
                        <span className="text-slate-400">×</span>
                        <input
                          type="number"
                          step="0.1"
                          className="w-14 text-center border rounded p-1 border-orange-100"
                          value={row.altoPuerta}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "altoPuerta",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          disabled={isCeiling}
                          placeholder="H"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 items-center justify-center">
                        <input
                          type="number"
                          step="0.1"
                          className="w-14 text-center border rounded p-1 border-blue-100"
                          value={row.anchoVentana}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "anchoVentana",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          disabled={isCeiling}
                          placeholder="A"
                        />
                        <span className="text-slate-400">×</span>
                        <input
                          type="number"
                          step="0.1"
                          className="w-14 text-center border rounded p-1 border-blue-100"
                          value={row.altoVentana}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "altoVentana",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          disabled={isCeiling}
                          placeholder="H"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-blue-600 font-bold text-lg">
                          {netArea.toFixed(2)} m²
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {selectedType?.espesorMinimo}
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
            Añadir Superficie
          </button>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Info size={14} />
            Para paredes: ingresa ancho × alto. Para cielos: ingresa ancho ×
            largo. Puedes descontar puertas y ventanas.
          </div>
        </div>
      </div>
    </div>
  );
}
