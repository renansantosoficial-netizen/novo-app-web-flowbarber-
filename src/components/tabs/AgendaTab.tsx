import React from 'react';
import { motion } from 'framer-motion';
import { useFlowBarber } from '../../context/FlowBarberContext';
import CalendarGrid from '../guias/CalendarGrid';

export default function AgendaTab() {
  const {
    data,
    setData,
    selectedDate,
    setSelectedDate,
    setShowSettingsPopup,
    setSettingsTab,
    setShowSuccessToast,
    openConfirmation,
    setIsCatalogSelectionModalOpen,
    deleteRecord
  } = useFlowBarber();

  return (
    <motion.div
      key="agenda"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <CalendarGrid 
        data={data} 
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate} 
        onShowFolgas={() => { setShowSettingsPopup(true); setSettingsTab('folgas'); }}
        onSetFolgaEspecifica={(date, periodo) => {
          setData(prev => {
            const newFolgas = { ...prev.folgasEspecificas };
            if (periodo) {
              newFolgas[date] = periodo;
            } else {
              delete newFolgas[date];
            }
            return { ...prev, folgasEspecificas: newFolgas };
          });
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 2000);
        }}
        onAddService={() => setIsCatalogSelectionModalOpen(true)}
        onClearMonth={(month, year) => {
          openConfirmation(
            'Limpar Agenda do Mês',
            'Deseja realmente excluir todos os registros financeiros deste mês? Esta ação não pode ser revertida.',
            () => {
              setData(prev => ({
                ...prev,
                historico: prev.historico.filter(r => {
                  const date = new Date(r.data);
                  return !(date.getMonth() === month && date.getFullYear() === year);
                })
              }));
            }
          );
        }}
        onClearDay={(date) => {
          openConfirmation(
            'Limpar Agenda do Dia',
            `Deseja excluir todos os registros do dia ${new Date(date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '')}?`,
            () => {
              setData(prev => ({
                ...prev,
                historico: prev.historico.filter(r => r.data.split('T')[0] !== date)
              }));
            }
          );
        }}
        onDeleteRecord={(id) => {
          openConfirmation(
            'Excluir Registro',
            'Deseja realmente excluir este registro? Esta ação não pode ser revertida.',
            () => deleteRecord(id)
          );
        }}
      />
    </motion.div>
  );
}
