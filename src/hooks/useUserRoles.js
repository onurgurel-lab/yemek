/**
 * useUserRoles - VITE_API_USER_ROLES'a göre kullanıcı rollerini yöneten hook
 *
 * Validate API'den dönen projects dizisinden, .env'deki VITE_API_USER_ROLES
 * değerine göre ilgili projenin rollerini çıkarır.
 *
 * @module hooks/useUserRoles
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';

// Hedef proje ismi (.env'den)
const TARGET_PROJECT = import.meta.env.VITE_API_USER_ROLES || 'Yemekhane';

/**
 * useUserRoles - Kullanıcının hedef projedeki rollerini döndürür
 *
 * @returns {Object} Rol bilgileri ve yardımcı fonksiyonlar
 * @property {string[]} roles - Kullanıcının rolleri
 * @property {boolean} isAdmin - Admin rolü var mı
 * @property {boolean} isYemekhaneAdmin - YemekhaneAdmin rolü var mı (RaporAdmin)
 * @property {boolean} canManageMenu - Menü yönetim yetkisi var mı
 * @property {Function} hasRole - Belirli role sahip mi
 * @property {Object[]} adminMenuItems - Admin menü öğeleri
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
     * Admin kontrolü
     */
    const isAdmin = useMemo(() => {
        return roles.includes('Admin');
    }, [roles]);

    /**
     * YemekhaneAdmin (RaporAdmin) kontrolü
     */
    const isYemekhaneAdmin = useMemo(() => {
        return roles.includes('RaporAdmin') || roles.includes('YemekhaneAdmin');
    }, [roles]);

    /**
     * Menü yönetim yetkisi kontrolü
     * Admin veya RaporAdmin/YemekhaneAdmin rolü olanlar yönetebilir
     */
    const canManageMenu = useMemo(() => {
        return isAdmin || isYemekhaneAdmin;
    }, [isAdmin, isYemekhaneAdmin]);

    /**
     * Belirli bir role sahip mi kontrol et
     * @param {string} role - Kontrol edilecek rol
     * @returns {boolean}
     */
    const hasRole = (role) => {
        return roles.includes(role);
    };

    /**
     * Belirli rollerden herhangi birine sahip mi
     * @param {string[]} checkRoles - Kontrol edilecek roller
     * @returns {boolean}
     */
    const hasAnyRole = (checkRoles) => {
        return checkRoles.some((role) => roles.includes(role));
    };

    /**
     * Admin menü öğeleri
     * Sadece Admin veya RaporAdmin rolü varsa döner
     */
    const adminMenuItems = useMemo(() => {
        if (!canManageMenu) return [];

        return [
            {
                key: '/yemekhane/yonetim',
                path: '/yemekhane/yonetim',
                label: 'Menü Yönetimi',
                icon: 'EditOutlined',
            },
            {
                key: '/yemekhane/excel-yukle',
                path: '/yemekhane/excel-yukle',
                label: 'Excel Yükle',
                icon: 'UploadOutlined',
            },
            {
                key: '/yemekhane/raporlar',
                path: '/yemekhane/raporlar',
                label: 'Raporlar',
                icon: 'BarChartOutlined',
            },
        ];
    }, [canManageMenu]);

    return {
        roles,
        isAdmin,
        isYemekhaneAdmin,
        canManageMenu,
        hasRole,
        hasAnyRole,
        adminMenuItems,
        targetProject: TARGET_PROJECT,
    };
};

export default useUserRoles;

/**
 * Kullanım Örnekleri:
 *
 * 1. Basit kullanım:
 * ```jsx
 * import { useUserRoles } from '@/hooks/useUserRoles';
 *
 * function MyComponent() {
 *   const { roles, isAdmin, canManageMenu } = useUserRoles();
 *
 *   return (
 *     <div>
 *       <p>Roller: {roles.join(', ')}</p>
 *       {isAdmin && <p>Admin yetkiniz var!</p>}
 *       {canManageMenu && <Button>Menü Yönetimi</Button>}
 *     </div>
 *   );
 * }
 * ```
 *
 * 2. Admin menüleri gösterme:
 * ```jsx
 * function Sidebar() {
 *   const { adminMenuItems, canManageMenu } = useUserRoles();
 *
 *   return (
 *     <Menu>
 *       <Menu.Item key="home">Ana Sayfa</Menu.Item>
 *
 *       {canManageMenu && (
 *         <Menu.SubMenu title="Yönetim">
 *           {adminMenuItems.map(item => (
 *             <Menu.Item key={item.key}>
 *               <Link to={item.path}>{item.label}</Link>
 *             </Menu.Item>
 *           ))}
 *         </Menu.SubMenu>
 *       )}
 *     </Menu>
 *   );
 * }
 * ```
 *
 * 3. Rol kontrolü:
 * ```jsx
 * function SecurePage() {
 *   const { hasRole, hasAnyRole } = useUserRoles();
 *
 *   if (!hasAnyRole(['Admin', 'RaporAdmin'])) {
 *     return <Navigate to="/unauthorized" />;
 *   }
 *
 *   return <AdminPanel />;
 * }
 * ```
 */