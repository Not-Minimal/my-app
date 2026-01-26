"use client";

import React, { useState, useTransition } from "react";
import { Plus, Trash2, Calculator, Info, RotateCcw, Loader2 } from "lucide-react";
import type { VolcanitaCalculation } from "@/app/db/schema";
import {
  createVolcanitaCalculation,
  updateVolcanitaCalculation,
  deleteVolcanitaCalculation,
} from "@/app/actions/volcanita";

const VOLCANITA_TYPES = [
  { id: "ST_CIELO", name: "ST (Cielo)", thickness: "8mm / 10mm", color: "bg-blue-400", usage: "Cielo" },
  { id: "ST_TABIQUE", name: "ST (Tabique)", thickness: "15mm", color: "bg-blue-900", usage: "Tabique" },
  { id: "RH", name: "RH (Humedad)", thickness: "12.5mm", color: "bg-emerald-800", usage: "Baño y Cocina" },
  { id: "RF", name: "RF (Fuego)", thickness: "12.5mm", color: "bg-red-700", usage: "Muro Cortafuego" },
  { id: "ACU", name: "ACU (Acústica)", thickness: "10mm", color: "bg-purple-800", usage: "Reducción de Ruido" },
];

const BOARD_AREA = 1.2 * 2.4; // 2.88 m²

interface VolcanitaTabProps {
  initialCalculations: VolcanitaCalculation[];
}

export default function VolcanitaTab({ initialCalculations }: VolcanitaTabProps) {
  const [calculations, setCalculations] = useState<VolcanitaCalculation[]>(initialCalculations);
  const [isPending, startTransition] = useTransition();

  const calculateArea = (row: VolcanitaCalculation) => {
    const wallArea = row.ancho * row.alto;
    const windowArea = row.anchoVentana * row.altoVentana;
    return Math.max(0, wallArea - windowArea);
  };

  const totals = calculations.reduce(
    (acc, row) => {
      const area = calculateArea(row);
      const boards = area / BOARD_AREA;
      acc.totalArea += area;
      acc.totalBoards += Math.ceil(boards);
      return acc;
    },
    { totalArea: 0, totalBoards: 0 }
  );

  const addRow = () => {
    startTransition(async () => {
      const newRow = await createVolcanitaCalculation({
        habitacion: "",
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
    if (calculations.length > 1) {
      startTransition(async () => {
        await deleteVolcanitaCalculation(id);
        setCalculations(calculations.filter((row) => row.id !== id));
      });
    }
  };

  const updateRow = (id: number, field: string, value: string | number) => {
    // Update UI optimistically
    const updatedCalcs = calculations.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setCalculations(updatedCalcs);

    // Update DB
    startTransition(async () => {
      await updateVolcanitaCalculation(id, { [field]: value } as any);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="text-blue-600" />
              Cubicación de Volcanita
            </h2>
            <p className="text-slate-500 text-sm">
              Cálculo de materiales basado en planchas de 1.2m x 2.4m (2.88 m²)
            </p>
          </div>
          <div className="flex gap-4 bg-slate-100 p-4 rounded-lg">
            <div className="text-center px-4 border-r border-slate-300">
              <p className="text-xs text-slate-500 uppercase font-bold">Área Total</p>
              <p className="text-xl font-bold text-blue-700">{totals.totalArea.toFixed(2)} m²</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-slate-500 uppercase font-bold">Total Planchas</p>
              <p className="text-xl font-bold text-blue-700">{totals.totalBoards} un.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {VOLCANITA_TYPES.map((type) => (
          <div
            key={type.id}
            className={`${type.color} text-white p-3 rounded-lg text-xs shadow-sm`}
          >
            <p className="font-bold">{type.name}</p>
            <p className="opacity-80">{type.thickness}</p>
            <p className="mt-1 font-medium italic">{type.usage}</p>
          </div>
        ))}
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-700">Habitación</th>
                <th className="p-4 border-b border-slate-700">Superficie</th>
                <th className="p-4 border-b border-slate-700">Orientación</th>
                <th className="p-4 border-b border-slate-700 text-center">Ancho / Largo (m)</th>
                <th className="p-4 border-b border-slate-700 text-center">Alto / Ancho (m)</th>
                <th className="p-4 border-b border-slate-700 text-center text-blue-300">
                  Ancho Vent.
                </th>
                <th className="p-4 border-b border-slate-700 text-center text-blue-300">
                  Alto Vent.
                </th>
                <th className="p-4 border-b border-slate-700">Tipo Volcanita</th>
                <th className="p-4 border-b border-slate-700 text-right">Área Neto</th>
                <th className="p-4 border-b border-slate-700 text-right">Planchas</th>
                <th className="p-4 border-b border-slate-700 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {calculations.map((row) => {
                const netArea = calculateArea(row);
                const boardsNeeded = netArea / BOARD_AREA;
                const selectedType = VOLCANITA_TYPES.find((t) => t.id === row.tipoVolcanita);

                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <input
                        type="text"
                        className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none p-1"
                        value={row.habitacion}
                        onChange={(e) => updateRow(row.id, "habitacion", e.target.value)}
                        placeholder="Ej: Cocina"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        className="bg-transparent outline-none cursor-pointer"
                        value={row.tipoSuperficie}
                        onChange={(e) => updateRow(row.id, "tipoSuperficie", e.target.value)}
                      >
                        <option value="Pared">Pared</option>
                        <option value="Cielo">Cielo</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        className="bg-transparent outline-none cursor-pointer"
                        value={row.orientacion}
                        onChange={(e) => updateRow(row.id, "orientacion", e.target.value)}
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
                        onChange={(e) => updateRow(row.id, "ancho", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        className={`w-20 text-center border rounded p-1 ${
                          row.tipoSuperficie === "Pared" ? "bg-slate-50" : "bg-white"
                        }`}
                        value={row.alto}
                        onChange={(e) =>
                          row.tipoSuperficie === "Cielo" &&
                          updateRow(row.id, "alto", parseFloat(e.target.value) || 0)
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
                          updateRow(row.id, "anchoVentana", parseFloat(e.target.value) || 0)
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
                          updateRow(row.id, "altoVentana", parseFloat(e.target.value) || 0)
                        }
                        disabled={row.tipoSuperficie === "Cielo"}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <select
                          className="bg-transparent text-sm font-medium outline-none"
                          value={row.tipoVolcanita}
                          onChange={(e) => updateRow(row.id, "tipoVolcanita", e.target.value)}
                        >
                          {VOLCANITA_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-500 px-1 rounded bg-slate-100 w-fit">
                          Espesor: {selectedType?.thickness}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">{netArea.toFixed(2)} m²</td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-blue-600 font-bold">{Math.ceil(boardsNeeded)}</span>
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
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Añadir Pared o Cielo
          </button>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Info size={14} />
            Las filas de Cielo permiten editar ambas dimensiones. Las de Pared fijan el alto en
            2.4m.
          </div>
        </div>
      </div>
    </div>
  );
}
