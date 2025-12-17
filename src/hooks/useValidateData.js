import { useState, useEffect } from 'react'
import { authService } from '@/services/auth'

/**
 * useValidateData - Validate data'sını kullanmak için custom hook
 *
 * localStorage'dan userValidateData'yı okur ve state'e atar.
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
    const [validateData, setValidateData] = useState(null)

    /**
     * loadValidateData - localStorage'dan validate data'yı yükle
     */
    const loadValidateData = () => {
        const data = authService.getValidateData()
        setValidateData(data)
    }

    // Component mount olduğunda yükle
    useEffect(() => {
        loadValidateData()
    }, [])

    /**
     * hasProject - Kullanıcının belirli bir projesi var mı kontrol et
     *
     * @param {string} projectName - Proje adı
     * @returns {boolean}
     */
    const hasProject = (projectName) => {
        if (!validateData?.projects) return false
        return validateData.projects.some(
            project => project.projectName === projectName
        )
    }

    /**
     * hasRole - Kullanıcının belirli bir projede belirli bir rolü var mı
     *
     * @param {string} projectName - Proje adı
     * @param {string} roleName - Rol adı
     * @returns {boolean}
     */
    const hasRole = (projectName, roleName) => {
        if (!validateData?.projects) return false

        const project = validateData.projects.find(
            p => p.projectName === projectName
        )

        if (!project) return false

        return project.roles.includes(roleName)
    }

    /**
     * getProjectRoles - Belirli bir projedeki tüm rolleri al
     *
     * @param {string} projectName - Proje adı
     * @returns {Array<string>} Roller dizisi
     */
    const getProjectRoles = (projectName) => {
        if (!validateData?.projects) return []

        const project = validateData.projects.find(
            p => p.projectName === projectName
        )

        return project?.roles || []
    }

    /**
     * getAllProjects - Tüm projeleri al
     *
     * @returns {Array<Object>} Projeler dizisi
     */
    const getAllProjects = () => {
        return validateData?.projects || []
    }

    /**
     * refresh - Validate data'yı localStorage'dan tekrar yükle
     */
    const refresh = () => {
        loadValidateData()
    }

    return {
        validateData,
        projects: validateData?.projects || [],
        hasProject,
        hasRole,
        getProjectRoles,
        getAllProjects,
        refresh,
    }
}

/**
 * Kullanım Örnekleri:
 *
 * 1. Temel Kullanım:
 * ```javascript
 * const { validateData, projects } = useValidateData()
 *
 * if (validateData) {
 *   console.log('User:', validateData.fullName)
 *   console.log('Projects:', projects)
 * }
 * ```
 *
 * 2. Proje Kontrolü:
 * ```javascript
 * const { hasProject } = useValidateData()
 *
 * if (hasProject('Appointment')) {
 *   // Appointment projesine erişimi var
 * }
 * ```
 *
 * 3. Rol Kontrolü:
 * ```javascript
 * const { hasRole } = useValidateData()
 *
 * if (hasRole('Appointment', 'Admin')) {
 *   // Appointment projesinde Admin rolü var
 *   return <AdminPanel />
 * }
 * ```
 *
 * 4. Proje Rollerini Listele:
 * ```javascript
 * const { getProjectRoles } = useValidateData()
 *
 * const roles = getProjectRoles('Appointment')
 * console.log('Roles:', roles) // ["Doctor", "Admin", ...]
 * ```
 *
 * 5. Tüm Projeleri Listele:
 * ```javascript
 * const { getAllProjects } = useValidateData()
 *
 * const projects = getAllProjects()
 * return (
 *   <ul>
 *     {projects.map(project => (
 *       <li key={project.projectName}>
 *         {project.projectName} - {project.roles.join(', ')}
 *       </li>
 *     ))}
 *   </ul>
 * )
 * ```
 *
 * 6. Koşullu Rendering:
 * ```javascript
 * const Dashboard = () => {
 *   const { hasProject, hasRole } = useValidateData()
 *
 *   return (
 *     <div>
 *       {hasProject('Ticket') && <TicketWidget />}
 *       {hasProject('Appointment') && <AppointmentWidget />}
 *       {hasRole('Appointment', 'Admin') && <AdminSettings />}
 *     </div>
 *   )
 * }
 * ```
 *
 * 7. Data Yenileme:
 * ```javascript
 * const { validateData, refresh } = useValidateData()
 *
 * const handleRefresh = () => {
 *   refresh() // localStorage'dan tekrar yükle
 * }
 * ```
 */

export default useValidateData