import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// export const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });
export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login/', { email, password }),
  me: () => api.get('/auth/me/'),
  changePassword: (data: any) => api.post('/auth/change-password/', data),
};

export const dashboardApi = { stats: () => api.get('/dashboard/') };

export const membersApi = {
  list: (params?: any) => api.get('/members/', { params }),
  get: (id: number) => api.get(`/members/${id}/`),
  create: (data: any) => api.post('/members/', data),
  update: (id: number, data: any) => api.patch(`/members/${id}/`, data),
  delete: (id: number) => api.delete(`/members/${id}/`),
  stats: () => api.get('/members/stats/'),
  birthdays: () => api.get('/members/birthdays_this_month/'),
  resendCredentials: (id: number)  => api.post(`/members/${id}/resend_credentials/`),
  locations: () => api.get('/members/locations/'),
};

export const memberDocumentsApi = {
  list: (memberId: number) => api.get(`/members/${memberId}/documents/`),
  upload: (memberId: number, formData: FormData) =>
    api.post(`/members/${memberId}/upload_document/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (memberId: number, docId: number) =>
    api.delete(`/members/${memberId}/delete_document/${docId}/`),
};

export const familiesApi = {
  list: (params?: any) => api.get('/families/', { params }),
  create: (data: any) => api.post('/families/', data),
  update: (id: number, data: any) => api.patch(`/families/${id}/`, data),
  delete: (id: number) => api.delete(`/families/${id}/`),
  resendCredentials: (id: number) => api.post(`/families/${id}/resend_credentials/`),
  members: (id: number) => api.get(`/families/${id}/members/`),
  dashboard: (id: number) => api.get(`/families/${id}/dashboard/`),
  memberDetail: (familyId: number, memberId: number) =>
    api.get(`/families/${familyId}/member-detail/${memberId}/`),
  locations: () => api.get('/families/locations/'),
};

// export const ministriesApi = {
//   list: () => api.get('/ministries/'),
//   create: (data: any) => api.post('/ministries/', data),
//   update: (id: number, data: any) => api.patch(`/ministries/${id}/`, data),
//   delete: (id: number) => api.delete(`/ministries/${id}/`),
// };

// export const ministriesApi = {
//   list:   (params?: any)          => api.get('/ministries/', { params }),
//   get:    (id: number)            => api.get(`/ministries/${id}/`),
//   create: (data: any)             => api.post('/ministries/', data),
//   update: (id: number, data: any) => api.patch(`/ministries/${id}/`, data),
//   delete: (id: number)            => api.delete(`/ministries/${id}/`),
// };

export const ministriesApi = {
  list:   (params?: any)          => api.get('/ministries/', { params }),
  get:    (id: number)            => api.get(`/ministries/${id}/`),
  create: (data: any)             => api.post('/ministries/', data),
  update: (id: number, data: any) => api.patch(`/ministries/${id}/`, data),
  delete: (id: number)            => api.delete(`/ministries/${id}/`),
  members:(id: number)            => api.get(`/ministries/${id}/members/`),
  resendCredentials: (id: number)  => api.post(`/members/${id}/resend_credentials/`),
};

// export const donationsApi = {
//   list: (params?: any) => api.get('/donations/', { params }),
//   create: (data: any) => api.post('/donations/', data),
//   update: (id: number, data: any) => api.patch(`/donations/${id}/`, data),
//   summary: () => api.get('/donations/summary/'),
//   sendReceipt: (id: number) => api.post(`/donations/${id}/send_receipt/`),
// };

// export const donationsApi = {
//     list:   (params?: any)          => api.get('/donations/', { params }),
//     get:    (id: number)            => api.get(`/donations/${id}/`),
//     create: (data: any)             => api.post('/donations/', data),
//     update: (id: number, data: any) => api.patch(`/donations/${id}/`, data),
//     delete: (id: number)            => api.delete(`/donations/${id}/`),
//   };

export const donationsApi = {
    list:   (params?: any)          => api.get('/donations/', { params }),
    get:    (id: number)            => api.get(`/donations/${id}/`),
    create: (data: FormData)        => api.post('/donations/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id: number, data: FormData) => api.patch(`/donations/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id: number)            => api.delete(`/donations/${id}/`),
    stats: (params?: any) => api.get('/donations/stats/', { params }),
 };




export const pledgesApi = {
  list: (params?: any) => api.get('/pledges/', { params }),
  create: (data: any) => api.post('/pledges/', data),
};

// export const expensesApi = {
//   list: (params?: any) => api.get('/expenses/', { params }),
//   create: (data: any) => api.post('/expenses/', data),
//   approve: (id: number) => api.post(`/expenses/${id}/approve/`),
// };


// export const expensesApi = {
//     list:    (params?: any)          => api.get('/expenses/', { params }),
//     get:     (id: number)            => api.get(`/expenses/${id}/`),
//     create:  (data: FormData)        => api.post('/expenses/', data, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     }),
//     update:  (id: number, data: FormData) => api.patch(`/expenses/${id}/`, data, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     }),
//     delete:  (id: number)            => api.delete(`/expenses/${id}/`),
//     approve: (id: number)            => api.post(`/expenses/${id}/approve/`),
// };


export const expensesApi = {
  list:    (params?: any)          => api.get('/expenses/', { params }),
  get:     (id: number)            => api.get(`/expenses/${id}/`),
  create:  (data: FormData)        => api.post('/expenses/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update:  (id: number, data: FormData) => api.patch(`/expenses/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:  (id: number)            => api.delete(`/expenses/${id}/`),

  // Approval workflow
  approve:  (id: number, reason?: string) => api.post(`/expenses/${id}/approve/`, { reason: reason || '' }),
  reject:   (id: number, reason: string)  => api.post(`/expenses/${id}/reject/`, { reason }),
  revert:   (id: number, reason?: string) => api.post(`/expenses/${id}/revert/`, { reason: reason || '' }),
  approvalHistory: (id: number)           => api.get(`/expenses/${id}/approval_history/`),
  approvalSummary: ()                     => api.get('/expenses/approval_summary/'),
  stats: (params?: any) => api.get('/expenses/stats/', { params }),
};

export const fundsApi = {
  list: () => api.get('/funds/'),
  get: (id: number) => api.get(`/funds/${id}/`),
  create: (data: any) => api.post('/funds/', data),
  update: (id: number, data: any) => api.patch(`/funds/${id}/`, data),
  delete: (id: number) => api.delete(`/funds/${id}/`),
  stats: (params?: any) => api.get('/funds/stats/', { params }),
};

// export const eventsApi = {
//   list: (params?: any) => api.get('/events/', { params }),
//   upcoming: () => api.get('/events/upcoming/'),
//   create: (data: any) => api.post('/events/', data),
//   update: (id: number, data: any) => api.patch(`/events/${id}/`, data),
//   delete: (id: number) => api.delete(`/events/${id}/`),
//   attendance: (id: number) => api.get(`/events/${id}/attendance/`),
//   markAttendance: (id: number, data: any) => api.post(`/events/${id}/attendance/`, data),
// };

// export const eventsApi = {
//   list:   (params?: any)          => api.get('/events/', { params }),
//   get:    (id: number)            => api.get(`/events/${id}/`),
//   create: (data: any)             => api.post('/events/', data),
//   update: (id: number, data: any) => api.patch(`/events/${id}/`, data),
//   delete: (id: number)            => api.delete(`/events/${id}/`),
// };

export const eventsApi = {
  list:   (params?: any)          => api.get('/events/', { params }),
  get:    (id: number)            => api.get(`/events/${id}/`),
  create: (data: any)             => api.post('/events/', data),
  update: (id: number, data: any) => api.patch(`/events/${id}/`, data),
  delete: (id: number)            => api.delete(`/events/${id}/`),
  markCompleted: (id: number)            => api.post(`/events/${id}/mark_completed/`),
  markCancelled: (id: number)            => api.post(`/events/${id}/mark_cancelled/`),
  reschedule:    (id: number, data: any) => api.post(`/events/${id}/reschedule/`, data),
};

export const communicationApi = {
  listMessages: () => api.get('/messages/'),
  sendMessage: (data: any) => api.post('/messages/send_quick/', data),
  listAnnouncements: () => api.get('/announcements/'),
  createAnnouncement: (data: any) => api.post('/announcements/', data),
};

export const usersApi = {
  list: (params?: any) => api.get('/users/', { params }),
  create: (data: any) => api.post('/users/', data),
  update: (id: number, data: any) => api.patch(`/users/${id}/`, data),
  delete: (id: number) => api.delete(`/users/${id}/`),
};

export const rolesApi = {
  list:   (params?: any)          => api.get('/roles/', { params }),
  get:    (id: number)            => api.get(`/roles/${id}/`),
  create: (data: any)             => api.post('/roles/', data),
  update: (id: number, data: any) => api.patch(`/roles/${id}/`, data),
  delete: (id: number)            => api.delete(`/roles/${id}/`),
};

export const serviceTypesApi = {
  list:   (params?: any)          => api.get('/service-types/', { params }),
  get:    (id: number)            => api.get(`/service-types/${id}/`),
  create: (data: any)             => api.post('/service-types/', data),
  update: (id: number, data: any) => api.patch(`/service-types/${id}/`, data),
  delete: (id: number)            => api.delete(`/service-types/${id}/`),
};

export const specialEventTypesApi = {
  list:   (params?: any)          => api.get('/special-event-types/', { params }),
  get:    (id: number)            => api.get(`/special-event-types/${id}/`),
  create: (data: any)             => api.post('/special-event-types/', data),
  update: (id: number, data: any) => api.patch(`/special-event-types/${id}/`, data),
  delete: (id: number)            => api.delete(`/special-event-types/${id}/`),
};

export const attendanceApi = {
  // List attendance for one event (uses the ViewSet's filterset_fields=['event'])
  byEvent: (eventId: number) => api.get('/attendance/', { params: { event: eventId } }),

  // Mark someone present
  create: (data: { event: number; member?: number | null; visitor_name?: string; visitor_phone?: string; notes?: string }) =>
    api.post('/attendance/', data),

  // Remove a wrongly-marked attendance record
  delete: (id: number) => api.delete(`/attendance/${id}/`),
};

export const fundTypesApi = {
  list:   (params?: any)          => api.get('/fund-types/', { params }),
  get:    (id: number)            => api.get(`/fund-types/${id}/`),
  create: (data: any)             => api.post('/fund-types/', data),
  update: (id: number, data: any) => api.patch(`/fund-types/${id}/`, data),
  delete: (id: number)            => api.delete(`/fund-types/${id}/`),
};

export const expenseCategoriesApi = {
  list:   (params?: any)          => api.get('/expense-categories/', { params }),
  get:    (id: number)            => api.get(`/expense-categories/${id}/`),
  create: (data: any)             => api.post('/expense-categories/', data),
  update: (id: number, data: any) => api.patch(`/expense-categories/${id}/`, data),
  delete: (id: number)            => api.delete(`/expense-categories/${id}/`),
};




