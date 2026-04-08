import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '@/lib/api';
import { Bell, AlertTriangle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getExpiringSanctions();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasNotifications = notifications.length > 0;

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
          {hasNotifications && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold flex items-center justify-center rounded-full">
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 rounded-none" align="end">
        <div className="border-b border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Notificações</h3>
            {hasNotifications && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 font-medium">
                {notifications.length} sanções a vencer
              </span>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-zinc-500">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={`/casos/${notification.id}`}
                  onClick={() => setOpen(false)}
                  className="block p-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 ${notification.dias_restantes === 0 ? 'bg-red-100' : 'bg-orange-100'}`}>
                      {notification.dias_restantes === 0 ? (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {notification.refere_ao}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {notification.posto} • {notification.componente_unidade}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">
                        Sanção: <span className="font-medium">{notification.tipo_sancao}</span>
                      </p>
                      <p className={`text-xs font-semibold mt-1 ${
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
        </div>

        {hasNotifications && (
          <div className="border-t border-zinc-200 p-3 bg-zinc-50">
            <p className="text-xs text-zinc-500 text-center">
              Sanções que terminam nos próximos 5 dias serão movidas automaticamente para "Anulado"
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
