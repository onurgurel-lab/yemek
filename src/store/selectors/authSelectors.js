/**
 * Auth Selectors - authSlice için ek selector'lar
 *
 * Bu dosyayı authSlice.js dosyasının sonuna ekleyin veya
 * ayrı bir dosya olarak import edin.
 *
 * @module store/selectors/authSelectors
 */

// Hedef proje ismi (.env'den)
const TARGET_PROJECT = import.meta.env.VITE_API_USER_ROLES || 'Yemekhane';

/**
 * Kullanıcının hedef projedeki rollerini seçer
 * @param {Object} state - Redux state
 * @returns {string[]} Roller dizisi
 */
export const selectUserRolesForTargetProject = (state) => {
    const user = state.auth.user;

    if (!user?.projects || !Array.isArray(user.projects)) {
        return [];
    }

    const project = user.projects.find(
        (p) => p.projectName?.toLowerCase() === TARGET_PROJECT.toLowerCase()
    );

    return project?.roles || [];
};

/**
 * Kullanıcının Admin olup olmadığını kontrol eder
 * @param {Object} state - Redux state
 * @returns {boolean}
 */
export const selectIsAdmin = (state) => {
    const roles = selectUserRolesForTargetProject(state);
    return roles.includes('Admin');
};

/**
 * Kullanıcının RaporAdmin/YemekhaneAdmin olup olmadığını kontrol eder
 * @param {Object} state - Redux state
 * @returns {boolean}
 */
export const selectIsYemekhaneAdmin = (state) => {
    const roles = selectUserRolesForTargetProject(state);
    return roles.includes('RaporAdmin') || roles.includes('YemekhaneAdmin');
};

/**
 * Kullanıcının menü yönetim yetkisi olup olmadığını kontrol eder
 * @param {Object} state - Redux state
 * @returns {boolean}
 */
export const selectCanManageMenu = (state) => {
    return selectIsAdmin(state) || selectIsYemekhaneAdmin(state);
};

/**
 * Kullanıcının belirli bir role sahip olup olmadığını kontrol eden factory
 * @param {string} roleName - Kontrol edilecek rol
 * @returns {Function} Selector fonksiyonu
 */
export const makeSelectHasRole = (roleName) => (state) => {
    const roles = selectUserRolesForTargetProject(state);
    return roles.includes(roleName);
};

/**
 * Kullanıcının tüm projelerini seçer
 * @param {Object} state - Redux state
 * @returns {Object[]} Projeler dizisi
 */
export const selectAllProjects = (state) => {
    return state.auth.user?.projects || [];
};

/**
 * Hedef proje adını döndürür
 * @returns {string} Proje adı
 */
export const getTargetProjectName = () => TARGET_PROJECT;