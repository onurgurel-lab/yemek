/**
 * MainLayout.jsx - Ana Layout Component
 *
 * Admin/RaporAdmin rollerine göre yönetim menülerini gösterir.
 * VITE_API_USER_ROLES'taki projeden roller alınır.
 *
 * Güncelleme: Yemekhane dropdown kaldırıldı, menüler doğrudan header'da listeleniyor
 * Menü Görüntüle kaldırıldı (Dashboard'da gösteriliyor)
 *
 * @module layouts/MainLayout
 */

import { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Drawer, Tag } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import {
    LogoutOutlined,
    MenuOutlined,
    GlobalOutlined,
    DashboardOutlined,
    UploadOutlined,
    SettingOutlined,
    BarChartOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { ROUTES } from '@/constants/routes';

const { Header, Content } = Layout;

/**
 * MainLayout - Transfer İletişim Projesi Ana Layout
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - İçerik
 */
const MainLayout = ({ children }) => {
    // Mobil menü görünürlüğü için state
    const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    // Rol kontrolü için hook
    const { canManageMenu, isAdmin, isYemekhaneAdmin, roles } = useUserRoles();

    /**
     * menuItems - Ana navigasyon menü öğeleri
     * Dropdown kaldırıldı, tüm menüler düz liste olarak header'da gösteriliyor
     */
    const menuItems = [
        // Dashboard - herkes görebilir
        {
            key: ROUTES.DASHBOARD || '/dashboard',
            icon: <DashboardOutlined />,
            label: t('navigation.dashboard') || 'Dashboard',
            onClick: () => {
                navigate(ROUTES.DASHBOARD || '/dashboard');
                setMobileMenuVisible(false);
            },
        },
        // Menü Yönetimi - sadece Admin/RaporAdmin (dropdown değil, doğrudan header'da)
        ...(canManageMenu ? [
            {
                key: ROUTES.YEMEKHANE_MANAGEMENT || '/yemekhane/yonetim',
                icon: <EditOutlined />,
                label: (
                    <span>
                        Menü Yönetimi
                        {isAdmin && (
                            <Tag color="red" style={{ marginLeft: 8, fontSize: '10px' }}>
                                Admin
                            </Tag>
                        )}
                        {isYemekhaneAdmin && !isAdmin && (
                            <Tag color="orange" style={{ marginLeft: 8, fontSize: '10px' }}>
                                Rapor
                            </Tag>
                        )}
                    </span>
                ),
                onClick: () => {
                    navigate(ROUTES.YEMEKHANE_MANAGEMENT || '/yemekhane/yonetim');
                    setMobileMenuVisible(false);
                },
            },
            // Excel Yükle - sadece Admin/RaporAdmin
            {
                key: ROUTES.YEMEKHANE_EXCEL || '/yemekhane/excel-yukle',
                icon: <UploadOutlined />,
                label: 'Excel Yükle',
                onClick: () => {
                    navigate(ROUTES.YEMEKHANE_EXCEL || '/yemekhane/excel-yukle');
                    setMobileMenuVisible(false);
                },
            },
            // Raporlar - sadece Admin/RaporAdmin
            {
                key: ROUTES.YEMEKHANE_REPORTS || '/yemekhane/raporlar',
                icon: <BarChartOutlined />,
                label: 'Raporlar',
                onClick: () => {
                    navigate(ROUTES.YEMEKHANE_REPORTS || '/yemekhane/raporlar');
                    setMobileMenuVisible(false);
                },
            },
        ] : []),
    ];

    /**
     * languageMenuItems - Dil seçim menüsü öğeleri
     */
    const languageMenuItems = [
        {
            key: 'tr',
            label: '🇹🇷 Türkçe',
            onClick: () => i18n.changeLanguage('tr'),
        },
        {
            key: 'en',
            label: '🇬🇧 English',
            onClick: () => i18n.changeLanguage('en'),
        },
    ];

    /**
     * Kullanıcı menüsü (profil dropdown)
     */
    const userMenuItems = [
        // Rol bilgisi göster
        {
            key: 'roles-info',
            type: 'group',
            label: (
                <div style={{ padding: '4px 0' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                        Roller:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {roles.length > 0 ? (
                            roles.map((role) => (
                                <Tag
                                    key={role}
                                    color={role === 'Admin' ? 'red' : role === 'RaporAdmin' ? 'orange' : 'blue'}
                                    style={{ fontSize: '10px' }}
                                >
                                    {role}
                                </Tag>
                            ))
                        ) : (
                            <Tag color="default" style={{ fontSize: '10px' }}>Rol yok</Tag>
                        )}
                    </div>
                </div>
            ),
        },
        { type: 'divider' },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: t('auth.logout') || 'Çıkış',
            danger: true,
            onClick: logout,
        },
    ];

    /**
     * Aktif menü anahtarlarını hesapla
     */
    const getSelectedKeys = () => {
        const path = location.pathname;
        return [path];
    };

    return (
        <Layout className="min-h-screen bg-gray-50">
            {/* Header - Üst navigasyon çubuğu */}
            <Header
                className="sticky top-0 z-50 flex items-center px-4 lg:px-8 shadow-md bg-gradient-to-r from-gray-800 to-gray-900"
                style={{
                    height: '70px',
                    padding: 0,
                }}
            >
                {/* Logo Bölümü - Tıklanabilir */}
                <div
                    className="flex items-center h-full px-4 cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => navigate(ROUTES.DASHBOARD || '/')}
                >
                    <img
                        src="/src/logo.png"
                        alt="Logo"
                        className="h-10 w-10 rounded-lg shadow-md"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <div className="ml-3 hidden sm:block">
                        <h1 className="text-white text-base font-bold tracking-wide m-0">
                            {import.meta.env.VITE_APP_NAME || 'Transfer'}
                        </h1>
                        <p className="text-gray-300 text-xs">
                            {import.meta.env.VITE_APP_PROJECT_NAME || 'İletişim Sistemi'}
                        </p>
                    </div>
                </div>

                {/* Masaüstü Menü - Düz liste (dropdown yok) */}
                <div className="hidden lg:flex flex-1 items-center justify-center px-8">
                    <Menu
                        mode="horizontal"
                        selectedKeys={getSelectedKeys()}
                        items={menuItems}
                        className="flex-1 bg-transparent border-0"
                        theme="dark"
                        style={{
                            lineHeight: '70px',
                            backgroundColor: 'transparent',
                        }}
                    />
                </div>

                {/* Sağ Bölüm - Kontroller */}
                <div className="flex items-center ml-auto pr-4 space-x-4">
                    {/* Mobil Menü Butonu */}
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={() => setMobileMenuVisible(true)}
                        className="lg:hidden text-white hover:bg-gray-700"
                    />

                    {/* Dil Değiştirici Dropdown */}
                    <Dropdown menu={{ items: languageMenuItems }} placement="bottomRight">
                        <Button
                            type="text"
                            className="text-white hover:bg-gray-700 hidden sm:flex items-center"
                        >
                            <GlobalOutlined className="text-lg" />
                            <span className="ml-1">{i18n.language.toUpperCase()}</span>
                        </Button>
                    </Dropdown>

                    {/* Kullanıcı Bilgileri ve Menü */}
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 hover:bg-opacity-50 px-3 py-2 rounded-lg transition">
                            {user?.profilePhoto ? (
                                <Avatar
                                    src={user.profilePhoto}
                                    alt={user?.fullName}
                                    size={36}
                                />
                            ) : (
                                <Avatar
                                    size={36}
                                    style={{ backgroundColor: '#06b6d4' }}
                                >
                                    {user?.fullName?.charAt(0) || 'U'}
                                </Avatar>
                            )}
                            <div className="hidden md:block text-left">
                                <div className="text-white text-sm font-medium">
                                    {user?.fullName || user?.username}
                                </div>
                                <div className="text-gray-400 text-xs">
                                    {canManageMenu ? (isAdmin ? 'Admin' : 'RaporAdmin') : 'Kullanıcı'}
                                </div>
                            </div>
                        </div>
                    </Dropdown>
                </div>
            </Header>

            {/* Mobil Drawer Menü */}
            <Drawer
                title={
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={() => {
                            navigate(ROUTES.DASHBOARD || '/');
                            setMobileMenuVisible(false);
                        }}
                    >
                        <img
                            src="/src/logo.png"
                            alt="Logo"
                            className="h-8 w-8 mr-2"
                        />
                        <span className="font-bold text-lg text-gray-800">Menü</span>
                    </div>
                }
                placement="left"
                onClose={() => setMobileMenuVisible(false)}
                open={mobileMenuVisible}
                width={280}
            >
                <Menu
                    mode="inline"
                    selectedKeys={getSelectedKeys()}
                    items={menuItems}
                    style={{ border: 0 }}
                />

                <div className="mt-4 pt-4 border-t border-gray-200 px-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Avatar
                            size={48}
                            style={{ backgroundColor: '#06b6d4' }}
                        >
                            {user?.fullName?.charAt(0) || 'U'}
                        </Avatar>
                        <div>
                            <div className="font-semibold text-gray-800">
                                {user?.fullName || user?.username}
                            </div>
                            <div className="text-xs text-gray-500">{user?.email}</div>
                        </div>
                    </div>

                    {/* Roller */}
                    <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-2">Roller:</div>
                        <div className="flex flex-wrap gap-1">
                            {roles.length > 0 ? (
                                roles.map((role) => (
                                    <Tag
                                        key={role}
                                        color={role === 'Admin' ? 'red' : role === 'RaporAdmin' ? 'orange' : 'blue'}
                                    >
                                        {role}
                                    </Tag>
                                ))
                            ) : (
                                <Tag color="default">Rol yok</Tag>
                            )}
                        </div>
                    </div>

                    {/* Dil Seçimi */}
                    <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-2">Dil:</div>
                        <div className="flex gap-2">
                            <Button
                                size="small"
                                type={i18n.language === 'tr' ? 'primary' : 'default'}
                                onClick={() => i18n.changeLanguage('tr')}
                            >
                                🇹🇷 TR
                            </Button>
                            <Button
                                size="small"
                                type={i18n.language === 'en' ? 'primary' : 'default'}
                                onClick={() => i18n.changeLanguage('en')}
                            >
                                🇬🇧 EN
                            </Button>
                        </div>
                    </div>

                    {/* Çıkış */}
                    <Button
                        danger
                        block
                        icon={<LogoutOutlined />}
                        onClick={logout}
                    >
                        {t('auth.logout') || 'Çıkış Yap'}
                    </Button>
                </div>
            </Drawer>

            {/* Ana İçerik */}
            <Content>
                {children}
            </Content>
        </Layout>
    );
};

export default MainLayout;