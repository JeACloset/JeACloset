import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Save, X, Lightbulb, Bug, Search, Filter, ArrowUpDown, Sparkles } from 'lucide-react';
import ViewerAlert from './ViewerAlert';
import { useFirestore } from '../hooks/useFirestore';
import type { Note } from '../types';

export default function Notes() {
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'priority' | 'status'>('recent');
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general' as Note['type'],
    priority: 'medium' as Note['priority'],
    status: 'open' as Note['status'],
    relatedTab: 'sales' as Note['relatedTab']
  });
  const [filterType, setFilterType] = useState<'all' | Note['type']>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | Note['status']>('all');
  
  // Estados para alerta do visualizador
  const [showViewerAlert, setShowViewerAlert] = useState(false);
  const [viewerAlertAction, setViewerAlertAction] = useState('');

  // Hook do Firebase para anotações
  const { data: notes, add, update, remove } = useFirestore<Note>('notes');

  // Função para detectar se é visualizador
  const isViewer = () => {
    try {
      const user = localStorage.getItem('JEACLOSET_user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.role === 'viewer';
      }
      return false;
    } catch {
      return false;
    }
  };

  // Função para mapear nomes das abas para português
  const getTabName = (tabId: string) => {
    const tabNames: { [key: string]: string } = {
      'clothing': 'Cadastrar Peças',
      'inventory': 'Gerenciar Estoque',
      'sales': 'Registrar Vendas',
      'history': 'Histórico',
      'reports': 'Relatórios',
      'investments': 'Investimentos',
      'cashflow': 'Fluxo de Caixa',
      'notes': 'Anotações',
      'account': 'Conta'
    };
    return tabNames[tabId] || tabId;
  };

  // Função para mostrar alerta do visualizador
  const showViewerAlertForAction = (action: string) => {
    setViewerAlertAction(action);
    setShowViewerAlert(true);
  };

  // Detectar role atual
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('JEACLOSET_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        setIsAdmin(user?.role === 'admin');
      }
    } catch {}
  }, []);

  // Função para adicionar anotação
  const handleAddNote = async () => {
    console.log('handleAddNote chamada');
    
    if (isViewer()) {
      showViewerAlertForAction('criar anotação');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Preencha todos os campos!');
      return;
    }

    try {
      console.log('Tentando adicionar anotação no Firebase...');
      await add({
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        relatedTab: formData.relatedTab,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Anotação adicionada com sucesso!');
      setFormData({
        title: '',
        content: '',
        type: 'general',
        priority: 'medium',
        status: 'open',
        relatedTab: 'sales'
      });
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao adicionar anotação:', error);
      alert('Erro ao adicionar anotação. Tente novamente.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulário submetido:', formData);
    
    if (isViewer()) {
      showViewerAlertForAction('criar ou editar anotações');
      return;
    }
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Título e conteúdo são obrigatórios!');
      return;
    }
    if (!formData.relatedTab) {
      alert('Informe a aba relacionada à anotação.');
      return;
    }

    console.log('Chamando função de adicionar/atualizar...');
    if (editingNote) {
      handleUpdateNote();
    } else {
      handleAddNote();
    }
  };

  // Função para atualizar anotação
  const handleUpdateNote = async () => {
    if (!editingNote) return;

    try {
      const nextStatus = isAdmin ? formData.status : editingNote.status;
      await update(editingNote.id, {
        ...formData,
        status: nextStatus
      });
      
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        type: 'general',
        priority: 'medium',
        status: 'open',
        relatedTab: 'sales'
      });
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao atualizar anotação:', error);
      alert('Erro ao atualizar anotação. Tente novamente.');
    }
  };

  // Função para deletar anotação
  const handleDeleteNote = async (id: string) => {
    if (isViewer()) {
      showViewerAlertForAction('deletar anotação');
      return;
    }

    if (window.confirm('Tem certeza que deseja deletar esta anotação?')) {
      try {
        await remove(id);
      } catch (error) {
        console.error('Erro ao deletar anotação:', error);
        alert('Erro ao deletar anotação. Tente novamente.');
      }
    }
  };

  // Função para editar anotação
  const handleEditNote = (note: Note) => {
    if (isViewer()) {
      showViewerAlertForAction('editar anotação');
      return;
    }

    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      type: note.type,
      priority: note.priority,
      status: note.status,
      relatedTab: note.relatedTab
    });
    setShowForm(true);
  };


  // Função para criar nova anotação
  const handleCreateNote = () => {
    if (isViewer()) {
      showViewerAlertForAction('criar anotação');
      return;
    }

    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      type: 'general',
      priority: 'medium',
      status: 'open',
      relatedTab: 'sales'
    });
    setShowForm(true);
  };

  // Função para fechar formulário
  const handleCloseForm = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      type: 'general',
      priority: 'medium',
      status: 'open',
      relatedTab: 'sales'
    });
    setShowForm(false);
  };


  const getTypeIcon = (type: Note['type']) => {
    switch (type) {
      case 'problem': return <Bug className="h-4 w-4" />;
      case 'improvement': return <Lightbulb className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: Note['type']) => {
    switch (type) {
      case 'problem': return 'text-red-600 bg-red-100';
      case 'improvement': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityColor = (priority: Note['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getStatusColor = (status: Note['status']) => {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredNotes = notes.filter(note => {
    const typeMatch = filterType === 'all' || note.type === filterType;
    const statusMatch = filterStatus === 'all' || note.status === filterStatus;
    const searchMatch = [note.title, note.content].join(' ').toLowerCase().includes(search.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  });

  const sortedBase = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'recent') {
      const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
      const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    }
    if (sortBy === 'priority') {
      const order = { high: 3, medium: 2, low: 1 } as const;
      return order[b.priority] - order[a.priority];
    }
    // status
    const orderS = { open: 3, in_progress: 2, resolved: 1 } as const;
    return orderS[b.status] - orderS[a.status];
  });
  const sortedNotes = [
    ...sortedBase.filter(n => n.status !== 'resolved'),
    ...sortedBase.filter(n => n.status === 'resolved'),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg mr-3 shadow">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    Anotações <Sparkles className="h-5 w-5 text-purple-500" />
                  </h2>
                  <p className="text-sm text-gray-600">Registre problemas, ideias e decisões por aba</p>
                </div>
              </div>
              <button
                onClick={handleCreateNote}
                className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Anotação
              </button>
            </div>

            {/* Barra de busca e ordenação */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por título ou conteúdo..."
                  className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border-2 border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex items-center w-full sm:w-auto"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="priority">Por prioridade</option>
                  <option value="status">Por status</option>
                </select>
                <ArrowUpDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border bg-gradient-to-br from-purple-50 to-white">
                <div className="text-xs text-gray-600">Total</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">{notes.length}</div>
              </div>
              <div className="p-3 rounded-xl border bg-gradient-to-br from-yellow-50 to-white">
                <div className="text-xs text-gray-600">Abertas</div>
                <div className="text-lg sm:text-xl font-bold text-yellow-700">{notes.filter(n => n.status === 'open').length}</div>
              </div>
              <div className="p-3 rounded-xl border bg-gradient-to-br from-blue-50 to-white">
                <div className="text-xs text-gray-600">Em Andamento</div>
                <div className="text-lg sm:text-xl font-bold text-blue-700">{notes.filter(n => n.status === 'in_progress').length}</div>
              </div>
              <div className="p-3 rounded-xl border bg-gradient-to-br from-green-50 to-white">
                <div className="text-xs text-gray-600">Resolvidas</div>
                <div className="text-lg sm:text-xl font-bold text-green-700">{notes.filter(n => n.status === 'resolved').length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Todos</option>
                <option value="problem">Problemas</option>
                <option value="improvement">Melhorias</option>
                <option value="general">Geral</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Todos</option>
                <option value="open">Aberto</option>
                <option value="in_progress">Em Andamento</option>
                <option value="resolved">Resolvido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Anotações */}
        <div className="space-y-4">
          {sortedNotes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma anotação encontrada</h3>
              <p className="text-gray-600">Crie sua primeira anotação para começar!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sortedNotes.map(note => (
              <div key={note.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 hover:shadow-2xl transition-all group">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getTypeColor(note.type)}`}>
                        {getTypeIcon(note.type)}
                        {note.type === 'problem' ? 'Problema' : note.type === 'improvement' ? 'Melhoria' : 'Geral'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(note.priority)}`}>
                        {note.priority === 'high' ? 'Alta' : note.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                        {note.status === 'open' ? 'Aberto' : note.status === 'in_progress' ? 'Em Andamento' : 'Resolvido'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-700 break-words">{note.title}</h3>
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{note.content}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Aba relacionada: <span className="font-medium text-red-600 underline">{getTabName(note.relatedTab)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 border-t pt-3">
                  {(() => {
                    const createdAt = note.createdAt instanceof Date ? note.createdAt : new Date(note.createdAt);
                    const updatedAt = note.updatedAt instanceof Date ? note.updatedAt : new Date(note.updatedAt);
                    return (
                      <>
                        Criado em {createdAt.toLocaleDateString('pt-BR')} às {createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {updatedAt.getTime() !== createdAt.getTime() && (
                          <span> • Atualizado em {updatedAt.toLocaleDateString('pt-BR')} às {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Modal de Formulário */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">
                    {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
                  </h3>
                  <button
                    onClick={handleCloseForm}
                    className="p-2 text-white/80 hover:text-white rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 sm:px-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Digite o título da anotação"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo *</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 sm:px-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none"
                      placeholder="Descreva o problema ou melhoria..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Note['type'] }))}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      >
                        <option value="general">Geral</option>
                        <option value="problem">Problema</option>
                        <option value="improvement">Melhoria</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Note['priority'] }))}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {isAdmin ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Note['status'] }))}
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        >
                          <option value="open">Aberto</option>
                          <option value="in_progress">Em Andamento</option>
                          <option value="resolved">Resolvido</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <input
                          value="Aberto"
                          readOnly
                          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600 text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Aba Relacionada</label>
                      <select
                        value={formData.relatedTab}
                        onChange={(e) => setFormData(prev => ({ ...prev, relatedTab: e.target.value as Note['relatedTab'] }))}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      >
                        <option value="clothing">Cadastrar Peças</option>
                        <option value="inventory">Gerenciar Estoque</option>
                        <option value="sales">Registrar Vendas</option>
                        <option value="history">Histórico</option>
                        <option value="reports">Relatórios</option>
                        <option value="investments">Investimentos</option>
                        <option value="cashflow">Fluxo de Caixa</option>
                        <option value="notes">Anotações</option>
                        <option value="account">Conta</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingNote ? 'Atualizar' : 'Salvar'}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        )}
        
        {/* Alerta para Visualizador */}
        <ViewerAlert
          isVisible={showViewerAlert}
          onClose={() => setShowViewerAlert(false)}
          action={viewerAlertAction}
        />
      </div>
    </div>
  );
}
