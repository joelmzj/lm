import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Users, Heart, Shield, CheckCircle, LayoutGrid, Disc, Square, Plus, Settings, Move, Crown, Trash2, X, Sliders, Calculator } from 'lucide-react';

export default function App() {
  const [invitados, setInvitados] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [salon, setSalon] = useState({ ancho_metros: 20, largo_metros: 15 });
  const [loading, setLoading] = useState(true);
  const [vistaReal, setVistaReal] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  const [capacidadDefault, setCapacidadDefault] = useState(10);
  const [formaDefault, setFormaDefault] = useState('redonda');
  const [anchoMesaDefault, setAnchoMesaDefault] = useState(1.5);
  const [largoMesaDefault, setLargoMesaDefault] = useState(1.5);

  const [invitadoArrastrado, setInvitadoArrastrado] = useState(null);

  useEffect(() => {
    fetchDatosBoda();
  }, []);

  async function fetchDatosBoda() {
    try {
      setLoading(true);
      const [resInvitados, resMesas, resSalon] = await Promise.all([
        supabase.from('invitados').select('*'),
        supabase.from('mesas').select('*'),
        supabase.from('salon').select('*').maybeSingle()
      ]);

      if (resInvitados.error) throw resInvitados.error;
      
      let listaMesas = resMesas.data || [];

      if (listaMesas.length === 0) {
        const mesaPrincipalDefault = {
          numero_mesa: 0,
          nombre_mesa: 'Mesa Principal (Novios)',
          capacidad: 2,
          forma: 'cuadrada',
          ancho_metros: 2.0,
          largo_metros: 1.0,
          pos_x: 250,
          pos_y: 40
        };
        const { data: insertedMesa } = await supabase.from('mesas').insert([mesaPrincipalDefault]).select();
        if (insertedMesa) listaMesas = insertedMesa;
      }

      setInvitados(resInvitados.data || []);
      setMesas(listaMesas);
      if (resSalon.data) setSalon(resSalon.data);
    } catch (error) {
      console.error('Error cargando datos:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function agregarMesa() {
    try {
      const nuevoNumero = mesas.length + 1;
      const nuevaMesa = {
        numero_mesa: nuevoNumero,
        nombre_mesa: `Mesa ${nuevoNumero}`,
        capacidad: capacidadDefault,
        forma: formaDefault,
        ancho_metros: anchoMesaDefault,
        largo_metros: formaDefault === 'redonda' ? anchoMesaDefault : largoMesaDefault,
        pos_x: 50 + (mesas.length * 30) % 400,
        pos_y: 100 + Math.floor(mesas.length / 4) * 130
      };

      const { data, error } = await supabase.from('mesas').insert([nuevaMesa]).select();
      if (error) throw error;
      if (data) setMesas([...mesas, data[0]]);
    } catch (error) {
      console.error('Error al agregar mesa:', error.message);
      alert('Error al agregar mesa: ' + error.message);
    }
  }

  async function eliminarMesa(mesaId, numeroMesa) {
    if (numeroMesa === 0) {
      alert('La Mesa Principal no se puede eliminar.');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar esta mesa? Los invitados asignados volverán a la bandeja de pendientes.')) return;

    try {
      await supabase.from('invitados').update({ id_mesa: null }).eq('id_mesa', mesaId);
      const { error } = await supabase.from('mesas').delete().eq('id', mesaId);
      if (error) throw error;

      setMesas(mesas.filter(m => m.id !== mesaId));
      setInvitados(invitados.map(inv => inv.id_mesa === mesaId ? { ...inv, id_mesa: null } : inv));
      if (mesaSeleccionada?.id === mesaId) setMesaSeleccionada(null);
    } catch (error) {
      console.error('Error al eliminar mesa:', error.message);
    }
  }

  async function quitarInvitadoDeMesa(invitadoId) {
    try {
      const { error } = await supabase
        .from('invitados')
        .update({ id_mesa: null })
        .eq('id', invitadoId);

      if (error) throw error;

      setInvitados(invitados.map(inv => 
        inv.id === invitadoId ? { ...inv, id_mesa: null } : inv
      ));
    } catch (error) {
      console.error('Error al quitar invitado de la mesa:', error.message);
    }
  }

  async function actualizarMesaIndividual(mesaId, camposActualizados) {
    try {
      const { error } = await supabase
        .from('mesas')
        .update(camposActualizados)
        .eq('id', mesaId);

      if (error) throw error;

      setMesas(mesas.map(m => m.id === mesaId ? { ...m, ...camposActualizados } : m));
      if (mesaSeleccionada?.id === mesaId) {
        setMesaSeleccionada(prev => ({ ...prev, ...camposActualizados }));
      }
    } catch (error) {
      console.error('Error al actualizar mesa:', error.message);
    }
  }

  async function handleDropOnMesa(e, mesaId) {
    e.preventDefault();
    if (!invitadoArrastrado) return;

    try {
      const { error } = await supabase
        .from('invitados')
        .update({ id_mesa: mesaId })
        .eq('id', invitadoArrastrado.id);

      if (error) throw error;

      setInvitados(invitados.map(inv => 
        inv.id === invitadoArrastrado.id ? { ...inv, id_mesa: mesaId } : inv
      ));
      setInvitadoArrastrado(null);
    } catch (error) {
      console.error('Error al asignar invitado a mesa:', error.message);
    }
  }

  async function handleMesaDragEnd(e, mesaId) {
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    const x = Math.max(10, Math.min(e.clientX - rect.left - 60, rect.width - 140));
    const y = Math.max(10, Math.min(e.clientY - rect.top - 60, rect.height - 140));

    try {
      const { error } = await supabase
        .from('mesas')
        .update({ pos_x: x, pos_y: y })
        .eq('id', mesaId);

      if (error) throw error;

      setMesas(mesas.map(m => m.id === mesaId ? { ...m, pos_x: x, pos_y: y } : m));
    } catch (error) {
      console.error('Error al mover mesa:', error.message);
    }
  }

  async function actualizarSalon(nuevoAncho, nuevoLargo) {
    const actualizado = { ...salon, ancho_metros: Number(nuevoAncho), largo_metros: Number(nuevoLargo) };
    setSalon(actualizado);
    try {
      await supabase.from('salon').upsert([{ id: 1, ...actualizado }]);
    } catch (error) {
      console.error('Error actualizando salón:', error.message);
    }
  }

  // Filtrado de listas laterales (pendientes)
  const invitadosItsa = invitados.filter(i => i.anfitrion === 'Itsa' && !i.id_mesa && (!vistaReal || i.confirmacion === 'S'));
  const invitadosJoel = invitados.filter(i => i.anfitrion === 'Joel' && !i.id_mesa && (!vistaReal || i.confirmacion === 'S'));

  // CÁLCULOS EXACTOS DE CONTADORES GENERALES DESDE SUPABASE
  const totalRegistrosPrincipales = invitados.length;
  // Total de Invitados (Pases base + Extras sumados)
  const totalInvitadosPases = invitados.reduce((acc, inv) => acc + (inv.numero_invitados || 1) + (inv.invitados_extra || 0), 0);
  // Total de Asistentes Confirmados registrados
  const totalAsistentesConfirmados = invitados.reduce((acc, inv) => acc + (inv.asistentes_confirmados || 0), 0);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* Header con Contadores Globales */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center space-x-3">
          <Heart className="text-pink-400 w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-bold tracking-wide">Itsa & Joel <span className="text-sm font-normal text-slate-400">| Boda 21 Nov 2026</span></h1>
        </div>

        {/* Panel de Contadores Globales sincronizados con Supabase */}
        <div className="flex items-center space-x-4 bg-slate-950/60 border border-slate-800 px-4 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Registros: <strong className="text-white">{totalRegistrosPrincipales}</strong></span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calculator className="w-3.5 h-3.5 text-pink-400" />
            <span>Total Pases / Invitados: <strong className="text-pink-300">{totalInvitadosPases}</strong></span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Confirmados: <strong className="text-emerald-300">{totalAsistentesConfirmados}</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setMostrarConfig(!mostrarConfig)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>Configurar Salón</span>
          </button>
          
          <button 
            onClick={() => setVistaReal(!vistaReal)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              vistaReal ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{vistaReal ? "Modo: Real (Confirmados)" : "Modo: Propuesta"}</span>
          </button>
        </div>
      </header>

      {/* Configuración Desplegable General */}
      {mostrarConfig && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-6 text-sm animate-fadeIn shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-indigo-300">Salón:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-xs">Ancho (m):</label>
              <input 
                type="number" 
                value={salon.ancho_metros || 20} 
                onChange={(e) => actualizarSalon(e.target.value, salon.largo_metros)}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-xs">Largo (m):</label>
              <input 
                type="number" 
                value={salon.largo_metros || 15} 
                onChange={(e) => actualizarSalon(salon.ancho_metros, e.target.value)}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-semibold text-indigo-300">Nuevas Mesas (Valores por defecto):</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-xs">Forma:</label>
              <select 
                value={formaDefault} 
                onChange={(e) => {
                  const nuevaForma = e.target.value;
                  setFormaDefault(nuevaForma);
                  if (nuevaForma === 'redonda') setLargoMesaDefault(anchoMesaDefault);
                }}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="redonda">Redonda</option>
                <option value="cuadrada">Cuadrada / Rectangular</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-xs">Capacidad:</label>
              <input 
                type="number" 
                value={capacidadDefault} 
                onChange={(e) => setCapacidadDefault(Number(e.target.value))}
                className="w-12 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center text-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 p-4 gap-4 overflow-hidden relative">
        
        {/* Panel Itsa */}
        <div className="bg-slate-900/60 border border-pink-500/30 rounded-xl p-4 flex flex-col backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="flex justify-between items-center mb-3 border-b border-pink-500/20 pb-2 shrink-0">
            <h2 className="text-base font-semibold text-pink-300 flex items-center gap-2">
              <Users className="w-4 h-4" /> Itsa Pendientes ({invitadosItsa.length})
            </h2>
            <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-medium">Panel Rosa</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-4">Cargando...</p>
            ) : invitadosItsa.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">¡Todos los invitados de Itsa están ubicados!</p>
            ) : (
              invitadosItsa.map((inv) => (
                <div 
                  key={inv.id} 
                  draggable
                  onDragStart={() => setInvitadoArrastrado(inv)}
                  className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center hover:border-pink-500/50 transition-all text-sm cursor-grab active:cursor-grabbing"
                >
                  <div>
                    <p className="font-medium text-slate-200">{inv.nombre_principal}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">{inv.relacion || 'Sin categoría'}</span>
                      <span className="text-[10px] bg-pink-500/10 text-pink-300 px-1.5 py-0.5 rounded font-semibold">
                        {inv.numero_invitados || 1} pases {inv.invitados_extra > 0 ? `(+${inv.invitados_extra} extras)` : ''}
                      </span>
                    </div>
                  </div>
                  {inv.es_padrino === 'S' && <Shield className="w-4 h-4 text-amber-400 shrink-0" title="Padrino/Madrina" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Salón Central */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col relative backdrop-blur-sm shadow-inner overflow-hidden">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800 shrink-0">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-indigo-400" /> Salón Principal ({salon.ancho_metros}m x {salon.largo_metros}m) - {mesas.length} mesas
            </span>
            <button 
              onClick={agregarMesa}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Mesa
            </button>
          </div>
          
          <div className="flex-1 bg-slate-950/50 border border-slate-800/80 rounded-xl overflow-hidden relative">
            {mesas.map((mesa) => {
              const invitadosEnMesa = invitados.filter(i => i.id_mesa === mesa.id);
              const esRedonda = mesa.forma === 'redonda';
              const esPrincipal = mesa.numero_mesa === 0;

              return (
                <div 
                  key={mesa.id} 
                  draggable
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnMesa(e, mesa.id)}
                  onDragEnd={(e) => handleMesaDragEnd(e, mesa.id)}
                  onClick={() => setMesaSeleccionada(mesa)}
                  style={{ 
                    left: `${mesa.pos_x || 40}px`, 
                    top: `${mesa.pos_y || 40}px` 
                  }}
                  title="Haz clic para ver los detalles"
                  className={`absolute bg-slate-900/95 border-2 border-indigo-500/60 flex flex-col items-center justify-center p-2 shadow-2xl hover:border-indigo-400 hover:scale-105 transition-all cursor-pointer group select-none backdrop-blur-sm ${
                    esRedonda ? 'rounded-full w-28 h-28' : 'rounded-2xl w-36 h-24'
                  }`}
                >
                  <div className="absolute -top-2 bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow pointer-events-none">
                    <Move className="w-3 h-3" /> {mesa.nombre_mesa || `Mesa ${mesa.numero_mesa}`}
                  </div>

                  {!esPrincipal && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarMesa(mesa.id, mesa.numero_mesa);
                      }}
                      className="absolute top-2 right-2 bg-rose-600/80 hover:bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow z-10"
                      title="Eliminar mesa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  {esPrincipal ? (
                    <Crown className="w-5 h-5 text-amber-400 mb-1 pointer-events-none" />
                  ) : esRedonda ? (
                    <Disc className="w-6 h-6 text-indigo-400 mb-1 pointer-events-none" />
                  ) : (
                    <Square className="w-5 h-5 text-indigo-400 mb-1 pointer-events-none" />
                  )}

                  <p className="text-xs font-bold text-slate-200 text-center truncate max-w-[100px] pointer-events-none">
                    {invitadosEnMesa.length} / {mesa.capacidad || 10} Asientos
                  </p>

                  <div className="absolute -bottom-2 flex -space-x-1 overflow-hidden pointer-events-none">
                    {invitadosEnMesa.map((inv, idx) => (
                      <div key={idx} className="inline-block w-4 h-4 rounded-full bg-pink-500 text-[8px] text-white flex items-center justify-center font-bold border border-slate-900" title={inv.nombre_principal}>
                        {inv.nombre_principal.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Joel */}
        <div className="bg-slate-900/60 border border-blue-500/30 rounded-xl p-4 flex flex-col backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="flex justify-between items-center mb-3 border-b border-blue-500/20 pb-2 shrink-0">
            <h2 className="text-base font-semibold text-blue-300 flex items-center gap-2">
              <Users className="w-4 h-4" /> Joel Pendientes ({invitadosJoel.length})
            </h2>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-medium">Panel Azul</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-4">Cargando...</p>
            ) : invitadosJoel.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">¡Todos los invitados de Joel están ubicados!</p>
            ) : (
              invitadosJoel.map((inv) => (
                <div 
                  key={inv.id} 
                  draggable
                  onDragStart={() => setInvitadoArrastrado(inv)}
                  className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center hover:border-blue-500/50 transition-all text-sm cursor-grab active:cursor-grabbing"
                >
                  <div>
                    <p className="font-medium text-slate-200">{inv.nombre_principal}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">{inv.relacion || 'Sin categoría'}</span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded font-semibold">
                        {inv.numero_invitados || 1} pases {inv.invitados_extra > 0 ? `(+${inv.invitados_extra} extras)` : ''}
                      </span>
                    </div>
                  </div>
                  {inv.es_padrino === 'S' && <Shield className="w-4 h-4 text-amber-400 shrink-0" title="Padrino/Madrina" />}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal / Panel de Control y Configuración Individual de la Mesa Seleccionada */}
      {mesaSeleccionada && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {mesaSeleccionada.numero_mesa === 0 ? <Crown className="w-5 h-5 text-amber-400" /> : <LayoutGrid className="w-5 h-5 text-indigo-400" />}
                  {mesaSeleccionada.nombre_mesa || `Mesa ${mesaSeleccionada.numero_mesa}`}
                </h3>
                <p className="text-xs text-slate-400">Haz clic para ver los detalles y configurar esta mesa.</p>
              </div>
              <button 
                onClick={() => setMesaSeleccionada(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Configuración de Forma y Dimensiones Individuales */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-indigo-400" /> Forma de la mesa:
                </label>
                <select 
                  value={mesaSeleccionada.forma || 'redonda'} 
                  onChange={(e) => {
                    const nuevaForma = e.target.value;
                    actualizarMesaIndividual(mesaSeleccionada.id, { 
                      forma: nuevaForma, 
                      largo_metros: nuevaForma === 'redonda' ? mesaSeleccionada.ancho_metros : mesaSeleccionada.largo_metros 
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200"
                >
                  <option value="redonda">Redonda</option>
                  <option value="cuadrada">Cuadrada / Rectangular</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Capacidad de asientos:</label>
                <input 
                  type="number"
                  value={mesaSeleccionada.capacidad || 10}
                  onChange={(e) => actualizarMesaIndividual(mesaSeleccionada.id, { capacidad: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 text-center"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Ancho (m):</label>
                <input 
                  type="number"
                  step="0.1"
                  value={mesaSeleccionada.ancho_metros || 1.5}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    actualizarMesaIndividual(mesaSeleccionada.id, { 
                      ancho_metros: val,
                      largo_metros: mesaSeleccionada.forma === 'redonda' ? val : mesaSeleccionada.largo_metros
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 text-center"
                />
              </div>

              {mesaSeleccionada.forma === 'cuadrada' && (
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Largo (m):</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={mesaSeleccionada.largo_metros || 1.5}
                    onChange={(e) => actualizarMesaIndividual(mesaSeleccionada.id, { largo_metros: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 text-center"
                  />
                </div>
              )}
            </div>

            {/* Lista de Invitados Sentados */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                Invitados en esta mesa ({invitados.filter(i => i.id_mesa === mesaSeleccionada.id).length} / {mesaSeleccionada.capacidad || 10}):
              </p>
              {invitados.filter(i => i.id_mesa === mesaSeleccionada.id).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Ningún invitado asignado a esta mesa todavía. Arrastra invitados desde los paneles laterales.</p>
              ) : (
                invitados.filter(i => i.id_mesa === mesaSeleccionada.id).map(inv => (
                  <div key={inv.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{inv.nombre_principal}</p>
                      <span className="text-xs text-pink-400 font-semibold">{inv.numero_invitados || 1} pases {inv.invitados_extra > 0 ? `(+${inv.invitados_extra} extras)` : ''}</span>
                    </div>
                    <button 
                      onClick={() => quitarInvitadoDeMesa(inv.id)}
                      className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Quitar
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setMesaSeleccionada(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors"
              >
                Cerrar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}