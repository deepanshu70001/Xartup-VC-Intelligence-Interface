import React, { useState } from 'react';
import { Button, Badge } from '../components/ui/Primitives';
import { User, Mail, MapPin, Building, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { EditProfileModal } from '../components/EditProfileModal';

export default function UserProfilePage() {
  const { user } = useAuth();
  const { activities } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'U';

  // Filter activities for current user (in a real app, backend would filter)
  // Here we just show all since we are in a single-session simulation mostly, 
  // or we can filter by 'You' if we set that in AppContext.
  const userActivities = activities.slice(0, 10); // Show last 10

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 rounded-xl bg-white dark:bg-neutral-900 p-1 transition-colors">
              <div className="w-full h-full rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-3xl font-bold">
                {initials}
              </div>
            </div>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>Edit Profile</Button>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{user?.name}</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Investor</p>
            
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-1">
                <Mail size={16} /> {user?.email}
              </div>
              {user?.company && (
                <div className="flex items-center gap-1">
                  <Building size={16} /> {user.company}
                </div>
              )}
              {user?.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={16} /> {user.location}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm transition-colors">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Focus Areas</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>SaaS</Badge>
              <Badge>Fintech</Badge>
              <Badge>AI/ML</Badge>
              <Badge>DevTools</Badge>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm transition-colors">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-6">
              {userActivities.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">No recent activity.</p>
              ) : (
                userActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-900 dark:text-white">
                        <span className="font-medium">{user?.name || 'You'}</span> {activity.action.toLowerCase()}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{activity.details}</p>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
}
