import { apiClient } from './api';
import type { AttendanceCheckResult, AttendanceStatus } from '@/types';

export const attendanceApi = {
  /** 오늘 출석 여부 + 현재 streak 조회 */
  getStatus: async (): Promise<AttendanceStatus> => {
    const { data } = await apiClient.get<AttendanceStatus>('/credits/attendance/status');
    return data;
  },

  /** 출석 체크 (크레딧 지급) */
  check: async (): Promise<AttendanceCheckResult> => {
    const { data } = await apiClient.post<AttendanceCheckResult>('/credits/attendance/check');
    return data;
  },
};
