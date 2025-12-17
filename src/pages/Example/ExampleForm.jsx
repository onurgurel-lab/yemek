import { Button, Form, Space, Row, Col, DatePicker } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import * as yup from 'yup'
import FormInput from '@/components/form/FormInput'
import FormSelect from '@/components/form/FormSelect'
import { useNotification } from '@/hooks/useNotification'
import dayjs from 'dayjs'

/**
 * Validation Schema - Form doğrulama kuralları
 *
 * Yup kütüphanesi ile form alanlarının validasyon kurallarını tanımlar.
 * Her alan için zorunluluk, format ve özel kurallar belirtilir.
 */
const exampleSchema = yup.object().shape({
    patientFullName: yup.string().required('Hasta adı zorunludur'),
    patientEmail: yup.string().email('Geçerli bir email giriniz').required('Email zorunludur'),
    patientPhone: yup.string().required('Telefon numarası zorunludur'),
    doctor: yup.string().required('Doktor seçimi zorunludur'),
    salesConsultant: yup.string().required('Satış danışmanı zorunludur'),
    patientNation: yup.string().required('Ülke seçimi zorunludur'),
    operationDate: yup.date().required('Operasyon tarihi zorunludur'),
    postOpTypeId: yup.number().required('Postop tipi seçimi zorunludur'),
    guide: yup.string().required('Rehber seçimi zorunludur'),
})

/**
 * ExampleForm - Hasta bilgileri formu bileşeni
 *
 * Hasta post-operatif (ameliyat sonrası) bilgilerini eklemek veya düzenlemek
 * için kullanılan form. React Hook Form ile form yönetimi, Yup ile validasyon,
 * Ant Design ile UI bileşenleri kullanır.
 *
 * Özellikler:
 * - Responsive tasarım (mobil ve masaüstü uyumlu)
 * - Form validasyonu (Yup schema)
 * - Tarih seçici (DatePicker)
 * - Dropdown seçenekler (doktor, ülke, postop tipi)
 * - Textarea alanlar (notlar ve açıklamalar için)
 * - Yükleme durumu göstergesi
 *
 * @param {Object} initialData - Düzenleme modunda mevcut hasta verileri
 * @param {Function} onSuccess - Form başarıyla gönderildiğinde çağrılan callback
 * @param {Function} onCancel - İptal butonuna basıldığında çağrılan callback
 * @returns {JSX.Element} Form bileşeni
 */
const ExampleForm = ({ initialData, onSuccess, onCancel }) => {
    const { t } = useTranslation()                    // Çoklu dil desteği
    const dispatch = useDispatch()                     // Redux dispatch
    const { showSuccess, showError } = useNotification() // Bildirim fonksiyonları

    /**
     * React Hook Form setup
     * - resolver: Yup validation schema ile entegrasyon
     * - defaultValues: Form alanlarının başlangıç değerleri
     */
    const {
        control,        // Form kontrolcüsü (Controller bileşenleri için)
        handleSubmit,   // Form submit handler'ı
        formState: { errors, isSubmitting }, // Form durumu ve hatalar
    } = useForm({
        resolver: yupResolver(exampleSchema), // Yup validasyon
        defaultValues: {
            // Düzenleme modundaysa mevcut değerleri, değilse boş string
            patientFullName: initialData?.patientFullName || '',
            patientEmail: initialData?.patientEmail || '',
            patientPhone: initialData?.patientPhone || '',
            doctor: initialData?.doctor || '',
            salesConsultant: initialData?.salesConsultant || '',
            patientNation: initialData?.patientNation || '',
            // Tarih için dayjs objesi oluştur
            operationDate: initialData?.operationDate ? dayjs(initialData.operationDate) : null,
            postOpTypeId: initialData?.postOpTypeId || '',
            postOpTypeName: initialData?.postOpTypeName || '',
            guide: initialData?.guide || '',
            processes: initialData?.processes || '',
            info: initialData?.info || '',
            salesDescription: initialData?.salesDescription || '',
        },
    })

    /**
     * onSubmit - Form gönderildiğinde çalışan fonksiyon
     *
     * Form verilerini işler, tarih formatını düzenler ve
     * onSuccess callback'ini çağırır.
     *
     * @param {Object} data - Form'dan gelen veriler
     */
    const onSubmit = async (data) => {
        try {
            // DatePicker'dan gelen dayjs objesini ISO string formatına çevir
            // API'nin kabul edebileceği standart tarih formatı
            const formData = {
                ...data,
                operationDate: data.operationDate ? data.operationDate.toISOString() : null,
            }

            if (initialData?.id) {
                // Update işlemi - Mevcut kaydı güncelle
                await onSuccess(formData)
            } else {
                // Create işlemi - Yeni kayıt oluştur
                await onSuccess(formData)
            }
        } catch (error) {
            // Hata durumunda bildirim göster
            showError('common.error')
        }
    }

    // Doktor seçenekleri - Dropdown için
    const doctorOptions = [
        { value: 'Dr.Serkan Aygin', label: 'Dr.Serkan Aygin' },
        { value: 'Dr.Emirali Hamiloğlu', label: 'Dr.Emirali Hamiloğlu' },
        { value: 'Ersin Parsibay', label: 'Ersin Parsibay' },
    ]

    // PostOp (post-operatif) tipi seçenekleri - Dropdown için
    const postOpTypeOptions = [
        { value: 4, label: 'Türkiye Saç Postop' },
        { value: 5, label: 'Almanya Saç Postop' },
        { value: 6, label: 'USA Saç Postop' },
        { value: 7, label: 'ITL Saç Postop' },
        { value: 10, label: 'FRANSA Saç Postop' },
        { value: 12, label: 'SALUS Saç Postop' },
    ]

    // Ülke seçenekleri - Dropdown için
    const countryOptions = [
        { value: 'Turkey', label: 'Türkiye' },
        { value: 'Germany', label: 'Almanya' },
        { value: 'United States', label: 'Amerika Birleşik Devletleri' },
        { value: 'Italy', label: 'İtalya' },
        { value: 'France', label: 'Fransa' },
        { value: 'Poland', label: 'Polonya' },
        { value: 'Iraq', label: 'Irak' },
        { value: 'United Arab Emirates', label: 'Birleşik Arap Emirlikleri' },
        { value: 'Canada', label: 'Kanada' },
        { value: 'Spain', label: 'İspanya' },
        { value: 'Austria', label: 'Avusturya' },
        { value: 'Slovenia', label: 'Slovenya' },
        { value: 'Switzerland', label: 'İsviçre' },
        { value: 'Libya', label: 'Libya' },
        { value: 'Puerto Rico', label: 'Porto Riko' },
    ]

    return (
        // Ant Design Form - vertical layout (dikey düzen)
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            {/* İlk Satır: Hasta Adı ve E-posta */}
            <Row gutter={16}> {/* gutter: Kolonlar arası boşluk */}
                <Col xs={24} md={12}> {/* Mobilde tam genişlik, masaüstünde yarım */}
                    <FormInput
                        name="patientFullName"
                        label="Hasta Adı"
                        control={control}
                        error={errors.patientFullName}
                        placeholder="Hasta adını giriniz"
                    />
                </Col>
                <Col xs={24} md={12}>
                    <FormInput
                        name="patientEmail"
                        label="E-posta"
                        control={control}
                        error={errors.patientEmail}
                        placeholder="E-posta adresini giriniz"
                    />
                </Col>
            </Row>

            {/* İkinci Satır: Telefon ve Ülke */}
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <FormInput
                        name="patientPhone"
                        label="Telefon"
                        control={control}
                        error={errors.patientPhone}
                        placeholder="+90 555 555 5555"
                    />
                </Col>
                <Col xs={24} md={12}>
                    <FormSelect
                        name="patientNation"
                        label="Ülke"
                        control={control}
                        error={errors.patientNation}
                        placeholder="Ülke seçiniz"
                        options={countryOptions}
                    />
                </Col>
            </Row>

            {/* Üçüncü Satır: Doktor ve Satış Danışmanı */}
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <FormSelect
                        name="doctor"
                        label="Doktor"
                        control={control}
                        error={errors.doctor}
                        placeholder="Doktor seçiniz"
                        options={doctorOptions}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <FormInput
                        name="salesConsultant"
                        label="Satış Danışmanı"
                        control={control}
                        error={errors.salesConsultant}
                        placeholder="Satış danışmanı adını giriniz"
                    />
                </Col>
            </Row>

            {/* Dördüncü Satır: Operasyon Tarihi ve PostOp Tipi */}
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    {/* DatePicker için özel Form.Item (FormInput kullanılmıyor) */}
                    <Form.Item
                        label="Operasyon Tarihi"
                        validateStatus={errors.operationDate ? 'error' : ''}
                        help={errors.operationDate?.message}
                    >
                        <Controller
                            name="operationDate"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    {...field}
                                    style={{ width: '100%' }}
                                    placeholder="Tarih seçiniz"
                                    format="DD/MM/YYYY" // Gösterim formatı
                                    showTime              // Saat seçiciyi de göster
                                />
                            )}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <FormSelect
                        name="postOpTypeId"
                        label="PostOp Tipi"
                        control={control}
                        error={errors.postOpTypeId}
                        placeholder="PostOp tipi seçiniz"
                        options={postOpTypeOptions}
                    />
                </Col>
            </Row>

            {/* Beşinci Satır: Rehber ve Süreçler */}
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <FormInput
                        name="guide"
                        label="Rehber"
                        control={control}
                        error={errors.guide}
                        placeholder="Rehber adını giriniz"
                    />
                </Col>
                <Col xs={24} md={12}>
                    <FormInput
                        name="processes"
                        label="Süreçler"
                        control={control}
                        error={errors.processes}
                        placeholder="Süreçleri giriniz"
                    />
                </Col>
            </Row>

            {/* Altıncı Satır: Bilgi Notları (Tam genişlik textarea) */}
            <Row gutter={16}>
                <Col xs={24}>
                    <FormInput
                        name="info"
                        label="Bilgi Notları"
                        control={control}
                        error={errors.info}
                        placeholder="Ek bilgileri giriniz"
                        type="textarea"  // Çok satırlı metin alanı
                        rows={3}         // 3 satır yükseklik
                    />
                </Col>
            </Row>

            {/* Yedinci Satır: Satış Açıklaması (Tam genişlik textarea) */}
            <Row gutter={16}>
                <Col xs={24}>
                    <FormInput
                        name="salesDescription"
                        label="Satış Açıklaması"
                        control={control}
                        error={errors.salesDescription}
                        placeholder="Satış açıklamasını giriniz"
                        type="textarea"
                        rows={3}
                    />
                </Col>
            </Row>

            {/* Form Butonları: Kaydet/Güncelle ve İptal */}
            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Space> {/* Butonlar arası boşluk */}
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting} // Submit sırasında loading göster
                        size="large"
                    >
                        {/* Düzenleme modundaysa "Güncelle", değilse "Kaydet" */}
                        {initialData ? t('common.update') : t('common.save')}
                    </Button>
                    <Button
                        onClick={onCancel}
                        size="large"
                    >
                        {t('common.cancel')}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    )
}

export default ExampleForm