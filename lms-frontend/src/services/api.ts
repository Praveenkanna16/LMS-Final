import type { User, Batch } from '@/types';

// API Base URL
const API_BASE_URL = 'http://localhost:5001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

class ApiService {
  async register(userData: { name: string; email: string; password: string; role: string }): Promise<ApiResponse<any>> {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  async getMyStudents(params?: Record<string, any>): Promise<ApiResponse<any[]>> {
    const q = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null) q.append(k, String(params[k]));
      });
    }
    const query = q.toString() ? `?${q.toString()}` : '';
    return await this.request(`/teacher-management/my/students${query}`);
  }
    async getTeacherDashboard(): Promise<ApiResponse<any>> {
      return await this.request('/teacher/dashboard');
    }
  async getPendingPayouts(): Promise<ApiResponse<any>> {
    return await this.request('/payouts/pending');
  }
  async getAdminDashboard(): Promise<ApiResponse<any>> {
    return await this.request('/admin/dashboard');
  }
  async getAllUsers(): Promise<ApiResponse<any[]>> {
    return await this.request('/users');
  }

  async createLiveSession(data: any): Promise<ApiResponse<any>> {
    return await this.request('/live-classes/create-meeting', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBatch(batchId: string): Promise<ApiResponse<any>> {
    return await this.request(`/batches/${batchId}`, { method: 'DELETE' });
  }

  async updateBatch(batchId: string, data: any): Promise<ApiResponse<any>> {
    return await this.request(`/batches/${batchId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createBatch(data: any): Promise<ApiResponse<any>> {
    // Normalize IDs: accept user objects ({_id, id}) or numeric/string ids and convert to numbers when possible
    const payload = { ...data };
    try {
      if (payload.teacherId && typeof payload.teacherId === 'object') {
        payload.teacherId = payload.teacherId._id || payload.teacherId.id || payload.teacherId;
      }
      // If teacherId looks numeric, convert to Number
      if (typeof payload.teacherId === 'string' && /^\d+$/.test(payload.teacherId)) {
        payload.teacherId = Number(payload.teacherId);
      }

      if (Array.isArray(payload.studentIds)) {
        payload.studentIds = payload.studentIds.map((s: any) => {
          if (s && typeof s === 'object') return s._id || s.id || s;
          if (typeof s === 'string' && /^\d+$/.test(s)) return Number(s);
          return s;
        });
      }
    } catch (err) {
      // Fall back to original data if normalization fails
    }

    return await this.request('/batches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getBatchById(batchId: string): Promise<ApiResponse<any>> {
    return await this.request(`/batches/${batchId}`);
  }

  async checkBatchEnrollmentStatus(batchId: string): Promise<ApiResponse<any>> {
    return await this.request(`/batches/${batchId}/can-enroll`);
  }

  async getCourses(): Promise<ApiResponse<any[]>> {
    return await this.request('/courses');
  }

  async getCourseById(id: string): Promise<ApiResponse<any>> {
    return await this.request(`/courses/${id}`);
  }

  async getPayments(): Promise<ApiResponse<any[]>> {
    return await this.request('/payments');
  }

  // Student Payment Methods
  async createStudentPayment(data: { batchId?: string; courseId?: string; amount?: number }): Promise<ApiResponse<any>> {
    return await this.request('/student/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async getStudentPayments(status?: string): Promise<ApiResponse<any>> {
    const query = status ? `?status=${status}` : '';
    return await this.request(`/student/payments${query}`);
  }

  async getPaymentStatus(orderId: string): Promise<ApiResponse<any>> {
    return await this.request(`/student/payments/status/${orderId}`);
  }

  async retryPayment(paymentId: string): Promise<ApiResponse<any>> {
    return await this.request(`/student/payments/${paymentId}/retry`, {
      method: 'POST',
    });
  }

  async getInvoice(paymentId: string): Promise<ApiResponse<any>> {
    return await this.request(`/student/payments/${paymentId}/invoice`);
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<ApiResponse<any>> {
    return await this.request('/student/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paymentId, signature }),
    });
  }

  async getNotifications(userIdOrParams?: string | Record<string, any>): Promise<ApiResponse<any[]>> {
    // If a string is passed, treat as userId (legacy). If object passed, treat as query params.
    if (typeof userIdOrParams === 'string') {
      const endpoint = userIdOrParams && userIdOrParams !== '' ? `/notifications/${userIdOrParams}` : '/notifications';
      return await this.request(endpoint);
    }

    const params = (userIdOrParams as Record<string, any>) || {};
    const q = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null) q.append(k, String(params[k]));
    });
    const query = q.toString() ? `?${q.toString()}` : '';
    return await this.request(`/notifications${query}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    // Backend expects PUT for marking as read
    return await this.request(`/notifications/${notificationId}/read`, { method: 'PUT' });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    // Backend expects PUT for mark-all-read
    return await this.request('/notifications/mark-all-read', { method: 'PUT' });
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<any>> {
    return await this.request(`/notifications/${notificationId}`, { method: 'DELETE' });
  }

  async getLiveClasses(params: any): Promise<ApiResponse<any>> {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/live-classes?${query}`);
  }

  async joinLiveClass(sessionId: string): Promise<ApiResponse<any>> {
    return await this.request(`/live-classes/${sessionId}/join`, { method: 'POST' });
  }

  async endLiveClass(sessionId: string, recordingUrl: string): Promise<ApiResponse<any>> {
    return await this.request(`/live-classes/${sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify({ recordingUrl }),
    });
  }

  async deleteLiveClass(sessionId: string): Promise<ApiResponse<any>> {
    return await this.request(`/live-classes/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async enrollInCourse(courseId: string): Promise<ApiResponse<any>> {
    return await this.request(`/courses/${courseId}/enroll`, { method: 'POST' });
  }

  async enrollStudentInBatch(studentId: string, batchId: string): Promise<ApiResponse<any>> {
    return await this.request(`/batches/${batchId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    });
  }

  async getAdminStats(): Promise<ApiResponse<any>> {
    return await this.request('/admin/stats');
  }

  // Authentication helpers
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    return await this.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe(): Promise<ApiResponse<any>> {
    return await this.request('/auth/me');
  }
  
  // Student dashboard wrapper used by student pages
  async getStudentDashboardData(): Promise<ApiResponse<any>> {
    // Backend exposes student dashboard at /student/dashboard or /student/dashboard/overview
    // Try overview first, fall back to generic dashboard endpoint
    let res = await this.request('/student/dashboard/overview');
    if (res && (res as any).success === false) {
      res = await this.request('/student/dashboard');
    }
    return res;
  }
  /**
   * Fetch admin analytics data. Optional timeRange parameter (e.g. '7d', '30d')
   */
  async getAdminAnalytics(timeRange?: string): Promise<ApiResponse<any>> {
    // Backend exposes analytics at /api/analytics/admin
    const url = timeRange ? `/analytics/admin?timeRange=${encodeURIComponent(timeRange)}` : '/analytics/admin';
    return await this.request(url);
  }
    async getRecordedContent(): Promise<ApiResponse<any[]>> {
      return await this.request('/recorded-content');
    }
    // Content Library Methods (admin)
    async getContentLibrary(params?: { status?: string; courseId?: string | number; search?: string }): Promise<ApiResponse<any>> {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', String(params.status));
      if (params?.courseId) q.append('courseId', String(params.courseId));
      if (params?.search) q.append('search', String(params.search));
      const query = q.toString() ? `?${q.toString()}` : '';
      return await this.request(`/content-library${query}`);
    }

    async uploadContent(formData: FormData): Promise<ApiResponse<unknown>> {
      // Let fetch set multipart boundaries; do not set Content-Type header here
      const token = localStorage.getItem('genzed_token') || localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        const response = await fetch(`${API_BASE_URL}/content-library/upload`, {
          method: 'POST',
          body: formData,
          headers,
        });
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        if (!response.ok) return ({ success: false, message: data?.message || 'Upload failed' } as unknown) as ApiResponse<unknown>;
        return data as ApiResponse<unknown>;
      } catch (err: any) {
        return ({ success: false, message: err?.message || 'Network error' } as unknown) as ApiResponse<unknown>;
      }
    }

    async approveContent(contentId: string): Promise<ApiResponse<unknown>> {
      return await this.request(`/content-library/${contentId}/approve`, { method: 'POST' });
    }

    async getContentById(contentId: string): Promise<ApiResponse<unknown>> {
      return await this.request(`/content-library/${contentId}`);
    }

    async downloadContent(contentId: string): Promise<ApiResponse<unknown>> {
      // This endpoint returns a downloadUrl in data.downloadUrl or streams if implemented.
      return await this.request(`/content-library/${contentId}/download`, { method: 'POST' });
    }

    async rejectContent(contentId: string, data: { reason: string }): Promise<ApiResponse<unknown>> {
      return await this.request(`/content-library/${contentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    async deleteContent(contentId: string): Promise<ApiResponse<unknown>> {
      return await this.request(`/content-library/${contentId}`, { method: 'DELETE' });
    }

    async updateContent(contentId: string, data: any): Promise<ApiResponse<unknown>> {
      return await this.request(`/content-library/${contentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

  // Teacher Salary Management APIs (Admin)
  async getAllTeachersWithSalaryInfo(params?: { status?: string; page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', String(params.status));
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.search) q.append('search', String(params.search));
    const query = q.toString() ? `?${q.toString()}` : '';
    return await this.request(`/admin/teacher-salaries${query}`);
  }

  async getTeacherPaymentHistory(teacherId: number): Promise<ApiResponse<any>> {
    return await this.request(`/admin/teacher-salaries/${teacherId}/history`);
  }

  async initiateSalaryPayment(data: {
    teacherId: number;
    amount: number;
    month: string;
    year: string;
    description?: string;
    paymentMode?: string;
  }): Promise<ApiResponse<any>> {
    return await this.request('/admin/teacher-salaries/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async markPaymentCompleted(paymentId: number, data: { transactionId: string; note?: string }): Promise<ApiResponse<any>> {
    return await this.request(`/admin/teacher-salaries/${paymentId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async cancelPayment(paymentId: number, data: { reason: string }): Promise<ApiResponse<any>> {
    return await this.request(`/admin/teacher-salaries/${paymentId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async getSalaryStats(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> {
    const q = new URLSearchParams();
    if (params?.startDate) q.append('startDate', String(params.startDate));
    if (params?.endDate) q.append('endDate', String(params.endDate));
    const query = q.toString() ? `?${q.toString()}` : '';
    return await this.request(`/admin/teacher-salaries/stats${query}`);
  }

  async updateTeacherBankAccount(teacherId: number, data: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    branchName?: string;
  }): Promise<ApiResponse<any>> {
    return await this.request(`/admin/teacher-salaries/${teacherId}/bank-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('genzed_token') || localStorage.getItem('token');
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // If we're sending a body and no Content-Type is provided, default to JSON
    // but avoid setting it for FormData (multipart) uploads.
    // This ensures Express' JSON body parser receives the payload correctly.
    try {
      const hasBody = (options as any).body !== undefined && (options as any).body !== null;
      const isFormData = typeof FormData !== 'undefined' && (options as any).body instanceof FormData;
      if (hasBody && !isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    } catch (err) {
      // ignore environment where FormData isn't available or checks fail
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        data = { success: response.ok, message: text || undefined };
      }

      if (!response.ok) {
        return ({ success: false, message: data?.message || data?.error || `Request failed: ${response.status}` } as unknown) as T;
      }

      return data as T;
    } catch (error: any) {
      return ({ success: false, message: error?.message || 'Network error' } as unknown) as T;
    }
  }

  async getMyBatches(): Promise<ApiResponse<Batch[]>> {
    return await this.request('/batches/my-batches');
  }

  async getMyTeacherBatches(): Promise<ApiResponse<Batch[]>> {
    return await this.request('/batches/teacher/my-batches');
  }

    async getAllBatches(): Promise<ApiResponse<Batch[]>> {
    // Return the underlying response - caller will handle shape.
    return await this.request('/batches');
    }

  async createSchedule(scheduleData: {
    batchId: string;
    startTime: string;
    endTime: string;
    topic: string;
    description?: string;
    meetingType?: string;
    meetingLink?: string;
    maxParticipants?: number;
  }): Promise<ApiResponse<any>> {
    const startDate = new Date(scheduleData.startTime);
    const endDate = new Date(scheduleData.endTime);
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));

    return await this.request('/live-classes', {
      method: 'POST',
      body: JSON.stringify({
        batchId: scheduleData.batchId,
        title: scheduleData.topic,
        description: scheduleData.description || '',
        startTime: scheduleData.startTime,
        duration,
        zoomLink: scheduleData.meetingLink || '',
        isRecorded: scheduleData.meetingType === 'recorded',
      }),
    });
  }

  async getTeacherEarnings(): Promise<ApiResponse<any>> {
  // Use the payouts earnings summary endpoint which provides totals, batch earnings and payout history
  return await this.request('/payouts/earnings/summary');
  }

  async requestPayout(payoutData: { amount: number; paymentMethod: string; paymentDetails: any; note?: string }): Promise<ApiResponse<any>> {
  // Backend expects payout requests at /payouts/request
  return await this.request('/payouts/request', {
      method: 'POST',
      body: JSON.stringify(payoutData),
    });
  }

  // Admin: fetch payouts list (optionally filtered by status)
  async getPayouts(status: string = 'all'): Promise<ApiResponse<any>> {
    const q = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return await this.request(`/payouts${q}`);
  }

  async approvePayout(payoutId: string, body?: { note?: string }): Promise<ApiResponse<any>> {
    return await this.request(`/payouts/${payoutId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
  }

  async completePayout(payoutId: string, body?: { transactionId?: string; note?: string }): Promise<ApiResponse<any>> {
    return await this.request(`/payouts/${payoutId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
  }

  async rejectPayout(payoutId: string, body?: { reason?: string }): Promise<ApiResponse<any>> {
    return await this.request(`/payouts/${payoutId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
  }

  // Admin Notifications
  async getAllNotifications(params?: { page?: number; limit?: number; status?: string; type?: string; priority?: string; search?: string }): Promise<ApiResponse<any>> {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.status) q.append('status', String(params.status));
    if (params?.type) q.append('type', String(params.type));
    if (params?.priority) q.append('priority', String(params.priority));
    if (params?.search) q.append('search', String(params.search));
    const query = q.toString() ? `?${q.toString()}` : '';
    return await this.request(`/admin/notifications${query}`);
  }

  async sendNotification(data: { title: string; message: string; type?: string; target?: string; priority?: string; userIds?: string[] }): Promise<ApiResponse<any>> {
    return await this.request('/admin/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  // Teacher notification (allows teachers to send to their students or admins)
  async sendTeacherNotification(data: { title: string; message: string; target?: 'students' | 'admin' | 'specific'; batchId?: string; userIds?: string[] }): Promise<ApiResponse<any>> {
    return await this.request('/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  // Get sent notifications (for teachers/admins to see what they've sent)
  async getSentNotifications(params?: Record<string, any>): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams({ box: 'sent', ...params });
    return await this.request(`/notifications?${queryParams.toString()}`);
  }

  // Teacher Profile APIs
  async getTeacherProfile(): Promise<ApiResponse<any>> {
    return await this.request('/teacher/profile');
  }

  async updateTeacherProfile(data: { name?: string; phone?: string; bio?: string; subjects?: string[]; experience?: string }): Promise<ApiResponse<any>> {
    return await this.request('/teacher/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> {
    return await this.request('/teacher/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  // Get read receipts for a specific notification
  async getNotificationReadReceipts(notificationId: string): Promise<ApiResponse<any>> {
    return await this.request(`/notifications/${notificationId}/receipts`);
  }

  async scheduleNotification(data: { title: string; message: string; type?: string; target?: string; priority?: string; userIds?: string[]; scheduledDate: string }): Promise<ApiResponse<any>> {
    return await this.request('/admin/notifications/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  // admin deleteNotification exists in backups; keep admin deletion separate if needed

  // Data management - Database Viewer
  async getDatabaseTables(): Promise<ApiResponse<any[]>> {
    return await this.request('/admin/data/tables');
  }

  async getTableData(
    tableName: string,
    params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }
  ): Promise<ApiResponse<any>> {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.search) q.append('search', String(params.search));
    if (params?.sortBy) q.append('sortBy', String(params.sortBy));
    if (params?.sortOrder) q.append('sortOrder', String(params.sortOrder));
    const query = q.toString() ? `?${q.toString()}` : '';
    return await this.request(`/admin/data/tables/${tableName}${query}`);
  }
}

export const apiService = new ApiService();
