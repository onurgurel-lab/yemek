import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';

/**
 * useValidateData Hook
 *
 * Component'larda kullanıcının projects, roles ve diğer detaylı bilgilerine
 * erişmek için kullanılır.
 *
 * @returns {Object} Validate data ve yardımcı fonksiyonlar
 * @property {Object|null} validateData - Validate API'den gelen data
 * @property {Array} projects - Kullanıcının projeleri
 * @property {Function} hasProject - Kullanıcının belirli bir projesi var mı
 * @property {Function} hasRole - Kullanıcının belirli bir rolü var mı
 * @property {Function} getProjectRoles - Belirli bir projedeki roller
 * @property {Function} refresh - Validate data'yı yenile
 */
export const useValidateData = () => {
    const [validateData, setValidateData] = useState(null);

    /**
     * loadValidateData - localStorage'dan validate data'yı yükle
     */
    const loadValidateData = () => {
        const data = authService.getValidateData();
        setValidateData(data);
    };

    // Component mount olduğunda yükle
    useEffect(() => {
        loadValidateData();
    }, []);

    /**
     * hasProject - Kullanıcının belirli bir projesi var mı kontrol et
     *
     * @param {string} projectName - Proje adı
     * @returns {boolean}
     */
    const hasProject = (projectName) => {
        if (!validateData?.projects) return false;
        return validateData.projects.some(
            project => project.projectName === projectName
        );
    };

    /**
     * hasRole - Kullanıcının belirli bir projede belirli bir rolü var mı
     *
     * @param {string} projectName - Proje adı
     * @param {string} roleName - Rol adı
     * @returns {boolean}
     */
    const hasRole = (projectName, roleName) => {
        if (!validateData?.projects) return false;

        const project = validateData.projects.find(
            p => p.projectName === projectName
        );

        if (!project) return false;

        return project.roles.includes(roleName);
    };

    /**
     * getProjectRoles - Belirli bir projedeki tüm rolleri al
     *
     * @param {string} projectName - Proje adı
     * @returns {Array<string>} Roller dizisi
     */
    const getProjectRoles = (projectName) => {
        if (!validateData?.projects) return [];

        const project = validateData.projects.find(
            p => p.projectName === projectName
        );

        return project?.roles || [];
    };

    /**
     * getAllProjects - Tüm projeleri al
     *
     * @returns {Array<Object>} Projeler dizisi
     */
    const getAllProjects = () => {
        return validateData?.projects || [];
    };

    /**
     * refresh - Validate data'yı localStorage'dan tekrar yükle
     */
    const refresh = () => {
        loadValidateData();
    };

    return {
        validateData,
        projects: validateData?.projects || [],
        hasProject,
        hasRole,
        getProjectRoles,
        getAllProjects,
        refresh,
    };
};

/**
 * Kullanım Örnekleri:
 *
 * 1. Proje kontrolü:
 * ```jsx
 * const { hasProject } = useValidateData();
 * if (hasProject('Yemekhane')) {
 *   // Yemekhane projesine erişim var
 * }
 * ```
 *
 * 2. Rol kontrolü:
 * ```jsx
 * const { hasRole } = useValidateData();
 * if (hasRole('Yemekhane', 'YemekhaneAdmin')) {
 *   // Admin özelliklerini göster
 * }
 * ```
 *
 * 3. Proje rollerini alma:
 * ```jsx
 * const { getProjectRoles } = useValidateData();
 * const roles = getProjectRoles('Yemekhane');
 * console.log(roles); // ['User', 'YemekhaneAdmin']
 * ```
 */

export default useValidateData;