/**
 * useUserRoles - VITE_API_USER_ROLES'a göre kullanıcı rollerini yöneten hook
 *
 * ROL YETKİLERİ:
 * - Admin: Menü Yönetimi, Excel Yükle, Raporlar (tam erişim)
 * - RaporAdmin: Sadece Raporlar
 *
 * @module hooks/useUserRoles
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';

// Hedef proje ismi (.env'den)
const TARGET_PROJECT = import.meta.env.VITE_API_USER_ROLES || 'Yemekhane';

/**
 * useUserRoles - Kullanıcının hedef projedeki rollerini döndürür
 */
export const useUserRoles = () => {
    // Redux store'dan user bilgisini al
    const user = useSelector((state) => state.auth.user);

    /**
     * Hedef projeden rolleri çıkar
     */
    const roles = useMemo(() => {
        if (!user?.projects || !Array.isArray(user.projects)) {
            return [];
        }

        // VITE_API_USER_ROLES'taki proje ismini bul
        const targetProject = user.projects.find(
            (p) => p.projectName?.toLowerCase() === TARGET_PROJECT.toLowerCase()
        );

        if (!targetProject) {
            console.warn(`[useUserRoles] "${TARGET_PROJECT}" projesi bulunamadı.`);
            return [];
        }

        console.log(`[useUserRoles] ${TARGET_PROJECT} rolleri:`, targetProject.roles);
        return targetProject.roles || [];
    }, [user?.projects]);

    /**
     * Admin kontrolü - TAM ERİŞİM
     * Admin: Menü Yönetimi, Excel Yükle, Raporlar
     */
    const isAdmin = useMemo(() => {
        return roles.includes('Admin');
    }, [roles]);

    /**
     * RaporAdmin kontrolü - SADECE RAPORLAR
     */
    const isRaporAdmin = useMemo(() => {
        return roles.includes('RaporAdmin');
    }, [roles]);

    /**
     * Menü yönetimi yetkisi - SADECE Admin
     */
    const canManageMenu = useMemo(() => {
        return isAdmin;
    }, [isAdmin]);

    /**
     * Excel yükleme yetkisi - SADECE Admin
     */
    const canUploadExcel = useMemo(() => {
        return isAdmin;
    }, [isAdmin]);

    /**
     * Raporları görüntüleme yetkisi - Admin VEYA RaporAdmin
     */
    const canViewReports = useMemo(() => {
        return isAdmin || isRaporAdmin;
    }, [isAdmin, isRaporAdmin]);

    /**
     * Herhangi bir yönetim yetkisi var mı
     */
    const hasAnyAdminRole = useMemo(() => {
        return isAdmin || isRaporAdmin;
    }, [isAdmin, isRaporAdmin]);

    /**
     * Belirli bir role sahip mi kontrol et
     */
    const hasRole = (role) => {
        return roles.includes(role);
    };

    /**
     * Belirli rollerden herhangi birine sahip mi
     */
    const hasAnyRole = (checkRoles) => {
        return checkRoles.some((role) => roles.includes(role));
    };

    return {
        roles,
        isAdmin,           // Admin mi?
        isRaporAdmin,      // RaporAdmin mi?
        hasAnyAdminRole,   // Herhangi bir admin rolü var mı?
        canManageMenu,     // Menü Yönetimi yetkisi (SADECE Admin)
        canUploadExcel,    // Excel Yükle yetkisi (SADECE Admin)
        canViewReports,    // Raporlar yetkisi (Admin VEYA RaporAdmin)
        hasRole,
        hasAnyRole,
        targetProject: TARGET_PROJECT,
    };
};

export default useUserRoles;