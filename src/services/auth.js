/**
 * auth.js - Authentication Service
 *
 * Login, validate ve logout işlemlerini yönetir.
 * Validate sonucunda VITE_API_USER_ROLES'taki projenin rollerini çıkarır.
 *
 * @module services/auth
 */

import axios from 'axios';
import { API_ENDPOINTS } from '@/constants/api';
import { cookieUtils } from '@/utils/cookies';

// Hedef proje ismi (.env'den)
const TARGET_PROJECT = import.meta.env.VITE_API_USER_ROLES || 'Yemekhane';

/**
 * createFormData - Object'i FormData'ya dönüştürür
 * @param {Object} data - Dönüştürülecek obje
 * @returns {FormData}
 */
const createFormData = (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
    });
    return formData;
};

/**
 * extractUserRoles - Kullanıcının hedef projedeki rollerini çıkarır
 * @param {Array} projects - Kullanıcının projeleri
 * @returns {string[]} Roller dizisi
 */
const extractUserRoles = (projects) => {
    if (!projects || !Array.isArray(projects)) {
        return [];
    }

    const project = projects.find(
        (p) => p.projectName?.toLowerCase() === TARGET_PROJECT.toLowerCase()
    );

    if (!project) {
        console.warn(`[Auth] "${TARGET_PROJECT}" projesi bulunamadı.`);
        return [];
    }

    console.log(`[Auth] ${TARGET_PROJECT} rolleri:`, project.roles);
    return project.roles || [];
};

/**
 * authService - Authentication işlemleri
 */
export const authService = {
    /**
     * login - Kullanıcı giriş işlemi
     *
     * @param {Object} credentials - { username, password }
     * @returns {Promise<Object>} User data ve token
     */
    async login(credentials) {
        try {
            console.log('🔄 Logging in...');

            const formData = createFormData(credentials);

            const response = await axios.post(
                API_ENDPOINTS.LOGIN,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data.isSuccess) {
                const result = response.data.result;

                // Token'ı validate et ve user bilgilerini al
                const validatedUser = await this.validateToken(result.token);

                if (validatedUser) {
                    // Cookie'ye kaydet
                    const authCookieData = {
                        authenticateResult: true,
                        authToken: result.token,
                        userName: result.userName,
                        accessTokenExpireDate: result.expirationDate,
                        user: validatedUser
                    };

                    cookieUtils.setAuthCookie(authCookieData);

                    console.log('✅ Login successful');
                    console.log('📋 User roles:', validatedUser.roles);

                    // Redux store için response
                    return {
                        user: validatedUser,
                        accessToken: result.token,
                        expirationDate: result.expirationDate,
                    };
                } else {
                    // Validate başarısız olsa bile login bilgileriyle devam et
                    const userData = {
                        id: result.id,
                        fullName: result.fullName,
                        username: result.userName,
                        email: result.email,
                        phoneNumber: result.phoneNumber,
                        profilePhoto: result.profilePhoto || null,
                        employeeId: result.employeeId,
                        projects: [],
                        roles: [],
                    };

                    const authCookieData = {
                        authenticateResult: true,
                        authToken: result.token,
                        userName: result.userName,
                        accessTokenExpireDate: result.expirationDate,
                        user: userData
                    };

                    cookieUtils.setAuthCookie(authCookieData);

                    console.log('✅ Login successful (without validation)');

                    return {
                        user: userData,
                        accessToken: result.token,
                        expirationDate: result.expirationDate,
                    };
                }
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('❌ Login error:', error.message);
            if (error.response) {
                throw new Error(error.response.data?.message || 'Login failed');
            }
            throw error;
        }
    },

    /**
     * validateToken - Token'ı validate et
     *
     * ✅ User bilgilerini + hedef projenin rollerini döndür
     *
     * @param {string} token - JWT token
     * @returns {Promise<Object|null>} User data veya null
     */
    async validateToken(token) {
        try {
            console.log('🔄 Validating token...');

            const formData = createFormData({ token });

            const response = await axios.post(
                API_ENDPOINTS.VALIDATE,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data.isSuccess) {
                const result = response.data.result;

                // Hedef projeden rolleri çıkar
                const roles = extractUserRoles(result.projects);

                console.log('✅ Token validated successfully');

                // User data + projects + roles döndür
                return {
                    id: result.id,
                    fullName: result.fullName,
                    username: result.username,
                    email: result.email,
                    phoneNumber: result.phoneNumber,
                    profilePhoto: result.profilePhoto,
                    employeeId: result.employeeId,
                    projects: result.projects || [],
                    // Hedef projenin rollerini ekle
                    roles: roles,
                };
            } else {
                console.error('❌ Token validation failed:', response.data.message);
                return null;
            }
        } catch (error) {
            console.error('❌ Validate token error:', error.message);
            return null;
        }
    },

    /**
     * logout - Kullanıcı çıkış işlemi
     * @returns {Promise<boolean>}
     */
    async logout() {
        try {
            cookieUtils.clearAuthCookie();
            console.log('✅ Logout successful');
            return true;
        } catch (error) {
            console.error('❌ Logout error:', error.message);
            // Hata olsa bile cookie'yi temizle
            cookieUtils.clearAuthCookie();
            return true;
        }
    },

    /**
     * refreshToken - Token yenileme işlemi
     * @returns {Promise<Object>}
     */
    async refreshToken() {
        const authCookie = cookieUtils.getAuthCookie();

        if (!authCookie?.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const formData = createFormData({ refreshToken: authCookie.refreshToken });

            const response = await axios.post(
                API_ENDPOINTS.REFRESH_TOKEN,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data.isSuccess) {
                const newToken = response.data.result.token;

                // Cookie'yi güncelle
                cookieUtils.updateToken(
                    newToken,
                    response.data.result.expirationDate
                );

                console.log('✅ Token refreshed');
            }

            return response.data;
        } catch (error) {
            console.error('❌ Refresh token error:', error.message);
            throw error;
        }
    },

    /**
     * getCurrentUser - Cookie'den user bilgilerini al
     * @returns {Object|null}
     */
    getCurrentUser() {
        const authCookie = cookieUtils.getAuthCookie();
        return authCookie?.user || null;
    },

    /**
     * getCurrentUserRoles - Cookie'den user rollerini al
     * @returns {string[]}
     */
    getCurrentUserRoles() {
        const user = this.getCurrentUser();
        return user?.roles || [];
    },

    /**
     * isAdmin - Admin kontrolü
     * @returns {boolean}
     */
    isAdmin() {
        const roles = this.getCurrentUserRoles();
        return roles.includes('Admin');
    },

    /**
     * isYemekhaneAdmin - RaporAdmin/YemekhaneAdmin kontrolü
     * @returns {boolean}
     */
    isYemekhaneAdmin() {
        const roles = this.getCurrentUserRoles();
        return roles.includes('RaporAdmin') || roles.includes('YemekhaneAdmin');
    },

    /**
     * canManageMenu - Menü yönetim yetkisi kontrolü
     * @returns {boolean}
     */
    canManageMenu() {
        return this.isAdmin() || this.isYemekhaneAdmin();
    },

    /**
     * hasRole - Belirli role sahip mi kontrolü
     * @param {string} role - Kontrol edilecek rol
     * @returns {boolean}
     */
    hasRole(role) {
        const roles = this.getCurrentUserRoles();
        return roles.includes(role);
    },

    /**
     * decodeToken - JWT token'ı decode et
     * @param {string} token - JWT token
     * @returns {Object|null}
     */
    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Token decode error:', error);
            return null;
        }
    },

    /**
     * getValidateData - localStorage'dan validate data'yı al
     * @returns {Object|null}
     */
    getValidateData() {
        const authCookie = cookieUtils.getAuthCookie();
        return authCookie?.user || null;
    },

    /**
     * getTargetProject - Hedef proje ismini döndür
     * @returns {string}
     */
    getTargetProject() {
        return TARGET_PROJECT;
    },
};

export default authService;