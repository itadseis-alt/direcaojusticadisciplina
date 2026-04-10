import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, AlertTriangle, Clock, FileText, Edit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ACTION_CONFIG = {
  registrou: { icon: FileText, color: 'bg-blue-100', iconColor: 'text-blue-600', label: 'registrou o caso' },
  editou: { icon: Edit, color: 'bg-yellow-100', iconColor: 'text-yellow-600', label: 'editou o caso' },
  processou: { icon: CheckCircle, color: 'bg-green-100', iconColor: 'text-green-600', label: 'processou o caso' },
  arquivou: { icon: CheckCircle, color: 'bg-zinc-100', iconColor: 'text-zinc-600', label: 'arquivou o caso' },
  reabriu: { icon: Clock, color: 'bg-orange-100', iconColor: 'text-orange-600', label: 'reabriu o caso' },
  anulou: { icon: AlertTriangle, color: 'bg-red-100', iconColor: 'text-red-600', label: 'anulou o caso' },
  'colocou em processo': { icon: Clock, color: 'bg-blue-100', iconColor: 'text-blue-600', label: 'colocou em processo o caso' },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

export function NotificationBell() {
  const [sanctionNotifs, setSanctionNotifs] = useState([]);
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('acoes');
  const { user } = useAuth();

  const isAdmin = user?.tipo === 'super_admin' || user?.tipo === 'admin';

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const sanctionData = await notificationsApi.getExpiringSanctions();
      setSanctionNotifs(sanctionData.notifications || []);

      if (isAdmin) {
        const adminData = await notificationsApi.getAdminNotifications();
        setAdminNotifs(adminData.notifications || []);
        setUnreadCount(adminData.unread_count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
      setAdminNotifs(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const totalCount = (isAdmin ? unreadCount : 0) + sanctionNotifs.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-none"
          data-testid="notification-bell"
        >
          <Bell className="w-5 h-5" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold flex items-center justify-center rounded-full">
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 rounded-none" align="end">
        <div className="border-b border-zinc-200 p-3">
          <h3 className="font-semibold text-zinc-900 text-sm">Notificações</h3>
        </div>

        {/* Tabs */}
        {isAdmin && (
          <div className="flex border-b border-zinc-200" data-testid="notification-tabs">
            <button
              onClick={() => setTab('acoes')}
              className={`flex-1 text-xs font-medium py-2.5 border-b-2 transition-colors ${
                tab === 'acoes' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
              data-testid="tab-acoes"
            >
              Ações {unreadCount > 0 && <span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{unreadCount}</span>}
            </button>
            <button
              onClick={() => setTab('sancoes')}
              className={`flex-1 text-xs font-medium py-2.5 border-b-2 transition-colors ${
                tab === 'sancoes' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
              data-testid="tab-sancoes"
            >
              Sanções {sanctionNotifs.length > 0 && <span className="ml-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{sanctionNotifs.length}</span>}
            </button>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-zinc-500 text-sm">Carregando...</div>
          ) : (
            <>
              {/* Actions Tab (admin only) */}
              {(tab === 'acoes' && isAdmin) && (
                <>
                  {adminNotifs.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">Nenhuma ação recente</p>
                    </div>
                  ) : (
                    <>
                      {unreadCount > 0 && (
                        <div className="p-2 border-b border-zinc-100 flex justify-end">
                          <button
                            onClick={handleMarkRead}
                            className="text-[11px] text-blue-600 hover:underline"
                            data-testid="mark-all-read"
                          >
                            Marcar todas como lidas
                          </button>
                        </div>
                      )}
                      <div className="divide-y divide-zinc-100">
                        {adminNotifs.map((notif) => {
                          const config = ACTION_CONFIG[notif.action] || ACTION_CONFIG.editou;
                          const Icon = config.icon;
                          return (
                            <Link
                              key={notif.id}
                              to={`/casos/${notif.case_id}`}
                              onClick={() => setOpen(false)}
                              className={`block p-3 hover:bg-zinc-50 transition-colors ${!notif.read ? 'bg-blue-50/40' : ''}`}
                              data-testid={`admin-notif-${notif.id}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-1.5 ${config.color}`}>
                                  <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-zinc-900">
                                    <span className="font-semibold">{notif.actor_name}</span>
                                    {' '}{config.label}
                                  </p>
                                  <p className="text-xs text-zinc-600 mt-0.5 font-mono">
                                    {notif.case_numero} - {notif.case_refere_ao}
                                  </p>
                                  <p className="text-[11px] text-zinc-400 mt-0.5">{timeAgo(notif.created_at)}</p>
                                </div>
                                {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Sanctions Tab (or only tab for non-admin) */}
              {(tab === 'sancoes' || !isAdmin) && (
                <>
                  {sanctionNotifs.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">Nenhuma sanção a vencer</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {sanctionNotifs.map((notification) => (
                        <Link
                          key={notification.id}
                          to={`/casos/${notification.id}`}
                          onClick={() => setOpen(false)}
                          className="block p-3 hover:bg-zinc-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 ${notification.dias_restantes === 0 ? 'bg-red-100' : 'bg-orange-100'}`}>
                              {notification.dias_restantes === 0 ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-orange-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-900 truncate">
                                {notification.refere_ao}
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {notification.posto} - {notification.componente_unidade}
                              </p>
                              <p className="text-xs text-zinc-600 mt-0.5">
                                Sanção: <span className="font-medium">{notification.tipo_sancao}</span>
                              </p>
                              <p className={`text-xs font-semibold mt-0.5 ${
                                notification.dias_restantes === 0 
                                  ? 'text-red-600' 
                                  : notification.dias_restantes <= 2 
                                    ? 'text-orange-600' 
                                    : 'text-yellow-600'
                              }`}>
                                {notification.dias_restantes === 0 
                                  ? 'Termina HOJE!' 
                                  : notification.dias_restantes === 1 
                                    ? 'Termina AMANHÃ' 
                                    : `Termina em ${notification.dias_restantes} dias (${notification.data_fim})`}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {sanctionNotifs.length > 0 && (
                    <div className="border-t border-zinc-200 p-2 bg-zinc-50">
                      <p className="text-[11px] text-zinc-500 text-center">
                        Sanções que terminam serão movidas automaticamente para "Anulado"
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
