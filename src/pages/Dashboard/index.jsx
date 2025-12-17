import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, Row, Col, Typography, Table, Tag, Badge, Button, Spin, Empty, Skeleton } from 'antd'
import { useTranslation } from 'react-i18next'
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    CarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'

const { Title, Text } = Typography

// Türkçe locale
dayjs.locale('tr')

/**
 * Dashboard - Operasyonel Dashboard
 *
 * Hastane transfer yönetim sistemi ana dashboard'u.
 * Gerçek zamanlı istatistikler, grafik ve son transferleri gösterir.
 *
 * Özellikler:
 * - İstatistik kartları (API'den çekilen veriler)
 * - Anlık transfer haritası grafiği
 * - Son transferler tablosu (API'den çekilen veriler)
 * - Responsive tasarım
 *
 * @returns {JSX.Element} Operasyonel dashboard
 */
const Dashboard = () => {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Title level={2} className="mb-0 text-gray-900">
                    Operasyonel Dashboard
                </Title>

            </div>


        </div>
    )
}

export default Dashboard