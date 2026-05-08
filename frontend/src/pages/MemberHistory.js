import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { memberApi } from '@/lib/api';
import { 
  Search, 
  Loader, 
  User,
  FileText,
  History,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MemberHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberHistory, setMemberHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load from URL params
  useEffect(() => {
    const nim = searchParams.get('nim');
    if (nim) {
      loadMemberHistory(nim);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const data = await memberApi.search(searchQuery);
      setSearchResults(data.members || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Auto-search on input change
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadMemberHistory = async (nim) => {
    setLoading(true);
    try {
      const data = await memberApi.getHistory(nim);
      setMemberHistory(data);
      setSelectedMember(nim);
      setSearchParams({ nim });
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectMember = (member) => {
    setSearchQuery(member.nome);
    setSearchResults([]);
    loadMemberHistory(member.nim);
  };

  return (
    <Layout title="Histórico de Membros">
      <div className="space-y-6" data-testid="member-history-view">
        {/* Search */}
        <div className="bg-white border border-zinc-200 p-6">
          <h3 className="text-mono-label text-xs text-zinc-500 mb-4">Buscar Membro</h3>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou NIM..."
                className="pl-10 rounded-none"
                data-testid="member-search-input"
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 shadow-lg z-10 max-h-64 overflow-y-auto">
                  {searchResults.map((member) => (
                    <button
                      key={member.nim}
                      type="button"
                      onClick={() => selectMember(member)}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900">{member.nome}</p>
                          <p className="text-xs text-zinc-500">
                            {member.nim} • {member.posto} • {member.unidade}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-zinc-700">{member.total_casos}</span>
                          <p className="text-xs text-zinc-500">caso(s)</p>
                          {member.total_ne > 0 && (
                            <>
                              <span className="text-sm font-semibold text-indigo-700">{member.total_ne}</span>
                              <p className="text-xs text-zinc-500">notif. ext.</p>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              className="rounded-none bg-zinc-900"
              disabled={searchLoading}
              data-testid="search-btn"
            >
              {searchLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </Button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        )}

        {/* Member History */}
        {!loading && memberHistory && (
          <div className="space-y-6">
            {/* Member Info */}
            <div className="bg-white border border-zinc-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-zinc-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-zinc-900">
                    {memberHistory.cases[0]?.refere_ao || 'Membro'}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    NIM: {memberHistory.nim} • {memberHistory.cases[0]?.posto} • {memberHistory.cases[0]?.componente_unidade}
                  </p>
                </div>
                <div className="text-right">
                  {memberHistory.historico_limpo ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Histórico Limpo</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-black text-zinc-900">{memberHistory.summary.total_casos}</span>
                      <p className="text-xs text-zinc-500">caso(s)</p>
                      {memberHistory.summary.total_notif_externas > 0 && (
                        <>
                          <span className="text-xl font-black text-indigo-700">{memberHistory.summary.total_notif_externas}</span>
                          <p className="text-xs text-zinc-500">notif. externa(s)</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            {!memberHistory.historico_limpo && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-white border border-zinc-200 p-4 text-center">
                  <p className="text-2xl font-black text-[#166534]">{memberHistory.summary.processados}</p>
                  <p className="text-mono-label text-xs text-zinc-500">Processados</p>
                </div>
                <div className="bg-white border border-zinc-200 p-4 text-center">
                  <p className="text-2xl font-black text-[#9A3412]">{memberHistory.summary.pendentes}</p>
                  <p className="text-mono-label text-xs text-zinc-500">Pendentes</p>
                </div>
                <div className="bg-white border border-zinc-200 p-4 text-center">
                  <p className="text-2xl font-black text-[#1E40AF]">{memberHistory.summary.em_processo}</p>
                  <p className="text-mono-label text-xs text-zinc-500">Em Processo</p>
                </div>
                <div className="bg-white border border-zinc-200 p-4 text-center">
                  <p className="text-2xl font-black text-[#3F3F46]">{memberHistory.summary.arquivados}</p>
                  <p className="text-mono-label text-xs text-zinc-500">Arquivados</p>
                </div>
                <div className="bg-white border border-zinc-200 p-4 text-center">
                  <p className="text-2xl font-black text-[#991B1B]">{memberHistory.summary.anulados}</p>
                  <p className="text-mono-label text-xs text-zinc-500">Anulados</p>
                </div>
                <div className="bg-white border border-indigo-200 p-4 text-center">
                  <p className="text-2xl font-black text-indigo-700">{memberHistory.summary.total_notif_externas || 0}</p>
                  <p className="text-mono-label text-xs text-zinc-500">Notif. Externas</p>
                </div>
              </div>
            )}

            {/* Cumulative Sanctions */}
            {memberHistory.summary.total_anos_pena > 0 && (
              <div className="bg-white border border-red-200 p-6">
                <h3 className="text-mono-label text-xs text-zinc-500 mb-4">TOTAL DE PENAS (SOMATÓRIO)</h3>
                <div className="flex items-center gap-6 mb-4">
                  <div>
                    <span className="text-4xl font-black text-red-700">{memberHistory.summary.total_anos_pena}</span>
                    <span className="text-lg text-red-600 ml-2">ano(s)</span>
                  </div>
                  <div className="text-sm text-zinc-600">
                    de {memberHistory.summary.penas_detalhes?.length || 0} caso(s) processado(s)
                  </div>
                </div>
                <div className="space-y-2">
                  {memberHistory.summary.penas_detalhes?.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-zinc-100 pb-2">
                      <span className="font-mono text-zinc-600">{p.caso_numero}</span>
                      <span className="text-zinc-900">{p.tipo_sancao}</span>
                      <span className="font-semibold text-red-700">{p.anos} ano(s)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cases List */}
            {memberHistory.cases.length > 0 ? (
              <div className="bg-white border border-zinc-200">
                <div className="p-4 border-b border-zinc-200 flex items-center gap-2">
                  <History className="w-5 h-5 text-zinc-400" />
                  <h3 className="text-mono-label text-xs text-zinc-500">Histórico de Casos</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Número</th>
                        <th>Tipo de Caso</th>
                        <th>Status</th>
                        <th>Sanção</th>
                        <th>Data Início</th>
                        <th>Data Fim</th>
                        <th>Registrado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberHistory.cases.map((caso) => (
                        <tr key={caso.id}>
                          <td>
                            <Link 
                              to={`/casos/${caso.id}`}
                              className="font-mono text-sm font-semibold text-zinc-900 hover:underline"
                            >
                              {caso.numero}
                            </Link>
                          </td>
                          <td>{caso.tipo_caso}</td>
                          <td><StatusBadge status={caso.status} /></td>
                          <td>{caso.tipo_sancao || '-'}</td>
                          <td className="font-mono text-sm">{caso.data_inicio || '-'}</td>
                          <td className="font-mono text-sm">{caso.data_fim || '-'}</td>
                          <td className="font-mono text-sm text-zinc-500">{caso.data_registo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800">Sem Casos Disciplinares</h3>
                <p className="text-sm text-green-600 mt-1">
                  Este membro não possui casos disciplinares registrados no sistema.
                </p>
              </div>
            )}

            {/* Notificações Externas */}
            {memberHistory.notificacoes_externas && memberHistory.notificacoes_externas.length > 0 && (
              <div className="bg-white border border-indigo-200">
                <div className="p-4 border-b border-indigo-200 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-mono-label text-xs text-zinc-500">Notificações Externas</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>N.º</th>
                        <th>Data Entrada</th>
                        <th>Qualidade</th>
                        <th>Tipo Caso</th>
                        <th>Nu. Nuc</th>
                        <th>Data Apresentação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberHistory.notificacoes_externas.map((ne) => (
                        <tr key={ne.id}>
                          <td>
                            <Link 
                              to={`/notificacoes-externas/${ne.id}`}
                              className="font-mono text-sm font-semibold text-indigo-700 hover:underline"
                            >
                              NE-{ne.numero}
                            </Link>
                          </td>
                          <td>{ne.data_entrada}</td>
                          <td>
                            <span className={`text-xs font-semibold px-2 py-1 border ${
                              ne.qualidade === 'Suspeito' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                              ne.qualidade === 'Arguido' ? 'border-red-300 text-red-700 bg-red-50' :
                              'border-blue-300 text-blue-700 bg-blue-50'
                            }`}>{ne.qualidade}</span>
                          </td>
                          <td>{ne.tipo_caso || '-'}</td>
                          <td className="font-mono text-sm">{ne.nu_nuc || '-'}</td>
                          <td className="font-mono text-sm">{ne.data_apresenta || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !memberHistory && (
          <div className="bg-zinc-50 border border-zinc-200 p-16 text-center">
            <FileText className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-700">Consultar Histórico</h3>
            <p className="text-sm text-zinc-500 mt-2">
              Use a busca acima para encontrar um membro e visualizar seu histórico de casos disciplinares.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
