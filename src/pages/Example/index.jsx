import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Button, Table, Space, Modal, Typography, Input, Row, Col, Badge } from 'antd'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, ClearOutlined, UserOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { fetchExamples, deleteExample, createExample, updateExample } from '@/store/slices/exampleSlice'
import ExampleForm from './ExampleForm'
import { useNotification } from '@/hooks/useNotification'

const { Title } = Typography
const { confirm } = Modal

/**
 * Example - Hasta kayıtları listesi ve CRUD işlemleri sayfası
 *
 * Post-operatif hasta verilerini listelemek, eklemek, düzenlemek ve silmek için
 * kullanılan ana bileşen. Gelişmiş filtreleme, sayfalama, responsive tasarım
 * ve modal form yönetimi içerir.
 *
 * Özellikler:
 * - CRUD işlemleri (Create, Read, Update, Delete)
 * - Gelişmiş filtreleme (genel arama, hasta adı)
 * - Sunucu tarafı sayfalama (server-side pagination)
 * - Responsive tasarım (mobil ve masaüstü uyumlu)
 * - Aktif filtre göstergeleri (badge ve tag'ler)
 * - Modal form ile ekleme/düzenleme
 * - Yükleme durumu göstergeleri
 * - Klavye kısayolları (Enter ile arama)
 *
 * @returns {JSX.Element} Example listesi sayfası
 */
const Example = () => {
    const { t } = useTranslation()                    // Çoklu dil desteği
    const dispatch = useDispatch()                     // Redux dispatch
    const { showSuccess, showError } = useNotification() // Bildirim fonksiyonları

    /**
     * Redux store'dan example state'ini al
     * Destructuring ile gerekli değerleri çıkar ve varsayılan değerler ata
     */
    const {
        examples = [],        // Hasta kayıtları listesi
        loading,              // Yükleme durumu
        totalRecords = 0,     // Toplam kayıt sayısı
        pageNumber = 1,       // Mevcut sayfa numarası
        pageSize = 30,        // Sayfa başına kayıt sayısı
        totalPages = 0        // Toplam sayfa sayısı
    } = useSelector((state) => state.example)

    // Modal ve form state'leri
    const [isModalOpen, setIsModalOpen] = useState(false)           // Modal açık/kapalı durumu
    const [selectedExample, setSelectedExample] = useState(null)    // Düzenlenen kayıt
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768) // Mobil görünüm kontrolü
    const [isFilterOpen, setIsFilterOpen] = useState(false)         // Filtre alanı açık/kapalı

    /**
     * Filtreleme state'leri
     * filters: Kullanıcının girdiği değerler (henüz uygulanmamış)
     * appliedFilters: Uygulanmış filtreler (arama yapıldıktan sonra)
     */
    const [filters, setFilters] = useState({
        searchText: '', // Genel arama metni
        name: ''        // Hasta adı filtresi
    })

    const [appliedFilters, setAppliedFilters] = useState({
        searchText: '',
        name: ''
    })

    const [isSearching, setIsSearching] = useState(false) // Arama yükleme durumu

    /**
     * useRef ile ilk yükleme kontrolü
     * Component re-render olsa bile değeri korunur
     * Gereksiz API çağrılarını önler
     */
    const isInitialMount = useRef(true)

    /**
     * Ekran boyutu değişimlerini dinle
     * Responsive davranış için mobil/masaüstü kontrolü
     */
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        window.addEventListener('resize', handleResize)
        // Cleanup: Component unmount olduğunda listener'ı kaldır
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    /**
     * loadData - Sunucudan verileri yükleyen fonksiyon
     *
     * Sayfalama ve filtreleme parametreleri ile API'den veri çeker.
     * useCallback ile memoize edilmiş - gereksiz yeniden oluşturulmasını önler.
     *
     * @param {number} page - Sayfa numarası
     * @param {number} size - Sayfa başına kayıt sayısı
     * @param {Object} filterParams - Filtre parametreleri
     * @returns {Promise} Redux thunk promise
     */
    const loadData = useCallback((page = 1, size = 30, filterParams = {}) => {
        const params = {
            pageNumber: page,
            pageSize: size
        }

        // Genel arama metni varsa allData parametresini ekle
        if (filterParams.searchText && filterParams.searchText.trim() !== '') {
            params.allData = filterParams.searchText.trim()
        }

        // Hasta adı filtresi varsa ekle
        if (filterParams.name && filterParams.name.trim() !== '') {
            params.name = filterParams.name.trim()
        }

        // Redux action'ını dispatch et
        return dispatch(fetchExamples(params))
    }, [dispatch])

    /**
     * İlk yükleme effect'i
     * Component mount olduğunda sadece bir kez çalışır
     * isInitialMount ref'i ile kontrol edilir
     */
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false // Flag'i false yap
            loadData() // İlk veriyi yükle
        }
    }, []) // Boş dependency array - sadece mount'ta çalışır

    /**
     * handleSearch - Arama butonuna tıklandığında çalışır
     *
     * Girilen filtreleri uygular ve ilk sayfadan arama yapar
     */
    const handleSearch = () => {
        setIsSearching(true) // Yükleme göstergesini başlat

        // Mevcut filtre değerlerini kopyala
        const searchParams = {
            searchText: filters.searchText,
            name: filters.name
        }

        setAppliedFilters(searchParams) // Uygulanmış filtreleri güncelle

        // Desktop'ta arama yapınca filtre alanını açık tut
        if (!isMobile && (searchParams.searchText || searchParams.name)) {
            setIsFilterOpen(true)
        }

        // İlk sayfaya dön ve filtreleri uygulayarak ara
        loadData(1, pageSize, searchParams)
            .finally(() => setIsSearching(false)) // Yükleme tamamlandığında göstergeyi kapat
    }

    /**
     * handleClearFilters - Tüm filtreleri temizler
     *
     * Filtre input'larını ve uygulanmış filtreleri sıfırlar,
     * filtresiz veri getirir
     */
    const handleClearFilters = () => {
        const emptyFilters = {
            searchText: '',
            name: ''
        }

        setFilters(emptyFilters)         // Input değerlerini temizle
        setAppliedFilters(emptyFilters)  // Uygulanmış filtreleri temizle
        setIsSearching(true)

        // Filtresiz veri getir
        loadData(1, pageSize, {})
            .finally(() => setIsSearching(false))
    }

    /**
     * handleNameChange - Hasta adı input değişimi
     * @param {Event} e - Input change event
     */
    const handleNameChange = (e) => {
        setFilters({
            ...filters,
            name: e.target.value
        })
    }

    /**
     * handleSearchTextChange - Genel arama input değişimi
     * @param {Event} e - Input change event
     */
    const handleSearchTextChange = (e) => {
        setFilters({
            ...filters,
            searchText: e.target.value
        })
    }

    /**
     * handleKeyPress - Enter tuşuna basıldığında arama yap
     * @param {Event} e - Keyboard event
     */
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    /**
     * handleDelete - Kayıt silme işlemi
     *
     * Onay modalı gösterir, onaylanırsa kaydı siler ve listeyi günceller
     *
     * @param {number} id - Silinecek kaydın ID'si
     */
    const handleDelete = (id) => {
        confirm({
            title: t('common.confirm'),
            content: t('messages.confirmDelete'),
            onOk: async () => {
                try {
                    await dispatch(deleteExample(id)).unwrap()
                    showSuccess('messages.deleteSuccess')

                    // Eğer sayfada sadece 1 kayıt kaldıysa ve ilk sayfada değilsek
                    // bir önceki sayfaya git (pagination mantığı)
                    if (examples.length === 1 && pageNumber > 1) {
                        loadData(pageNumber - 1, pageSize, appliedFilters)
                    } else {
                        // Aksi takdirde mevcut sayfayı yeniden yükle
                        loadData(pageNumber, pageSize, appliedFilters)
                    }
                } catch (error) {
                    showError('common.error')
                }
            },
        })
    }

    /**
     * handleEdit - Düzenleme modalını aç
     * @param {Object} record - Düzenlenecek kayıt
     */
    const handleEdit = (record) => {
        setSelectedExample(record)
        setIsModalOpen(true)
    }

    /**
     * handleAdd - Yeni kayıt ekleme modalını aç
     */
    const handleAdd = () => {
        setSelectedExample(null) // Boş form için null
        setIsModalOpen(true)
    }

    /**
     * handleModalClose - Modal'ı kapat ve state'i temizle
     */
    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedExample(null)
    }

    /**
     * handleFormSuccess - Form başarıyla gönderildiğinde çalışır
     *
     * Ekleme veya güncelleme işlemini yapar, başarı bildirimi gösterir
     * ve listeyi yeniler
     *
     * @param {Object} values - Form değerleri
     */
    const handleFormSuccess = async (values) => {
        try {
            if (selectedExample) {
                // Update işlemi - Mevcut kaydı güncelle
                await dispatch(updateExample({
                    id: selectedExample.id,
                    data: values
                })).unwrap()
                showSuccess('messages.updateSuccess')
            } else {
                // Create işlemi - Yeni kayıt oluştur
                await dispatch(createExample(values)).unwrap()
                showSuccess('messages.createSuccess')
            }

            handleModalClose() // Modal'ı kapat
            // Mevcut sayfayı yeniden yükle (filtreler korunur)
            loadData(pageNumber, pageSize, appliedFilters)
        } catch (error) {
            showError('common.error')
        }
    }

    /**
     * handleTableChange - Tablo değişikliklerini yönetir
     *
     * Sayfalama, sıralama veya filtreleme değiştiğinde çalışır
     *
     * @param {Object} pagination - Pagination bilgisi
     * @param {Object} filters - Tablo filtreleri
     * @param {Object} sorter - Sıralama bilgisi
     */
    const handleTableChange = (pagination, filters, sorter) => {
        // Yeni sayfa veya sayfa boyutu ile veri yükle (filtreler korunur)
        loadData(pagination.current, pagination.pageSize, appliedFilters)
    }

    /**
     * columns - Tablo kolon tanımları
     *
     * Her kolon için başlık, veri anahtarı, genişlik, render fonksiyonu
     * ve stil özellikleri tanımlanır
     */
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            className: 'text-gray-700',
        },
        {
            title: t('example.form.name') || 'Hasta Adı',
            dataIndex: 'patientFullName',
            key: 'patientFullName',
            className: 'text-gray-700',
            ellipsis: true, // Uzun metinleri kes ve ... göster
        },
        {
            title: 'E-posta',
            dataIndex: 'patientEmail',
            key: 'patientEmail',
            className: 'text-gray-600',
            ellipsis: true,
        },
        {
            title: 'Telefon',
            dataIndex: 'patientPhone',
            key: 'patientPhone',
            className: 'text-gray-600',
            width: 150,
        },
        {
            title: 'Doktor',
            dataIndex: 'doctor',
            key: 'doctor',
            className: 'text-gray-600',
            ellipsis: true,
        },
        {
            title: 'Satış Danışmanı',
            dataIndex: 'salesConsultant',
            key: 'salesConsultant',
            className: 'text-gray-600',
            ellipsis: true,
        },
        {
            title: 'Ülke',
            dataIndex: 'patientNation',
            key: 'patientNation',
            className: 'text-gray-600',
            width: 120,
        },
        {
            title: 'Operasyon Tarihi',
            dataIndex: 'operationDate',
            key: 'operationDate',
            className: 'text-gray-600',
            width: 150,
            // Tarihi Türkçe formatında göster (DD.MM.YYYY)
            render: (date) => date ? new Date(date).toLocaleDateString('tr-TR') : '-'
        },
        {
            title: t('common.actions'),
            key: 'actions',
            // Masaüstünde sağa sabitle, mobilde normal kolon
            fixed: window.innerWidth > 768 ? 'right' : false,
            width: 200,
            // Her satır için düzenle ve sil butonları
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        className="hover:border-gray-600"
                    >
                        {t('common.edit')}
                    </Button>
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    >
                        {t('common.delete')}
                    </Button>
                </Space>
            ),
        },
    ]

    /**
     * Aktif filtre sayısını hesapla
     * Boolean değerlere dönüştür ve true olanları say
     */
    const activeFilterCount = [
        appliedFilters.searchText,
        appliedFilters.name
    ].filter(Boolean).length

    return (
        <div className="space-y-4">
            {/* Başlık ve Ekle Butonu */}
            <div className="flex justify-between items-center">
                <Title level={2} className="text-gray-900">
                    Example Page
                    {/* Toplam kayıt sayısını göster */}
                    {totalRecords > 0 && (
                        <span className="ml-2 text-sm font-normal text-gray-600">
                            ({totalRecords.toLocaleString('tr-TR')} kayıt)
                        </span>
                    )}
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    size="large"
                >
                    {t('common.add')}
                </Button>
            </div>

            {/* Filtreleme Alanı - Responsive (hem desktop hem mobil) */}
            <div className="space-y-2">
                {/* Filtre Toggle Butonu - Açılır/kapanır panel */}
                <Button
                    type={activeFilterCount > 0 ? "primary" : "default"} // Aktif filtre varsa primary renk
                    icon={<FilterOutlined />}
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="w-full flex items-center justify-between"
                    size="large"
                >
                    <span className="flex items-center gap-2">
                        Filtrele
                        {/* Aktif filtre sayısı badge'i */}
                        {activeFilterCount > 0 && (
                            <Badge
                                count={activeFilterCount}
                                className="ml-2"
                                style={{ backgroundColor: '#52c41a' }}
                            />
                        )}
                    </span>
                    {/* Açık/kapalı ok ikonu */}
                    {isFilterOpen ? <UpOutlined /> : <DownOutlined />}
                </Button>

                {/* Açılır Filtre Alanı - Conditionally render */}
                {isFilterOpen && (
                    <Card className="border border-gray-200 bg-gray-50 animate-fadeIn">
                        <div className="space-y-4">
                            {!isMobile ? (
                                // Desktop görünüm - Row/Col ile yan yana layout
                                <>
                                    <Row gutter={[16, 16]}>
                                        {/* Genel Arama Input'u */}
                                        <Col xs={24} sm={24} md={8} lg={8}>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-sm text-gray-600 font-medium">
                                                    Genel Arama
                                                </label>
                                                <Input
                                                    placeholder="Hasta adı, e-posta, telefon, doktor..."
                                                    value={filters.searchText}
                                                    onChange={handleSearchTextChange}
                                                    onKeyPress={handleKeyPress}
                                                    size="large"
                                                    allowClear
                                                    prefix={<SearchOutlined className="text-gray-400" />}
                                                />
                                            </div>
                                        </Col>

                                        {/* Hasta Adı Input'u */}
                                        <Col xs={24} sm={24} md={8} lg={8}>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-sm text-gray-600 font-medium">
                                                    Hasta Adı
                                                </label>
                                                <Input
                                                    placeholder="Hasta adı ile filtrele..."
                                                    value={filters.name}
                                                    onChange={handleNameChange}
                                                    onKeyPress={handleKeyPress}
                                                    size="large"
                                                    allowClear
                                                    prefix={<UserOutlined className="text-gray-400" />}
                                                />
                                            </div>
                                        </Col>

                                        {/* Arama ve Temizle Butonları */}
                                        <Col xs={24} sm={24} md={8} lg={8}>
                                            <div className="flex flex-col gap-1">
                                                {/* Boş label - Diğer kolonlarla hizalama için */}
                                                <label className="text-sm text-gray-600 font-medium lg:hidden">
                                                    &nbsp;
                                                </label>
                                                <div className="flex gap-2 lg:mt-7">
                                                    <Button
                                                        type="primary"
                                                        icon={<SearchOutlined />}
                                                        onClick={handleSearch}
                                                        loading={isSearching}
                                                        size="large"
                                                        className="flex-1"
                                                    >
                                                        Ara
                                                    </Button>
                                                    <Button
                                                        icon={<ClearOutlined />}
                                                        onClick={handleClearFilters}
                                                        size="large"
                                                        className="flex-1"
                                                    >
                                                        Temizle
                                                    </Button>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Aktif filtreler gösterimi - Desktop tag'leri */}
                                    {activeFilterCount > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <div className="flex flex-wrap gap-2">
                                                {appliedFilters.searchText && (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                                        <SearchOutlined className="text-xs" />
                                                        Arama: "{appliedFilters.searchText}"
                                                    </span>
                                                )}
                                                {appliedFilters.name && (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                                        <UserOutlined className="text-xs" />
                                                        Hasta Adı: "{appliedFilters.name}"
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                // Mobil görünüm - Dikey stack layout
                                <>
                                    {/* Genel Arama Input'u */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm text-gray-600 font-medium">
                                            Genel Arama
                                        </label>
                                        <Input
                                            placeholder="Hasta adı, e-posta, telefon..."
                                            value={filters.searchText}
                                            onChange={handleSearchTextChange}
                                            onKeyPress={handleKeyPress}
                                            size="large"
                                            allowClear
                                            prefix={<SearchOutlined className="text-gray-400" />}
                                        />
                                    </div>

                                    {/* Hasta Adı Input'u */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm text-gray-600 font-medium">
                                            Hasta Adı
                                        </label>
                                        <Input
                                            placeholder="Hasta adı ile filtrele..."
                                            value={filters.name}
                                            onChange={handleNameChange}
                                            onKeyPress={handleKeyPress}
                                            size="large"
                                            allowClear
                                            prefix={<UserOutlined className="text-gray-400" />}
                                        />
                                    </div>

                                    {/* Arama ve Temizle Butonları */}
                                    <div className="flex gap-2">
                                        <Button
                                            type="primary"
                                            icon={<SearchOutlined />}
                                            onClick={() => {
                                                handleSearch()
                                                // Mobilde arama yapınca filtre alanını kapat
                                                if (isMobile) {
                                                    setIsFilterOpen(false)
                                                }
                                            }}
                                            loading={isSearching}
                                            size="large"
                                            className="flex-1"
                                        >
                                            Ara
                                        </Button>
                                        <Button
                                            icon={<ClearOutlined />}
                                            onClick={() => {
                                                handleClearFilters()
                                                setIsFilterOpen(false) // Temizleyince kapat
                                            }}
                                            size="large"
                                            className="flex-1"
                                        >
                                            Temizle
                                        </Button>
                                    </div>

                                    {/* Aktif filtreler gösterimi - Mobil tag'leri */}
                                    {activeFilterCount > 0 && (
                                        <div className="pt-3 border-t border-gray-200">
                                            <div className="flex flex-wrap gap-2">
                                                {appliedFilters.searchText && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                        <SearchOutlined className="text-xs" />
                                                        "{appliedFilters.searchText}"
                                                    </span>
                                                )}
                                                {appliedFilters.name && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                        <UserOutlined className="text-xs" />
                                                        "{appliedFilters.name}"
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                )}
            </div>

            {/* Veri Tablosu */}
            <Card className="border border-gray-200">
                <Table
                    dataSource={examples}       // Tablo verisi
                    columns={columns}           // Kolon tanımları
                    loading={loading || isSearching} // Yükleme durumu
                    rowKey="id"                // Her satır için unique key
                    scroll={{ x: 1300 }}       // Horizontal scroll (responsive için)
                    className="border-gray-200"
                    onChange={handleTableChange} // Pagination/sort değişimlerini yakala
                    pagination={{
                        current: pageNumber,    // Mevcut sayfa
                        pageSize: pageSize,     // Sayfa başına kayıt
                        total: totalRecords,    // Toplam kayıt sayısı
                        showSizeChanger: true,  // Sayfa boyutu değiştirici göster
                        showQuickJumper: true,  // Hızlı sayfa geçişi göster
                        // Pagination bilgi metni
                        showTotal: (total, range) => {
                            if (!range || range.length < 2) return ''
                            return (
                                <span className="text-gray-600">
                                    {range[0]}-{range[1]} / {total.toLocaleString('tr-TR')} kayıt
                                    {/* Filtre uygulanmışsa göster */}
                                    {activeFilterCount > 0 && <span className="ml-1">(filtrelenmiş)</span>}
                                </span>
                            )
                        },
                        pageSizeOptions: ['10', '20', '30', '50', '100'], // Sayfa boyutu seçenekleri
                    }}
                />
            </Card>

            {/* Ekleme/Düzenleme Modal'ı */}
            <Modal
                title={<span className="text-gray-800">
                    {selectedExample ? t('common.edit') : t('common.add')}
                </span>}
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={null}              // Form kendi butonlarını yönetir
                destroyOnClose             // Kapanınca formu temizle
                width={700}
            >
                <ExampleForm
                    initialData={selectedExample}  // Düzenleme için mevcut veri
                    onSuccess={handleFormSuccess}  // Başarı callback'i
                    onCancel={handleModalClose}    // İptal callback'i
                />
            </Modal>
        </div>
    )
}

export default Example