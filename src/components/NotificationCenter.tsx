import React, { useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from './ui/Primitives';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Enrichment Complete',
    message: 'Successfully enriched data for Vercel.',
    time: '2m ago',
    read: false,
    type: 'success'
  },
  {
    id: '2',
    title: 'New Signal Detected',
    message: 'Linear has posted 3 new engineering roles.',
    time: '1h ago',
    read: false,
    type: 'info'
  },
  {
    id: '3',
    title: 'List Exported',
    message: 'Your "SaaS Targets" list has been exported.',
    time: '3h ago',
    read: true,
    type: 'info'
  }
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button 
        className="p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900" />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={cn(
                        "p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors relative group",
                        !notification.read && "bg-indigo-50/30 dark:bg-indigo-900/10"
                      )}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <h4 className={cn("text-sm font-medium text-neutral-900 dark:text-white", !notification.read && "text-indigo-900 dark:text-indigo-100")}>
                            {notification.title}
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {notification.message}
                          </p>
                          <span className="text-[10px] text-neutral-400 mt-2 block">
                            {notification.time}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
