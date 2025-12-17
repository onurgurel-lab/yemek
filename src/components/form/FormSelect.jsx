// components/form/FormSelect.jsx
import { Form, Select } from 'antd'
import { Controller } from 'react-hook-form'

/**
 * FormSelect - React Hook Form ile entegre Ant Design select (seçim kutusu) bileşeni
 *
 * React Hook Form'un Controller bileşenini kullanarak Ant Design Select
 * bileşenini yönetir. Dropdown menü ile kullanıcının önceden tanımlanmış
 * seçenekler arasından seçim yapmasını sağlar.
 *
 * @param {string} name - Form alanının adı (React Hook Form için)
 * @param {object} control - React Hook Form'dan gelen control objesi
 * @param {string} label - Select için görünen etiket metni
 * @param {object} error - Hata objesi (message özelliği içerebilir)
 * @param {Array} options - Seçim listesi [{value: '', label: ''}, ...]
 * @param {object} props - Select bileşenine aktarılacak ek özellikler (mode, placeholder, vb.)
 * @returns {JSX.Element} Controlled select (dropdown) bileşeni
 */
const FormSelect = ({ name, control, label, error, options, ...props }) => {
    return (
        // Ant Design Form.Item - Label ve hata mesajlarını yönetir
        <Form.Item
            label={label}
            // Hata varsa 'error' durumunu göster (kırmızı border)
            validateStatus={error ? 'error' : ''}
            // Hata mesajını input altında göster
            help={error?.message}
        >
            {/* React Hook Form Controller - Select'i kontrol eder */}
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    // Ant Design Select bileşeni
                    // field objesi value, onChange gibi özellikleri içerir
                    <Select {...field} {...props}>
                        {/* Seçenekleri map ile dön ve Option bileşenlerini oluştur */}
                        {options?.map(option => (
                            <Select.Option key={option.value} value={option.value}>
                                {option.label}
                            </Select.Option>
                        ))}
                    </Select>
                )}
            />
        </Form.Item>
    )
}

export default FormSelect