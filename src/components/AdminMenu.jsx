/**
 * AdminMenu - Admin/RaporAdmin kullanıcılar için yönetim menüsü
 *
 * Bu component MainLayout'taki menüye eklenebilir.
 * Sadece yetkili kullanıcılara yönetim seçeneklerini gösterir.
 *
 * @module components/AdminMenu
 */

import React from 'react';
import { Menu, Tag } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
    EditOutlined,
    UploadOutlined,
    BarChartOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { useUserRoles } from '@/hooks/useUserRoles';

/**
 * Admin menü öğeleri konfigürasyonu
 */
const ADMIN_MENU_CONFIG = [
    {
        key: '/yemekhane/yonetim',
        path: '/yemekhane/yonetim',
        label: 'Menü Yönetimi',
        icon: <EditOutlined />,
    },
    {
        key: '/yemekhane/excel-yukle',
        path: '/yemekhane/excel-yukle',
        label: 'Excel Yükle',
        icon: <UploadOutlined />,
    },
    {
        key: '/yemekhane/raporlar',
        path: '/yemekhane/raporlar',
        label: 'Raporlar',
        icon: <BarChartOutlined />,
    },
];

/**
 * AdminMenuItems - Ant Design Menu için admin öğeleri döndürür
 * MainLayout'taki Menu items dizisine spread edilebilir
 *
 * @returns {Object|null} Menu item objesi veya null
 */
export const getAdminMenuItems = (canManageMenu) => {
    if (!canManageMenu) return null;

    return {
        key: 'admin-menu',
        icon: <SettingOutlined />,
        label: 'Yönetim',
        children: ADMIN_MENU_CONFIG.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.path}>{item.label}</Link>,
        })),
    };
};

/**
 * AdminMenuSubMenu - SubMenu olarak kullanılabilir
 *
 * @example
 * <Menu>
 *   <Menu.Item>Ana Sayfa</Menu.Item>
 *   <AdminMenuSubMenu />
 * </Menu>
 */
export const AdminMenuSubMenu = () => {
    const location = useLocation();
    const { canManageMenu } = useUserRoles();

    if (!canManageMenu) return null;

    const selectedKeys = [location.pathname];

    return (
        <Menu.SubMenu
            key="admin-submenu"
            icon={<SettingOutlined />}
            title={
                <span>
                    Yönetim
                    <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>
                        Admin
                    </Tag>
                </span>
            }
        >
            {ADMIN_MENU_CONFIG.map((item) => (
                <Menu.Item
                    key={item.key}
                    icon={item.icon}
                    className={selectedKeys.includes(item.key) ? 'ant-menu-item-selected' : ''}
                >
                    <Link to={item.path}>{item.label}</Link>
                </Menu.Item>
            ))}
        </Menu.SubMenu>
    );
};

/**
 * AdminMenuList - Basit liste olarak gösterir
 * Sidebar veya Dropdown içinde kullanılabilir
 */
export const AdminMenuList = ({ onClick }) => {
    const { canManageMenu, isAdmin, isYemekhaneAdmin } = useUserRoles();

    if (!canManageMenu) return null;

    return (
        <div className="admin-menu-list">
            <div className="admin-menu-header">
                <SettingOutlined style={{ marginRight: 8 }} />
                <span>Yönetim Paneli</span>
                {isAdmin && <Tag color="red" size="small">Admin</Tag>}
                {isYemekhaneAdmin && !isAdmin && <Tag color="orange" size="small">RaporAdmin</Tag>}
            </div>

            <Menu mode="inline" style={{ border: 'none' }}>
                {ADMIN_MENU_CONFIG.map((item) => (
                    <Menu.Item
                        key={item.key}
                        icon={item.icon}
                        onClick={() => onClick?.(item.path)}
                    >
                        <Link to={item.path}>{item.label}</Link>
                    </Menu.Item>
                ))}
            </Menu>
        </div>
    );
};

/**
 * useAdminMenu - Admin menü hook'u
 * Menü öğelerini ve yetki durumunu döndürür
 */
export const useAdminMenu = () => {
    const { canManageMenu, isAdmin, isYemekhaneAdmin } = useUserRoles();

    return {
        canManageMenu,
        isAdmin,
        isYemekhaneAdmin,
        menuItems: canManageMenu ? ADMIN_MENU_CONFIG : [],
        getMenuItemsForAntd: () => getAdminMenuItems(canManageMenu),
    };
};

export default AdminMenuSubMenu;