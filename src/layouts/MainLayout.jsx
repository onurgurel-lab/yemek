import { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Drawer } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import {
    LogoutOutlined,
    MenuOutlined,
    GlobalOutlined,
    DashboardOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { ROUTES } from '@/constants/routes';

const { Header, Content } = Layout;

/**
 * MainLayout - Transfer İletişim Projesi Ana Layout
 */
const MainLayout = () => {
    // Mobil menü görünürlüğü için state
    const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

    const { t, i18n } = useTranslation();  // Çoklu dil desteği
    const navigate = useNavigate();        // Sayfa yönlendirmeleri
    const location = useLocation();        // Aktif sayfa yolu
    const { user, logout } = useAuth();    // Kullanıcı bilgileri ve çıkış fonksiyonu

    /**
     * menuItems - Ana navigasyon menü öğeleri
     */
    const menuItems = [
        {
            key: ROUTES.DASHBOARD || '/dashboard',
            icon: <DashboardOutlined />,
            label: t('navigation.dashboard') || 'Dashboard',
            onClick: () => {
                navigate(ROUTES.DASHBOARD || '/dashboard');
                setMobileMenuVisible(false);
            },
        },
        {
            key: ROUTES.YEMEKHANE || '/yemekhane',
            icon: <CalendarOutlined />,
            label: 'Yemekhane',
            onClick: () => {
                navigate(ROUTES.YEMEKHANE || '/yemekhane');
                setMobileMenuVisible(false);
            },
        },
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
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: t('auth.logout') || 'Çıkış',
            danger: true,
            onClick: logout,
        },
    ];

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
                    className="flex items-center flex-shrink-0 px-4 cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => navigate(ROUTES.DASHBOARD || '/')}
                >
                    <img
                        src="/src/logo.png"
                        alt="Doku Gate Logo"
                        className="h-10 w-10 mr-3"
                    />
                    {/* Uygulama adı (mobile'da gizli) */}
                    <div className="hidden sm:block">
                        <h1 className="text-white text-xl font-bold tracking-wide uppercase">
                            {import.meta.env.VITE_APP_NAME || 'Transfer'}
                        </h1>
                        <p className="text-gray-300 text-xs">
                            {import.meta.env.VITE_APP_PROJECT_NAME || 'İletişim Sistemi'}
                        </p>
                    </div>
                </div>

                {/* Masaüstü Menü */}
                <div className="hidden lg:flex flex-1 items-center justify-center px-8">
                    <Menu
                        mode="horizontal"
                        selectedKeys={[location.pathname]}
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
                                    size={40}
                                    alt={user?.fullName || user?.username}
                                />
                            ) : (
                                <Avatar
                                    size={40}
                                    style={{
                                        backgroundColor: '#06b6d4',
                                        color: '#0f172a',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                                </Avatar>
                            )}
                            <div className="hidden md:block text-left">
                                <div className="text-sm font-medium text-white">
                                    {user?.fullName || user?.username || 'User'}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {user?.email || 'user@example.com'}
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
                    mode="vertical"
                    selectedKeys={[location.pathname]}
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

                    <p className="text-gray-500 text-sm mb-2">Dil Seçimi</p>
                    <Menu
                        items={languageMenuItems}
                        style={{ border: 0 }}
                    />

                    <Button
                        danger
                        block
                        icon={<LogoutOutlined />}
                        onClick={logout}
                        className="mt-4"
                    >
                        {t('auth.logout') || 'Çıkış'}
                    </Button>
                </div>
            </Drawer>

            {/* Ana İçerik Alanı */}
            <Content className="flex-1">
                <div className="px-4 sm:px-6 py-8">
                    <Outlet />
                </div>
            </Content>
        </Layout>
    );
};

export default MainLayout;