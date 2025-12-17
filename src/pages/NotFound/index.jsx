import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';

import { ROUTES } from '@/constants/routes';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGoHome = () => {
    navigate(ROUTES.DASHBOARD);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center animate-fade-in">
        <Result
          status="404"
          title={
            <span className="text-6xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              404
            </span>
          }
          subTitle={
            <div className="space-y-2">
              <p className="text-xl text-gray-600">
                {t('notFound.title', 'Sayfa Bulunamadı')}
              </p>
              <p className="text-gray-400">
                {t('notFound.description', 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.')}
              </p>
            </div>
          }
          extra={
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Button
                type="primary"
                size="large"
                icon={<HomeOutlined />}
                onClick={handleGoHome}
                className="min-w-[160px]"
              >
                {t('notFound.goHome', 'Ana Sayfaya Git')}
              </Button>
              <Button
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
                className="min-w-[160px]"
              >
                {t('notFound.goBack', 'Geri Dön')}
              </Button>
            </div>
          }
        />

        {/* Decorative elements */}
        <div className="mt-12 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
