import { useSelector } from 'react-redux'
import { selectUserProjects, selectUserRolesForProject, selectHasRole } from '@/store/slices/authSlice'

/**
 * useUserProjects - Kullanıcının proje ve rol bilgilerine erişim hook'u
 *
 * Kullanım örnekleri için dosya sonuna bakın
 */
export const useUserProjects = () => {
    const projects = useSelector(selectUserProjects)

    /**
     * Belirli bir projedeki rolleri döndürür
     * @param {string} projectName - Proje adı (örn: "Postop", "Ticket")
     * @returns {string[]} Roller dizisi
     */
    const getRolesForProject = (projectName) => {
        const project = projects.find(p => p.projectName === projectName)
        return project?.roles || []
    }

    /**
     * Kullanıcının belirli bir rolü olup olmadığını kontrol eder
     * @param {string} projectName - Proje adı
     * @param {string} roleName - Rol adı (örn: "Admin", "StandardUser")
     * @returns {boolean}
     */
    const hasRole = (projectName, roleName) => {
        const roles = getRolesForProject(projectName)
        return roles.includes(roleName)
    }

    /**
     * Kullanıcının belirli bir projede Admin olup olmadığını kontrol eder
     * @param {string} projectName - Proje adı
     * @returns {boolean}
     */
    const isAdminInProject = (projectName) => {
        return hasRole(projectName, 'Admin')
    }

    /**
     * Kullanıcının belirli rollerden herhangi birine sahip olup olmadığını kontrol eder
     * @param {string} projectName - Proje adı
     * @param {string[]} roleNames - Rol adları dizisi
     * @returns {boolean}
     */
    const hasAnyRole = (projectName, roleNames) => {
        const roles = getRolesForProject(projectName)
        return roleNames.some(roleName => roles.includes(roleName))
    }

    /**
     * Kullanıcının tüm rollerine sahip olup olmadığını kontrol eder
     * @param {string} projectName - Proje adı
     * @param {string[]} roleNames - Rol adları dizisi
     * @returns {boolean}
     */
    const hasAllRoles = (projectName, roleNames) => {
        const roles = getRolesForProject(projectName)
        return roleNames.every(roleName => roles.includes(roleName))
    }

    /**
     * Kullanıcının belirli bir projeye erişimi olup olmadığını kontrol eder
     * @param {string} projectName - Proje adı
     * @returns {boolean}
     */
    const hasAccessToProject = (projectName) => {
        return projects.some(p => p.projectName === projectName)
    }

    return {
        projects,
        getRolesForProject,
        hasRole,
        isAdminInProject,
        hasAnyRole,
        hasAllRoles,
        hasAccessToProject,
    }
}

/**
 * ============================================
 * KULLANIM ÖRNEKLERİ
 * ============================================
 */

/**
 * Örnek 1: Basit kullanım - Tüm projeleri listele
 *
 * ```jsx
 * function ProjectList() {
 *   const { projects } = useUserProjects()
 *
 *   return (
 *     <ul>
 *       {projects.map(project => (
 *         <li key={project.projectName}>
 *           {project.projectName} - {project.roles.join(', ')}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */

/**
 * Örnek 2: Rol kontrolü ile buton gösterme
 *
 * ```jsx
 * function PostopDashboard() {
 *   const { hasRole } = useUserProjects()
 *
 *   const isAdmin = hasRole('Postop', 'Admin')
 *
 *   return (
 *     <div>
 *       <h1>Postop Dashboard</h1>
 *       {isAdmin && (
 *         <button>Admin Panel</button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */

/**
 * Örnek 3: Birden fazla rol kontrolü
 *
 * ```jsx
 * function AppointmentPage() {
 *   const { hasAnyRole } = useUserProjects()
 *
 *   const canEdit = hasAnyRole('Appointment', ['Admin', 'Doctor', 'Editor'])
 *
 *   return (
 *     <div>
 *       {canEdit && <button>Düzenle</button>}
 *     </div>
 *   )
 * }
 * ```
 */

/**
 * Örnek 4: Proje erişim kontrolü
 *
 * ```jsx
 * function TicketPage() {
 *   const { hasAccessToProject } = useUserProjects()
 *
 *   if (!hasAccessToProject('Ticket')) {
 *     return <div>Bu projeye erişim yetkiniz yok</div>
 *   }
 *
 *   return <TicketDashboard />
 * }
 * ```
 */

/**
 * Örnek 5: Redux selector ile (alternatif kullanım)
 *
 * ```jsx
 * import { useSelector } from 'react-redux'
 * import { selectUserRolesForProject, selectHasRole } from '@/store/slices/authSlice'
 *
 * function MyComponent() {
 *   const postopRoles = useSelector(selectUserRolesForProject('Postop'))
 *   const isAdmin = useSelector(selectHasRole('Postop', 'Admin'))
 *
 *   return (
 *     <div>
 *       Postop Roles: {postopRoles.join(', ')}
 *       {isAdmin && <p>You are admin!</p>}
 *     </div>
 *   )
 * }
 * ```
 */

/**
 * Örnek 6: Route Guard (Protected Route)
 *
 * ```jsx
 * import { Navigate } from 'react-router-dom'
 *
 * function AdminRoute({ children, projectName }) {
 *   const { isAdminInProject } = useUserProjects()
 *
 *   if (!isAdminInProject(projectName)) {
 *     return <Navigate to="/unauthorized" replace />
 *   }
 *
 *   return children
 * }
 *
 * // Kullanımı:
 * <Route
 *   path="/postop/admin"
 *   element={
 *     <AdminRoute projectName="Postop">
 *       <PostopAdminPanel />
 *     </AdminRoute>
 *   }
 * />
 * ```
 */

/**
 * Örnek 7: Tüm rolleri kontrol et
 *
 * ```jsx
 * function AdvancedFeature() {
 *   const { hasAllRoles } = useUserProjects()
 *
 *   const canAccess = hasAllRoles('Appointment', ['Admin', 'Doctor', 'ViewUser'])
 *
 *   if (!canAccess) {
 *     return <div>Bu özelliğe erişim için gerekli rollere sahip değilsiniz</div>
 *   }
 *
 *   return <AdvancedFeatureComponent />
 * }
 * ```
 */

/**
 * Örnek 8: Dinamik menü oluşturma
 *
 * ```jsx
 * function SidebarMenu() {
 *   const { hasAccessToProject } = useUserProjects()
 *
 *   const menuItems = [
 *     { name: 'Ticket', path: '/ticket', project: 'Ticket' },
 *     { name: 'Postop', path: '/postop', project: 'Postop' },
 *     { name: 'Appointment', path: '/appointment', project: 'Appointment' },
 *   ]
 *
 *   return (
 *     <nav>
 *       {menuItems.map(item => (
 *         hasAccessToProject(item.project) && (
 *           <Link key={item.path} to={item.path}>
 *             {item.name}
 *           </Link>
 *         )
 *       ))}
 *     </nav>
 *   )
 * }
 * ```
 */

export default useUserProjects