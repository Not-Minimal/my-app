'use client';

import React, { useState } from 'react';
import { 
  Home, 
  Layers, 
  DoorOpen, 
  FileText, 
  TrendingUp, 
  Table as TableIcon,
  Calculator,
  Edit3,
  CheckCircle2
} from 'lucide-react';

export default function Page() {
  // Estado unificado para manejar Cantidad y Precio de cada ítem
  // Valores iniciales basados en los datos de mercado proporcionados
  const [items, setItems] = useState([
    { id: 'volcanitaST', desc: 'Volcanita Standard 10mm (1.2x2.4)', cant: 88, price: 9392, unit: 'un' },
    { id: 'volcanitaRH', desc: 'Volcanita RH (Verde) 10mm', cant: 25, price: 15289, unit: 'un' },
    { id: 'porcelanato', desc: 'Porcelanato (Piso 1)', cant: 38.16, price: 12490, unit: 'm²' },
    { id: 'pisoFlotante', desc: 'Piso Flotante (Piso 2)', cant: 35.40, price: 13990, unit: 'm²' },
    { id: 'puertas', desc: 'Puertas Interiores Completas', cant: 6, price: 38990, unit: 'un' },
    { id: 'ventanas', desc: 'Ventanas Termopanel Prom.', cant: 9, price: 118000, unit: 'un' },
    { id: 'adhesivo', desc: 'Adhesivo Porcelanato (Sacos 25kg)', cant: 10, price: 8500, unit: 'un' },
    { id: 'espuma', desc: 'Espuma Niveladora/Manta (Piso 2)', cant: 36, price: 2500, unit: 'm²' },
  ]);

  // Manejador de cambios en los inputs
  const handleUpdate = (id: string, field: 'cant' | 'price', value: string) => {
    // Permitir decimales y vacíos temporales mientras el usuario escribe
    if (value === '') {
      setItems(items.map(item => item.id === id ? { ...item, [field]: 0 } : item));
      return;
    }
    
    const newValue = parseFloat(value);
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: isNaN(newValue) ? 0 : newValue } : item
    ));
  };

  // Cálculo del gran total
  const granTotal = items.reduce((acc, item) => {
    const subtotal = (item.cant || 0) * (item.price || 0);
    return acc + subtotal;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Header con Resumen Financiero */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Calculator className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" /> Presupuesto Editable
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-500 font-medium tracking-tight mt-1">
              Control total de cantidades y precios de mercado
            </p>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 sm:gap-4 md:gap-6">
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold tracking-wider">Presupuesto Final</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-blue-700">
                ${Math.round(granTotal).toLocaleString('es-CL')}
              </p>
            </div>
            <div className="h-8 sm:h-10 md:h-12 w-px bg-slate-100 hidden sm:block"></div>
            <div className="hidden sm:flex flex-col text-slate-400">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase">Estado</span>
              <span className="text-emerald-500 flex items-center gap-1 text-[10px] sm:text-xs font-bold">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Sincronizado
              </span>
            </div>
          </div>
        </header>

        {/* Tabla de Gestión de Materiales - Versión Desktop */}
        <section className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4 sm:mb-6 md:mb-8 hidden sm:block">
          <div className="p-3 sm:p-4 bg-slate-800 text-white flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TableIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <h2 className="font-bold text-xs sm:text-sm uppercase tracking-widest">Planilla de Materiales</h2>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-slate-700 px-2 py-1 rounded text-slate-300">CAMPOS EDITABLES EN AZUL</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold">
                  <th className="p-2 sm:p-3 md:p-4 border-b">Descripción del Material</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-center">Cantidad</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-center">Unidad</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-center">Valor Unit. ($)</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`p-1.5 sm:p-2 rounded-lg ${item.id.includes('volcanita') ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                          {item.id.includes('volcanita') ? <Layers size={14} className="sm:w-4 sm:h-4" /> : <Home size={14} className="sm:w-4 sm:h-4" />}
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-700">{item.desc}</p>
                      </div>
                    </td>
                    
                    {/* Input de Cantidad */}
                    <td className="p-2 sm:p-3 md:p-4 text-center">
                      <div className="relative inline-block group">
                        <input 
                          type="number"
                          step="0.01"
                          value={item.cant}
                          onChange={(e) => handleUpdate(item.id, 'cant', e.target.value)}
                          className="w-16 sm:w-20 md:w-24 text-center py-1 sm:py-1.5 bg-blue-50/50 border border-blue-100 rounded text-xs sm:text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                        />
                        <div className="absolute -top-1 -right-1 p-0.5 bg-blue-400 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <Edit3 size={8} />
                        </div>
                      </div>
                    </td>

                    <td className="p-2 sm:p-3 md:p-4 text-center text-[10px] sm:text-xs text-slate-400 uppercase font-medium">{item.unit}</td>

                    {/* Input de Precio Unitario */}
                    <td className="p-2 sm:p-3 md:p-4 text-center">
                      <div className="relative inline-block w-20 sm:w-28 md:w-32 group">
                        <span className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 text-blue-400 text-[10px] sm:text-xs">$</span>
                        <input 
                          type="number"
                          value={item.price}
                          onChange={(e) => handleUpdate(item.id, 'price', e.target.value)}
                          className="w-full pl-4 sm:pl-5 pr-1.5 sm:pr-2 py-1 sm:py-1.5 bg-blue-50/50 border border-blue-100 rounded text-xs sm:text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                        />
                        <div className="absolute -top-1 -right-1 p-0.5 bg-blue-400 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <Edit3 size={8} />
                        </div>
                      </div>
                    </td>

                    <td className="p-2 sm:p-3 md:p-4 text-right font-black text-slate-800 text-xs sm:text-sm bg-slate-50/30">
                      ${Math.round(item.cant * item.price).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white">
                  <td colSpan={4} className="p-2 sm:p-3 md:p-4 text-right font-bold uppercase text-[10px] sm:text-xs tracking-widest">Total General Estimado</td>
                  <td className="p-2 sm:p-3 md:p-4 text-right font-black text-base sm:text-lg md:text-xl">
                    ${Math.round(granTotal).toLocaleString('es-CL')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Vista Mobile - Cards */}
        <section className="block sm:hidden mb-4">
          <div className="bg-slate-800 text-white p-3 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon size={16} />
              <h2 className="font-bold text-xs uppercase">Materiales</h2>
            </div>
            <span className="text-[9px] bg-slate-700 px-2 py-1 rounded">EDITABLE</span>
          </div>
          <div className="space-y-3 p-3 bg-white rounded-b-xl border border-slate-200 border-t-0">
            {items.map((item) => (
              <div key={item.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-start gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${item.id.includes('volcanita') ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                    {item.id.includes('volcanita') ? <Layers size={14} /> : <Home size={14} />}
                  </div>
                  <p className="text-xs font-bold text-slate-700 leading-tight">{item.desc}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Cantidad</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={item.cant}
                      onChange={(e) => handleUpdate(item.id, 'cant', e.target.value)}
                      className="w-full text-center py-1.5 bg-blue-50/50 border border-blue-100 rounded text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Unidad</label>
                    <div className="py-1.5 text-center text-xs text-slate-600 uppercase font-medium bg-slate-100 rounded border border-slate-200">
                      {item.unit}
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Precio Unitario</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-400 text-xs">$</span>
                    <input 
                      type="number"
                      value={item.price}
                      onChange={(e) => handleUpdate(item.id, 'price', e.target.value)}
                      className="w-full pl-5 pr-2 py-1.5 bg-blue-50/50 border border-blue-100 rounded text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Subtotal</span>
                  <span className="text-sm font-black text-slate-800">
                    ${Math.round(item.cant * item.price).toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            ))}
            
            <div className="bg-slate-900 text-white p-3 rounded-lg flex justify-between items-center">
              <span className="text-xs font-bold uppercase">Total General</span>
              <span className="text-lg font-black">
                ${Math.round(granTotal).toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        </section>

        {/* Resumen de Referencia (Pisos) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-2.5 md:p-3 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl flex-shrink-0">
              <CheckCircle2 size={20} className="sm:w-[22px] sm:h-[22px] md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Superficie P1</p>
              <p className="text-sm sm:text-base md:text-lg font-black text-slate-700">
                34.69 m² <span className="text-[9px] sm:text-[10px] font-normal text-slate-400">(Porcelanato)</span>
              </p>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-2.5 md:p-3 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl flex-shrink-0">
              <TrendingUp size={20} className="sm:w-[22px] sm:h-[22px] md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Superficie P2</p>
              <p className="text-sm sm:text-base md:text-lg font-black text-slate-700">
                32.18 m² <span className="text-[9px] sm:text-[10px] font-normal text-slate-400">(Flotante)</span>
              </p>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 sm:gap-4 sm:col-span-2 md:col-span-1">
            <div className="p-2 sm:p-2.5 md:p-3 bg-purple-50 text-purple-600 rounded-lg sm:rounded-xl flex-shrink-0">
              <DoorOpen size={20} className="sm:w-[22px] sm:h-[22px] md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Aberturas</p>
              <p className="text-sm sm:text-base md:text-lg font-black text-slate-700">
                15 Unidades <span className="text-[9px] sm:text-[10px] font-normal text-slate-400">(P+V)</span>
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-6 sm:mt-8 md:mt-12 p-4 sm:p-5 md:p-6 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-slate-400 text-center text-[9px] sm:text-[10px] space-y-2 leading-relaxed">
          <p className="font-bold text-slate-500 uppercase flex items-center justify-center gap-2">
            <FileText size={11} className="sm:w-3 sm:h-3" /> Nota del Presupuesto
          </p>
          <p className="max-w-2xl mx-auto">
            Esta herramienta permite la edición manual para ajustar el presupuesto a compras reales. 
            Los totales se calculan automáticamente multiplicando cantidad por valor unitario.
          </p>
        </footer>

      </div>
    </div>
  );
}
