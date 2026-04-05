/**
 * Dedicated Axios instance for the FitCheck AI backend.
 * Separate from the old `apiClient` (filmy backend).
 *
 * Auth: uses x-dev-user-id header (Phase 0–C)
 * Phase D: swap to JWT Bearer token from authSlice
 */
import axios from 'axios';
import { ENV } from '@config/env';

export const fitcheckClient = axios.create({
    baseURL: ENV.FITCHECK_API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Dev auth — inject user ID header
// TODO Phase D: replace with JWT from authSlice
fitcheckClient.interceptors.request.use((config) => {
    config.headers['x-dev-user-id'] = ENV.DEV_USER_ID;
    return config;
});

// Unwrap envelope { success, data } → return data directly
fitcheckClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error.response?.data?.error ??
            error.message ??
            'Something went wrong';
        return Promise.reject(new Error(message));
    },
);
