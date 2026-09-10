export function exportClientsToCSV(clients, bcvRate = 0) {
  if (!clients || !clients.length) return;

  const headers = [
    'ID Firestore',
    'ID Fijo App',
    'Nombre del Negocio',
    'App Suscrita',
    'Encargado',
    'Cédula / RIF',
    'Teléfono',
    'Dirección',
    'Estado / Región',
    'Tarifa USD',
    'Tarifa Estimada Bs',
    'Próximo Pago / Fin Prueba',
    'Último Pago',
    'Estado'
  ];

  const rows = clients.map(c => {
    let estadoTexto = 'Solvente';
    if (c.suspendido || c.estado_cliente === 'SUSPENDIDO') {
      estadoTexto = 'Suspendido';
    } else if (c.estado_cliente === 'EN_PRUEBA') {
      estadoTexto = `En Prueba (${c.dias_restantes_prueba ?? 0}d restantes)`;
    } else if (c.estado_cliente === 'PRUEBA_VENCIDA') {
      estadoTexto = 'Prueba Vencida (Cobro 1er Mes)';
    } else if (c.estado_cliente === 'MOROSO' || !c.estado_pago) {
      estadoTexto = 'Moroso';
    }

    const proximaFecha = c.estado_cliente === 'EN_PRUEBA' && c.fecha_fin_prueba
      ? new Date(c.fecha_fin_prueba.seconds ? c.fecha_fin_prueba.seconds * 1000 : c.fecha_fin_prueba).toLocaleDateString('es-VE')
      : (c.fecha_proximo_pago ? new Date(c.fecha_proximo_pago.seconds ? c.fecha_proximo_pago.seconds * 1000 : c.fecha_proximo_pago).toLocaleDateString('es-VE') : '');

    return [
      `"${c.id || ''}"`,
      `"${(c.id_externo || '').replace(/"/g, '""')}"`,
      `"${(c.nombre_negocio || '').replace(/"/g, '""')}"`,
      `"${(c.app_suscrita || '').replace(/"/g, '""')}"`,
      `"${(c.encargado || '').replace(/"/g, '""')}"`,
      `"${(c.cedula || '').replace(/"/g, '""')}"`,
      `"${c.telefono || ''}"`,
      `"${(c.direccion || '').replace(/"/g, '""')}"`,
      `"${(c.estado_region || '').replace(/"/g, '""')}"`,
      c.tarifa_base_usd || 0,
      (Number(c.tarifa_base_usd || 0) * Number(bcvRate || 0)).toFixed(2),
      proximaFecha,
      c.fecha_ultimo_pago ? new Date(c.fecha_ultimo_pago.seconds ? c.fecha_ultimo_pago.seconds * 1000 : c.fecha_ultimo_pago).toLocaleDateString('es-VE') : '',
      `"${estadoTexto}"`
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `clientes_crm_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTransactionsToCSV(transactions) {
  if (!transactions || !transactions.length) return;

  const headers = [
    'ID Transacción',
    'ID Cliente',
    'Nombre del Negocio',
    'Fecha Pago',
    'Monto USD',
    'Tasa BCV Aplicada',
    'Monto VES Cobrado',
    'Método de Pago'
  ];

  const rows = transactions.map(t => [
    `"${t.id || ''}"`,
    `"${t.id_cliente || ''}"`,
    `"${(t.nombre_negocio || '').replace(/"/g, '""')}"`,
    t.fecha_pago ? new Date(t.fecha_pago.seconds ? t.fecha_pago.seconds * 1000 : t.fecha_pago).toLocaleString('es-VE') : '',
    t.monto_usd_base || 0,
    t.tasa_bcv_aplicada || 0,
    t.monto_ves_cobrado || 0,
    `"${t.metodo_pago || 'Pago Móvil'}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `transacciones_crm_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
